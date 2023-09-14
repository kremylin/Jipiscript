# Jipiscript

Jipiscript has changed... just a bit.

Jipiscript is a JavaScript library that allows you ~~to integrate OpenAI's GPT-3 language model into your projects.~~
~~<br/>It allows you to ask questions using natural language and parameters and receive answers or results in a variety of data formats without ever generating any code.~~
... Well  actually... it kind of still does that, but it also does much more!

## TL;DR What is it? What does it do?

With Jipiscript, you can:

- Send a parametrized prompt, specify the type of the answer! (string, number, array, object, custom class instance... sky isn't even a limit)
```javascript
const imdb = (series) => jipi.ask("get imdb details of $series", { series }, {
  title: j.string(),
  rating: j.number(),
  cast: [{ lastname: j.string(), superHeroName: j.string("wordPlay on his/her last name")}],
});

console.log(await imdb("Black Adder"));
```

```javascript
{
    title: 'Black Adder',
    rating: 8.1,
    cast: [
        { lastname: 'Atkinson', superHeroName: 'Atkinstorm' },
        { lastname: 'Robinson', superHeroName: 'Robinsman' },
        { lastname: 'Laurie', superHeroName: 'Doctor Laurie' },
        { lastname: 'Fry', superHeroName: 'Fry Fighter' }
    ]
}
```

- Make GPT execute a function
```javascript
    // This line will create a jipified function that will add a button to the body of the document
    // The function is still usable as a normal function
    const addButton = jipify(
        /**function**/({ text, color }) => {
            const button = document.createElement('button');
            button.innerText = text;
            button.style.backgroundColor = color;
            document.body.appendChild(button);
            return button;
        },
        /**parameters description**/{
            text: j.string("text to display on the button"),
            color: j.string("color of the button in hex format"),
        },
        /**function description**/"add a button to the body of the document"
    );

    // This line will add a blue button with the text "Hello" to the body of the document and return the button element
    const helloButton = addButton({ text: "Hello", color: "#0000ff" });
    
    // This line will add a funny button to the body of the document and return the button element
    const funnyButton = await jipi.call("add a funny button for a birthday card", {}, [addButton]);
```

- Give a task and a bunch of functions to GPT and let the magic happen
```javascript
    const functions = [
        jipify(
            function getContactElectronicAddress({ name }) {return `${name}@mail.com`},    //function
            { name: j.string("name of the contact") },                                    //parameters description
            "retrieve contact's electronic address"                                               //function description
        ),
  
        jipify(
          function listContacts() {return ["Guillaume", "Raj", "Jake"];},
          {},
          "list contacts"
        ),
  
        jipify(
          function fakeSendEmail({ address, subject, message }){
              console.log(`Sending email to ${address} with subject ${subject} and message ${message}`);
              return "mail sent";
          },
          {
              address: j.string(),
              subject: j.string(),
              message: j.string(), 
          },
          "send email"
        )
    ];


  await jipi.call("Send a welcome mail to the first 2 contacts", {}, functions);
```

## Installation

Using npm :

```shell
npm install --save jipiscript
```
## Initialization

Assuming  you already have an OpenAI API key set up as an environment variable:

```javascript
import { Jipiscript, jipify, j, Gpt4FunctionWrapper } from "jipiscript";

const jipi = new Jipiscript(new Gpt4FunctionWrapper(
  process.env.OPENAI_API_KEY,
  {
    model: "gpt-4-0613",
    temperature: 0.7,
    max_tokens: 2049,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  }
));
```


## Basic usage

- Simple example to retrieve an array of objects:
```javascript
const getCapitals = (countries) => jipi.ask("What are the capital of $countries?", { countries }, [{ name: String, inhabitants: Number}]);

console.log(await getCapitals(["France", "Belgium", "Canada"]));
/*[
    { name: 'Paris', inhabitants: 2148327 },
    { name: 'Brussels', inhabitants: 1211035 },
    { name: 'Ottawa', inhabitants: 934243 }
]*/
```

- Receive answer as an [instance of a class](docs/using-class-as-return-type.md).
```javascript
const Person = jipify(
  class {
    constructor({name, birthYear}) {
      this.name = name;
      this.birthYear = birthYear;
    }
  },
  { name: j.string(), birthYear: j.number()}
);

// This line create a new Person
const Person1 = new Person({ name: "James", birthYear: 1996 });

// This line will ask GPT-3 to find the first black president of the USA and return it as a Person instance
const Person2 = await jipi.ask("Who's the first black president of the USA?", {}, Person);
console.log(answer); // Person { name: "Barack Obama", birthYear: 1961 }
```