import { Message, MessageRole } from "./message.js";
import { LlmChatModel } from "./models/llm-chat-model.js";
import { JipiFunction } from "./jipitype/models/JipiFunction.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import * as z from "zod";
import { JipiParseError } from "./models/errors/JipiParseError.js";

import {
  toJipiFunctionArray,
  stringOrMessageArrayToMessageArray,
  normalizeFunctionExecutionResult,
} from "./utils.js";

export class LlmFunctionRunner {
  private readonly llmChatModel: LlmChatModel;

  constructor(llmChatModel: LlmChatModel) {
    this.llmChatModel = llmChatModel;
  }

  async chatCompletion(
    messages: Message[] | string,
    functions?: JipiFunction | JipiFunction[],
    function_call?: string | { name: string }
  ): Promise<Message> {
    // Allow passing a single message
    if (typeof messages === "string") {
      messages = [new Message(MessageRole.USER, messages)];
    }

    // Allow passing a single function
    if (functions instanceof JipiFunction) {
      functions = [functions];
    }

    // TODO : handle the case functions is undefined
    const jsonSchemas = functions.map(LlmFunctionRunner.getFunctionJsonSchema);

    return await this.llmChatModel.chatCompletion(messages, jsonSchemas, function_call);
  }

  async askThenGetResult(messages: Message[], returnSchema: z.ZodType): Promise<any> {
    // Allow passing a single message
    if (typeof messages === "string") {
      messages = [new Message(MessageRole.USER, messages)];
    }

    const function_call = { name: "return" };
    const functions = [
      {
        name: "return",
        description: "return response or result.",
        parameters: zodToJsonSchema(returnSchema),
      },
    ];

    const completeThenParse = async (llmChatModel: LlmChatModel, messages: Message[]) => {
      const message = await llmChatModel.chatCompletion(messages, functions, function_call);

      // TODO : is this case possible?
      if (!message.function_call) return message.content;

      try {
        return returnSchema.parse(LlmFunctionRunner.getMessageArguments(message));
      } catch (error) {
        throw new JipiParseError(error.message, (message.function_call as { name: string }).name);
      }
    };

    return await this.autoRetry(
      () => completeThenParse(this.llmChatModel, messages),
      3,
      (error) => messages.push(new Message(MessageRole.FUNCTION, error.message, error.functionCalled))
    );
  }

  async autoRetry(
    func: () => Promise<any>,
    numberOfRetryMax: number,
    onError: (error: JipiParseError) => void
  ): Promise<any> {
    let numberOfRetry = 0;
    while (true) {
      try {
        return await func();
      } catch (error) {
        if (numberOfRetryMax !== -1 && numberOfRetry >= numberOfRetryMax) {
          throw error;
        }
        numberOfRetry++;
        onError(error);
      }
    }
  }

  async askThenCallFunctionAndGetResult(
    messages: Message[] | string,
    functions: JipiFunction | JipiFunction[],
    function_call?: string | { name: string }
  ): Promise<any> {
    // Allow passing a single message
    if (typeof messages === "string") {
      messages = [new Message(MessageRole.USER, messages)];
    }
    // Allow passing a single function
    if (functions instanceof JipiFunction) {
      function_call = { name: functions.jipiName };
      functions = [functions];
    }

    const jsonSchemas = functions.map(LlmFunctionRunner.getFunctionJsonSchema);

    const completeThenParse = async (llmChatModel: LlmChatModel, messages: Message[]) => {
      const message = await llmChatModel.chatCompletion(messages, jsonSchemas, function_call);

      if (
        !message.function_call ||
        (typeof function_call == "object" &&
          (message.function_call as { name: string }).name !== function_call.name)
      ) {
        return message.content;
      }

      const f = (functions as JipiFunction[]).find(
        (f) => f.jipiName === (message.function_call as { name: string }).name
      );

      if (!f) {
        throw new JipiParseError(
          `Function ${(message.function_call as { name: string }).name} not found);`,
          (message.function_call as { name: string }).name
        );
      }

      try {
        // TODO : verif
        const parameters = LlmFunctionRunner.getMessageArguments(message);

        return f(f.zodSchema.parse(parameters));
      } catch (error) {
        throw new JipiParseError(error.message, (message.function_call as { name: string }).name);
      }
    };

    return await this.autoRetry(
      () => completeThenParse(this.llmChatModel, messages as Message[]),
      3,
      (error: JipiParseError) =>
        (messages as Message[]).push(new Message(MessageRole.FUNCTION, error.message, error.functionCalled))
    );
  }

