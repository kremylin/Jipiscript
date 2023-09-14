import { convertToString, isClass } from "./utils.js";
import { LlmFunctionRunner } from "./llm-function-runner.js";
import { LlmChatModel } from "./models/llm-chat-model.js";
import { Message, MessageRole } from "./message.js";
import { JipiFunction } from "./jipitype/models/JipiFunction.js";
import { normalize } from "./jipitype/jipitype.js";
import * as z from "zod";

type JipiReturnType =
  | typeof Object
  | typeof Array
  | Object
  | { new (...args: any[]): any }
  | typeof String
  | typeof Number
  | typeof Boolean
  | z.ZodType;

type Option = { structure?: Object };

export class Jipiscript {
  private functionRunner: LlmFunctionRunner;

  constructor(llmChatModel: LlmChatModel) {
    this.functionRunner = new LlmFunctionRunner(llmChatModel);
  }

  async chatCompletion(
    messages: Message[],
    functions?: JipiFunction | JipiFunction[],
    function_call?: string | { name: string }
  ): Promise<Message> {
    return this.functionRunner.chatCompletion(messages, functions, function_call);
  }

  async ask(
    action: string | Message[],
    parameters = {},
    returnType: JipiReturnType = String,
    options: Option = {}
  ): Promise<object | string | number | boolean> {
    const messages = Jipiscript.buildMessages(action, parameters);

    const result = await this.functionRunner.askThenGetResult(
      messages,
      Jipiscript.convertToZodSchema(returnType, options)
    );

    return Jipiscript.convertToReturnType(result, returnType);
  }

  // Surcharge
  async call(
    action: string | Message[],
    parameters: any,
    functions?: JipiFunction | JipiFunction[],
    function_call?: string | { name: string }
  ): Promise<object | string | number | boolean>;
  async call(
    action: string | Message[],
    functions: JipiFunction | JipiFunction[],
    function_call?: string | { name: string }
  ): Promise<object | string | number | boolean>;
  // Function
  async call(
    action: string | Message[],
    parametersOrFunction: Object | (JipiFunction | JipiFunction[]) = {},
    functionsOrFunctionCall?: (JipiFunction | JipiFunction[]) | (string | { name: string }),
    functionCall?: string | { name: string }
  ): Promise<object | string | number | boolean> {
    let { parameters, functions, function_call } = {
      parameters: parametersOrFunction as Object,
      functions: functionsOrFunctionCall as JipiFunction | JipiFunction[],
      function_call: functionCall as string | { name: string },
    };

    if (parameters instanceof JipiFunction || parameters instanceof Array) {
      parameters = {};
      functions = parametersOrFunction as JipiFunction | JipiFunction[];
      function_call = functionsOrFunctionCall as string | { name: string };
    }

    const messages = Jipiscript.buildMessages(action, parameters);

    return await this.functionRunner.askThenCallFunctionAndGetResult(
      messages,
      functions as JipiFunction | JipiFunction[],
      function_call
    );
  }

  // Surcharge
  async run(
    action: string | Message[],
    parameters?: Object,
    functions?: JipiFunction | JipiFunction[],
    function_call?: string | { name: string },
    returnType?: JipiReturnType,
    options?: Option
  ): Promise<object | string | number | boolean>;
  async run(
    action: string | Message[],
    functions: JipiFunction | JipiFunction[],
    function_call?: string | { name: string },
    returnType?: JipiReturnType,
    options?: Option
  ): Promise<object | string | number | boolean>;
  // Function
  async run(
    action: string | Message[],
    parametersOrFunctions: Object | (JipiFunction | JipiFunction[]) = {},
    functionsOrFunctionCall?: JipiFunction | JipiFunction[] | string | { name: string },
    functionCallOrReturnType?: string | { name: string } | JipiReturnType,
    returnTypeOrOptions?: JipiReturnType | Option,
    optionsOrNothing: Option = {}
  ): Promise<object | string | number | boolean> {
    let { parameters, functions, function_call, returnType, options } = {
      parameters: parametersOrFunctions as Object,
      functions: functionsOrFunctionCall as JipiFunction | JipiFunction[],
      function_call: functionCallOrReturnType as string | { name: string },
      returnType: returnTypeOrOptions as JipiReturnType,
      options: optionsOrNothing as Option,
    };

    if (parameters instanceof JipiFunction || parameters instanceof Array) {
      parameters = {};
      functions = parametersOrFunctions as JipiFunction | JipiFunction[];
      function_call = functionsOrFunctionCall as string | { name: string };
      returnType = functionCallOrReturnType as JipiReturnType;
      options = optionsOrNothing as Option;
    }

    returnType = returnType || String;
    options = options || {};

    const messages = Jipiscript.buildMessages(action, parameters);

    const result = await this.functionRunner.askThenLetLlmRunFunctions(
      messages,
      functions,
      function_call,
      Jipiscript.convertToZodSchema(returnType, options)
    );

    return Jipiscript.convertToReturnType(result, returnType);
  }

  //*************************************** Utilities ***************************************//
  private static buildMessages(action: string | Message[], parameters: {}) {
    if (typeof action === "string") {
      return [new Message(MessageRole.USER, Jipiscript.populateParameters(action, parameters))];
    } else {
      return action.map((message) => ({
        ...message,
        content: Jipiscript.populateParameters(message.content, parameters),
      }));
    }
  }

  private static convertToZodSchema(returnType, options: Option = {}) {
    let rawSchema = returnType;
    // Cas particulier où le return type est une classe et une structure est fournie
    if (isClass(returnType) && options.structure) {
      rawSchema = options.structure;
    }

    return normalize(rawSchema);
  }

  private static convertToReturnType(result, returnType: JipiReturnType) {
    if (!isClass(returnType)) return result;

    if (returnType && returnType.hasOwnProperty("fromJson"))
      return (returnType as { fromJson: Function }).fromJson(result);

    const ReturnClass = returnType as { new (...args: any[]): any; jipi?: any };

    if (ReturnClass.jipi) {
      return new ReturnClass(result);
    } else {
      // For non jipified classes, we are not sure the constructor works the way we intend it to
      return Object.assign(new ReturnClass(result), result);
    }
  }

  private static populateParameters(action: string, params: { [key: string]: any }): string {
    let prompt = action;
    const keys = Object.keys(params).sort((a, b) => b.length - a.length);

    for (const key of keys) {
      prompt = prompt.replaceAll(`$${key}`, convertToString(params[key]));
    }

    return prompt;
  }
}
