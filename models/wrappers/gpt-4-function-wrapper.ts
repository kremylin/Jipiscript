import { AsyncTryRetryNTimes } from "../../utils.js";
import { LlmChatModel } from "../llm-chat-model.js";
import { Message } from "../../message.js";

export class Gpt4FunctionWrapper implements LlmChatModel {
  private readonly openaiApiKey: string;
  private readonly config: {
    model: string;
    temperature: number;
    max_tokens: number;
    top_p: number;
    frequency_penalty: number;
    presence_penalty: number;
  };
  private readonly functions: any[];
  private readonly function_call: string | { name: string };

  constructor(
    openaiApiKey: string,
    {
      model = "gpt-4-0613",
      temperature = 0.7,
      max_tokens = 2049,
      top_p = 1,
      frequency_penalty = 0,
      presence_penalty = 0,
    } = {},
    functions?,
    function_call?
  ) {
    this.openaiApiKey = openaiApiKey;

    this.config = {
      model,
      temperature,
      max_tokens,
      top_p,
      frequency_penalty,
      presence_penalty,
    };
    this.functions = functions;
    this.function_call = function_call;
  }

  async chatCompletion(
    messages: Message[],
    functions?: any,
    function_call?: string | { name: string }
  ): Promise<Message> {
    functions = functions !== undefined ? functions : this.functions;
    function_call = function_call || this.function_call;

    if (this.openaiApiKey === null) {
      throw new Error("Not initialized");
    }
    return await AsyncTryRetryNTimes(async () => {
      const body = {
        ...this.config,
        messages,
        functions,
        function_call,
      };

      const url = "https://api.openai.com/v1/chat/completions";
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.openaiApiKey}`,
      };

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          console.log(await response.json());
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        return responseData.choices[0].message;
      } catch (error) {
        console.log(JSON.stringify(body, null, 2));
        console.error(`GPT4Manager: ${error.message}`);
        throw error;
      }
    }, 3);
  }
}
