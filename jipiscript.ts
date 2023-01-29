import { Gpt3Wrapper } from "./gpt3-wrapper.js";

export default class Jipiscript {
  private gpt: Gpt3Wrapper;
  private context: string;

  constructor(openaiApiKey: string, context: string = "") {
    this.gpt = new Gpt3Wrapper(openaiApiKey);
    this.context = context;
  }

  async ask(
    question: string,
    returnType:
      | typeof Object
      | typeof String
      | typeof Number
      | typeof Boolean = String,
    parameters = {}
  ): Promise<object | string | number | boolean> {
    return this.run(question, returnType, parameters);
  }

  async execute(
    task: string,
    returnType:
      | typeof Object
      | typeof String
      | typeof Number
      | typeof Boolean = String,
    parameters = {}
  ): Promise<object | string | number | boolean> {
    return this.run(task, returnType, parameters);
  }

  async run(
    action: string,
    returnType:
      | typeof Object
      | typeof String
      | typeof Number
      | typeof Boolean = String,
    parameters = {}
  ): Promise<object | string | number | boolean> {
    const prompt = populateParameters(action, parameters);

    // console.debug("Completion Request : ", prompt);

    if (returnType === String) {
      return await this.requestString(this.context, prompt);
    } else if (returnType === Number) {
      return await this.requestNumber(this.context, prompt);
    } else if (returnType === Boolean) {
      return await this.requestBoolean(this.context, prompt);
    } else if (returnType === Object) {
      return await this.requestObject(this.context, prompt);
    }

    return this.requestClass(this.context, prompt, returnType);
  }

  changeContext(context: string) {
    this.context = context;
    if (typeof context != "string") {
      throw new Error(
        "Stupid meatbag... The context must obviously be a string"
      );
    }
  }

  async requestString(context: string, prompt) {
    return await this.gpt.complete(context + prompt);
  }

  async requestNumber(context: string, prompt) {
    prompt = context + prompt + "\nAnswer with a number.\n";

    const response = +(await this.gpt.complete(prompt)).replaceAll("\n", "");

    if (isNaN(response)) {
      throw new Error("Robot on the loose! Number uprisi*%$$..");
    }

    return response;
  }

  async requestBoolean(context: string, prompt) {
    prompt = context + prompt + "\nAnswer with true or false.\n";

    const response = (await this.gpt.complete(prompt)).replaceAll("\n", "");

    if (response.toLowerCase() === "true") {
      return true;
    } else if (response.toLowerCase() === "false") {
      return false;
    } else {
      throw new Error("Robot on the loose! Boolean uprisi*%$$..");
    }
  }

  async requestClass(context: string, prompt, TargetClass) {
    const fields = Object.keys(new TargetClass());

    prompt =
      context +
      prompt +
      "\nYour answer must be in the form [" +
      fields.join(",") +
      "].\n";

    const response = (await this.gpt.complete(prompt))
      .replaceAll("\n", "")
      .slice(1, -1);

    // TODO Handle non string case?
    return new TargetClass(...response.split(","));
  }

  async requestObject(context: string, prompt: string) {
    prompt = context + prompt + "\nAnswer with a json.\n";

    const response = (await this.gpt.complete(prompt)).replaceAll("\n", "");

    return JSON.parse(response);
  }
}

// TODO If word is a parameter, it's not possible to have $word in the sentence, Improve that by allowing to escape $
function populateParameters(
  action: string,
  params: { [key: string]: any }
): string {
  let prompt = action;
  const keys = Object.keys(params).sort((a, b) => b.length - a.length);

  for (const key of keys) {
    prompt = prompt.replaceAll(`$${key}`, convertToString(params[key]));
  }

  return prompt;
}

function convertToString(param: any): string {
  if (param instanceof Array) {
    return convertArrayToString(param);
  } else if (typeof param === "object") {
    return convertObjectToString(param);
  }

  return param.toString();
}

function convertObjectToString(obj: object) {
  if (obj["toJson"]) {
    return obj["toJson"]();
  }
  return (
    obj.constructor.name +
    "(" +
    Object.entries(obj)
      .map((field) => field.join(": "))
      .join(", ") +
    ")"
  );
}

function convertArrayToString(array: any[]) {
  return (
    "[" +
    array
      .map((value, index) => index + ": " + convertToString(value))
      .join(", ") +
    "]"
  );
}
