import { Configuration, OpenAIApi } from "openai";
import { AsyncTryRetryNTimes } from "../../utils.js";

export class Gpt4Wrapper {
  private readonly openai;
  private readonly config: {
    model: string;
    temperature: number;
    max_tokens: number;
    top_p: number;
    frequency_penalty: number;
    presence_penalty: number;
  };

  constructor(
    openaiApiKey: string,
    config = {
      model: "gpt-4-0613",
      temperature: 0.7,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    }
  ) {
    this.openai = new OpenAIApi(
      new Configuration({
        apiKey: openaiApiKey,
      })
    );

    this.config = config;
  }

  async complete(prompt): Promise<string> {
    if (this.openai === null) {
      throw new Error("Not initialized");
    }
    return await AsyncTryRetryNTimes(
      () =>
        this.openai
          .createChatCompletion({
            model: "gpt-4",
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 256,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
          })
          .then((response) => {
            const { data } = response;
            return data.choices && data.choices.length ? data.choices[0].message.content : "";
          }),
      3
    );
  }
}
