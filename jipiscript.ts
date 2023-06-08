import { convertToString, inferClassStructure } from "./utils.js";

export class Jipiscript {
  private llmModel: LlmModel;
  private context: string;

  constructor(llmModel: LlmModel, context: string = "") {
    this.llmModel = llmModel;
    this.context = context;
  }

  async ask(
    action: string,
    parameters = {},
    returnType:
      | typeof Object
      | typeof Array
      | Object
      | typeof String
      | typeof Number
      | typeof Boolean = String,
    options: {
      structureSource?: StructureSource;
      structure?: Object;
    }
  ): Promise<object | string | number | boolean> {
    return await this.run(action, parameters, returnType, options);
  }

  async run(
    action: string,
    parameters = {},
    returnType:
      | typeof Object
      | typeof Array
      | Object
      | typeof String
      | typeof Number
      | typeof Boolean = String,
    options: {
      structureSource?: StructureSource;
      structure?: Object;
    }
  ): Promise<object | string | number | boolean> {
    const prompt = populateParameters(action, parameters);

    if (returnType === String) {
      return await this.requestString(this.context, prompt);
    } else if (returnType === Number) {
      return await this.requestNumber(this.context, prompt);
    } else if (returnType === Boolean) {
      return await this.requestBoolean(this.context, prompt);
    } else if (returnType === Array) {
      return await this.requestArray(this.context, prompt, []);
    } else if (returnType instanceof Array) {
      return await this.requestArray(this.context, prompt, returnType);
    } else if (returnType === Object) {
      return await this.requestObject(this.context, prompt, {});
    } else if (returnType && returnType.constructor === Object) {
      return await this.requestObject(this.context, prompt, returnType);
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
    return await this.llmModel.complete(context + prompt);
  }

  async requestNumber(context: string, prompt: string) {
    prompt = `${context}
    ${prompt}
    ------------------------------------------
    Awaited Json format :
    {
      "response": number
    }`;

    const response = +JSON.parse(await this.complete(prompt)).response;

    if (isNaN(response)) {
      throw new Error("Robot on the loose! Number uprisi*%$$..");
    }

    return response;
  }

  async requestBoolean(context: string, prompt) {
    prompt = `${context}
    ${prompt}
    ------------------------------------------
    Awaited Json format :
    {
      "response": boolean
    }`;

    const response = JSON.parse(await this.complete(prompt)).response;

    if (typeof response != "boolean")
      throw new Error("Robot on the loose! Boolean uprisi*%$$..");

    return response;
  }

  async requestClass(
    context: string,
    prompt: string,
    TargetClass,
    options?: { structureSource?: StructureSource; structure?: Object }
  ) {
    const structure = this.getClassStructure(TargetClass, options);

    prompt = `${context}
    ${prompt}
    ------------------------------------------
    Awaited Json format :
    {
      "response": ${structure}
    }`;

    const response = await this.complete(prompt);

    try {
      return Object.assign(new TargetClass(), JSON.parse(response).response);
    } catch (e) {
      throw new Error(
        "Robot on the loose! Class uprisi*%$$.." +
          e.toString() +
          " - " +
          response
      );
    }
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
        : inferClassStructure(new TargetClass())
    );
  }

  async requestObject(context: string, prompt: string, returnType: Object) {
    prompt = `${context}
    ${prompt}
    ------------------------------------------
    Awaited Json format :
    {
      "response": ${JSON.stringify(returnType)}
    }`;

    const response = await this.complete(prompt);

    try {
      return JSON.parse(response).response;
    } catch (e) {
      throw new Error(
        "Robot on the loose! Object uprisi*%$$.." +
          e.toString() +
          " - " +
          response
      );
    }
  }

  async requestArray(context: string, prompt: string, returnType: Array<any>) {
    prompt = `${context}
    ${prompt}
    ------------------------------------------
    Awaited Json format :
    {
      "response": ${JSON.stringify(returnType)}
    }`;

    const response = await this.complete(prompt);

    try {
      return JSON.parse(response).response;
    } catch (e) {
      throw new Error(
        "Robot on the loose! Array uprisi*%$$.." +
          e.toString() +
          " - " +
          response
      );
    }
  }

  async complete(prompt: string) {
    return (await this.llmModel.complete(prompt)).replaceAll("\n", "");
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

export enum StructureSource {
  EmptyInstance,
  JipiProperty,
  Options,
}
