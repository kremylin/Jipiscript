import { Jipiscript, jipify, j, Gpt4FunctionWrapper } from "../index.js";
import { TestError } from "./TestError.js";
import { FunctionExecutionResult } from "../models/FunctionExecutionResult.js";

const jipi = new Jipiscript(new Gpt4FunctionWrapper(process.env.OPENAI_API_KEY));

const tests = [
  // 0.Ask a question get a string response
  async function ask_should_return_string() {
    console.log("ask_should_return_string");

    const response = await jipi.ask("What is the meaning of life?");

    if (typeof response !== "string") {
      throw new TestError("Expected string response", response);
    }

    console.log("\x1b[32m%s\x1b[0m", "ask_should_return_string: OK");
  },

  // 1.Ask a question get a response
  async function ask_should_return_basic_types() {
    console.log("ask_should_return_basic_types");

    // ------- String
    let response1 = await jipi.ask("What's the name of Superman's planet?", {}, String);
    let response2 = await jipi.ask("What's the name of Superman's planet?", {}, j.string("planet name"));

    if (typeof response1 !== "string") throw new TestError("Expected string response", response1);
    if (typeof response2 !== "string") throw new TestError("Expected string response", response2);

    // ------- Number
    response1 = await jipi.ask("How many legs does a human have?", {}, Number);
    response2 = await jipi.ask("How many legs does a human have?", {}, j.number("number of legs"));

    if (typeof response1 !== "number") throw new TestError("Expected number response", response1);
    if (typeof response2 !== "number") throw new TestError("Expected number response", response2);

    // ------- Boolean
    response1 = await jipi.ask("Do humans have legs?", {}, Boolean);
    response2 = await jipi.ask("Do humans have legs?", {}, j.boolean());

    if (typeof response1 !== "boolean") throw new TestError("Expected boolean response", response1);
    if (typeof response2 !== "boolean") throw new TestError("Expected boolean response", response2);

    console.log("\x1b[32m%s\x1b[0m", "ask_should_return_basic_types: OK");
  },

  // 2.Ask a question get a response in a specific format
  async function ask_should_return_specific_format() {
    console.log("ask_should_return_specific_format");

    const response: any = await jipi.ask(
      "What's the name of Superman's planet?",
      {},
      {
        name: j.string("planet name"),
        population: j.number("population"),
        president: { name: j.string("president name"), age: j.number("president age") },
        hasSun: j.boolean("has sun"),
      }
    );

    if (typeof response !== "object") throw new TestError("Expected object response", response);
    if (typeof response.name !== "string") throw new TestError("Expected string for name", response.name);
    if (typeof response.population !== "number")
      throw new TestError("Expected number for population", response.population);
    if (typeof response.president !== "object")
      throw new TestError("Expected object for president", response.president);
    if (typeof response.president.name !== "string")
      throw new TestError("Expected string for president name", response.president.name);
    if (typeof response.president.age !== "number")
      throw new TestError("Expected number for president age", response.president.age);
    if (typeof response.hasSun !== "boolean") throw new TestError("Expected boolean for hasSun", response.hasSun);

    console.log("\x1b[32m%s\x1b[0m", "ask_should_return_specific_format: OK");
  },

  // 3.Call should ask for the parameters of a function to a LLM then call it
  async function call_should_ask_for_parameters_then_call_function() {
    console.log("call_should_ask_for_parameters_then_call_function");

    let functionCalled = false;
    const response = await jipi.call(
      "Add a $animal1 number of legs and a $animal2 number of legs",
      { animal1: "dog", animal2: "duck" },
      jipify(
        ({ a, b }) => {
          functionCalled = true;
          return a + b;
        },
        { a: Number, b: Number },
        "add two numbers"
      )
    );

    if (!functionCalled) throw new TestError("Expected function to be called", { functionCalled, response });
    if (response !== 6) throw new TestError("Expected function to return 6", { functionCalled, response });

    console.log("\x1b[32m%s\x1b[0m", "call_should_ask_for_parameters_then_call_function: OK");
  },

  // 4.Give a task and functions to an LLM then let it run
  async function run_should_run_a_task() {
    console.log("run_should_run_a_task");

    const board = [];

    const writeVowel = jipify(
      function writeVowel({ vowel }) {
        if (vowel.length !== 1) return `${vowel} must be a single letter, it won't be written on the board`;
        if (!vowel.match(/[aeiou]/i)) return `${vowel} is not a vowel, it won't be written on the board`;

        board.push(vowel);
        return new FunctionExecutionResult(board.join(""), {
          function_call: { name: "writeConsonant" },
          interrupt: board.length >= 3,
        });
      },
      { vowel: j.string() },
      "write a vowel then return state of the board"
    );

    const writeConsonant = jipify(
      function writeConsonant({ consonant }) {
        if (consonant.length !== 1)
          return `${consonant} must be a single letter, it won't be written on the board`;
        if (consonant.match(/[aeiou]/i))
          return `${consonant} is not a consonant, it won't be written on the board`;

        board.push(consonant);
        return new FunctionExecutionResult(board.join(""), { function_call: { name: "writeVowel" } });
      },
      { consonant: j.string() },
      "write a consonant then return state of the board"
    );

    const response = await jipi.run(
      "Write a funny word on the blackboard, don't ask me any question, just do it",
      {},
      [writeVowel, writeConsonant]
    );

    if (!board.length) throw new TestError("Expected board not empty", { board, response });

    console.log("\x1b[32m%s\x1b[0m", "run_should_run_a_task: OK");
  },

  // 5.Use a class as return type
  async function ask_should_return_class() {
    console.log("ask_should_return_class");

    class Person {
      name;
      birthYear;
      constructor(name, birthYear) {
        this.name = name;
        this.birthYear = birthYear;
      }
    }

    jipify(Person, { firstname: "string", lastname: "string", birthYear: "number" }, (json) => {
      // Turning the received JSON data into a person
      return new Person(`${json.firstname} ${json.lastname}`, json.birthYear);
    });

    // Querying the model and getting a response of type Person
    const response = await jipi.ask("Who's the first black president of the USA?", {}, Person);

    if (!(response instanceof Person)) throw new TestError("Expected Person instance", response);
    if (typeof response.name !== "string") throw new TestError("Expected string for name", response.name);
    if (typeof response.birthYear !== "number")
      throw new TestError("Expected number for birthYear", response.birthYear);
    if (response.name !== "Barack Obama") throw new TestError("Expected Barack Obama for name", response.name);

    console.log("\x1b[32m%s\x1b[0m", "ask_should_return_class: OK");
  },
];

// si aucun parametre n'est passé, on lance tous les tests
if (!process.argv[2]) {
  (async function () {
    for (const test of tests) {
      await test();
    }
  })();
} else {
  // sinon on lance le test demandé
  console.log("Running test", process.argv[2]);
  tests[+process.argv[2]]();
}