  private filterFunctions(functions: JipiFunction[], function_call?: string | { name: string }): JipiFunction[] {
    // If a function is specified in function_call, we only keep this one, thus economizing tokens
    if (typeof function_call === "object" && function_call.name) {
      return functions.filter((f) => f.jipiName === (function_call as { name: string }).name);
    }
    return functions;
  }

  async askThenLetLlmRunFunctions(
    action: string | Message[],
    functionOrFunctions: JipiFunction | JipiFunction[],
    function_call?: string | { name: string },
    returnSchema?: z.ZodType
  ) {
    let messages = [...stringOrMessageArrayToMessageArray(action)];
    let functions = toJipiFunctionArray(functionOrFunctions);

    const returnFunctionSchema = {
      name: "return",
      description: "return response or result",
      parameters: zodToJsonSchema(returnSchema),
    };

    // Loop until "return" function is called
    while (true) {
      const message = await this.llmChatModel.chatCompletion(
        messages,
        [
          ...this.filterFunctions(functions, function_call).map(LlmFunctionRunner.getFunctionJsonSchema),
          returnFunctionSchema,
        ],
        function_call === "none" ? { name: "return" } : function_call
      );

      // If no function is called
      if (!message.function_call) {
        messages.push(
          message,
          new Message(MessageRole.USER, "No function has been called, use the functions and only the functions")
        );
        continue;
      }

      const calledFunctionName = (message.function_call as { name: string }).name;

      if (calledFunctionName === "return") {
        return returnSchema.parse(LlmFunctionRunner.getMessageArguments(message));
      }

      // Enforce calling a specific function
      if (typeof function_call == "object" && calledFunctionName !== function_call.name) {
        messages.push(message, new Message(MessageRole.FUNCTION, "Wrong function called", calledFunctionName));
        continue;
      }

      if (message.content) {
        // Afficher le content en jaune
        console.debug("\x1b[33m%s\x1b[0m", `A message has been passed as content: ${message.content}`);
      }

      const f = functions.find((f) => f.jipiName === calledFunctionName);

      if (!f) {
        messages.push(
          message,
          new Message(MessageRole.FUNCTION, `Function ${calledFunctionName} not found`, "functionNotFound")
        );
        continue;
      }

      // Afficher la fonction appelée en vert et les arguments en bleu
      console.debug(
        "\x1b[32m%s\x1b[0m",
        calledFunctionName,
        `: \x1b[34m${JSON.stringify(LlmFunctionRunner.getMessageArguments(message), null, 2)}\x1b[0m`
      );

      let result;
      try {
        const response = normalizeFunctionExecutionResult(
          await f(f.zodSchema.parse(LlmFunctionRunner.getMessageArguments(message)))
        );

        function_call = response.changes.hasOwnProperty("function_call")
          ? response.changes.function_call
          : function_call;

        functions = response.changes.hasOwnProperty("functions")
          ? toJipiFunctionArray(response.changes.functions)
          : functions;

        messages = response.changes.hasOwnProperty("messages") ? response.changes.messages : messages;

        result = response.result;

        if (response.changes.interrupt) {
          return result;
        }
      } catch (error) {
        result = error.message;
      }

      messages.push(message, new Message(MessageRole.FUNCTION, result, calledFunctionName));
    }
  }

  //****************************** Utilities ******************************//
  static getMessageArguments(message: Message) {
    return JSON.parse((message.function_call as { name: string; arguments: string }).arguments.replaceAll("\n", " "));
  }

  static getFunctionJsonSchema(f: JipiFunction) {
    return {
      name: f.jipiName,
      description: f.description,
      parameters: zodToJsonSchema(f.zodSchema),
    };
  }
}
