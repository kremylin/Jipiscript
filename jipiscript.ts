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
    parameters = {},
    returnType:
      | typeof Object
      | typeof String
      | typeof Number
      | typeof Boolean = String,
    options: {
      structureSource: StructureSource;
      structure: Object;
    }
  ): Promise<object | string | number | boolean> {
    return this.run(question, parameters, returnType, options);
  }

  async execute(
    task: string,
    parameters = {},
    returnType:
      | typeof Object
      | typeof String
      | typeof Number
      | typeof Boolean = String,
    options: {
      structureSource: StructureSource;
      structure: Object;
    }
  ): Promise<object | string | number | boolean> {
    return this.run(task, parameters, returnType, options);
  }

  async run(
    action: string,
    parameters = {},
    returnType:
      | typeof Object
      | typeof String
      | typeof Number
      | typeof Boolean = String,
    options: {
      structureSource: StructureSource;
      structure: Object;
    }
  ): Promise<object | string | number | boolean> {
    const prompt = populateParameters(action, parameters);

    if (returnType === String) {
      return await this.requestString(this.context, prompt);
    } else if (returnType === Number) {
      return await this.requestNumber(this.context, prompt);
    } else if (returnType === Boolean) {
      return await this.requestBoolean(this.context, prompt);
    } else if (returnType === Object) {
      return await this.requestObject(this.context, prompt);
    }

    return this.requestClass(this.context, prompt, returnType, options);
  }

  changeContext(context: string) {
    if (typeof context != "string") {
      throw new Error(
        "Stupid meatbag... The context must obviously be a string"
      );
    }
    this.context = context;
  }

  async requestString(context: string, prompt: string) {
    return await this.gpt.complete(context + prompt);
  }

  async requestNumber(context: string, prompt: string) {
    prompt =
      "You are a computer, you must return the answer as a number\n" +
      "Examples:" +
      "Prompt(How many color are in a rainbow?)\n" +
      "Result(7)\n" +
      "Prompt(4.5+3.2)\n" +
      "Result(7.7)\n" +
      `Context : ${context}\n` +
      `Prompt(${prompt})\n`;

    const response = +(await this.complete(prompt));

    if (isNaN(response)) {
      throw new Error("Robot on the loose! Number uprisi*%$$..");
    }

    return response;
  }

  async requestBoolean(context: string, prompt) {
    prompt =
      "You are a computer, you must return the answer as a boolean\n" +
      "Examples:" +
      "Prompt(Is the sky blue?)\n" +
      "Result(true)\n" +
      "Prompt(Le ciel est-il jaune?)\n" +
      "Result(false)\n" +
      `Context : ${context}\n` +
      `Prompt(${prompt})\n`;

    const response = await this.complete(prompt);

    if (response.toLowerCase().startsWith("true")) {
      return true;
    } else if (response.toLowerCase().startsWith("false")) {
      return false;
    } else {
      throw new Error("Robot on the loose! Boolean uprisi*%$$..");
    }
  }

  getInstanceStructure(instance) {
    const structure = {};

    for (const key of Object.keys(instance)) {
      const type = typeof instance[key];
      if (type === "object" && instance[key]) {
        structure[key] = this.getInstanceStructure(instance[key]);
      } else if (type === "undefined") {
        structure[key] = "any";
      } else {
        structure[key] = type;
      }
    }

    return structure;
  }

  getClassStructure(TargetClass, options) {
    let structureSource = StructureSource.EmptyInstance;

    if (options?.structureSource) {
      structureSource = options.structureSource;
    } else if (options?.structure) {
      structureSource = StructureSource.Options;
    } else if (TargetClass?.jipi?.structure) {
      structureSource = StructureSource.JipiProperty;
    }

    return JSON.stringify(
      structureSource === StructureSource.Options
        ? options.structure
        : structureSource === StructureSource.JipiProperty
        ? TargetClass.jipi.structure
        : this.getInstanceStructure(new TargetClass())
    );
  }

  async requestClass(context: string, prompt: string, TargetClass, options) {
    const structure = this.getClassStructure(TargetClass, options);

    prompt =
      "You are a computer, you must return the answer as a json with the specified structure\n" +
      "Do not use thousands separator for numbers!\n" +
      "Examples:" +
      'Prompt(Name a flower, {"name":"string","color":"string"})\n' +
      'Result({"name":"rose","color":"red"})\n' +
      'Prompt(Quelle est la 4ème planète du système solaire?,{"nom":"string","rayon":"number","lunes":"array(string)"})\n' +
      'Result({"nom":"Mars","rayon":3389.5,"lunes":["phobos","deimos"]})\n' +
      `Context : ${context}\n` +
      `Prompt(${prompt},${structure})\n`;

    const response = await this.complete(prompt);

    try {
      return Object.assign(new TargetClass(), JSON.parse(response));
    } catch (e) {
      throw new Error(
        "Robot on the loose! Class uprisi*%$$.." +
          e.toString() +
          " - " +
          response
      );
    }
  }

  async requestObject(context: string, prompt: string) {
    prompt =
      "You are a computer, you must return the answer as a json\n" +
      "Examples:" +
      "Prompt(Name a flower)\n" +
      'Result({"name":"rose","color":"red"})\n' +
      "Prompt(Quelle est la 4ème planète du système solaire?)\n" +
      'Result({"nom":"Mars","rayon":3389.5,"lunes":["phobos","deimos"]})\n' +
      `Context : ${context}\n` +
      `Prompt(${prompt})\n`;

    const response = await this.complete(prompt);

    return JSON.parse(response);
  }

  async complete(prompt: string) {
    const response = (await this.gpt.complete(prompt)).replaceAll("\n", "");
    if (response.startsWith("Result(")) {
      return response.substring(7, response.length - 1);
    }
    return response;
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
  if (param === null) {
    return "null";
  } else if (param instanceof Array) {
    return convertArrayToString(param);
  } else if (typeof param === "object") {
    return convertObjectToString(param);
  }

  return param.toString();
}

function convertObjectToString(obj: object) {
  return obj.constructor.name + JSON.stringify(obj);
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

export enum StructureSource {
  EmptyInstance,
  JipiProperty,
  Options,
}
