import { Configuration, OpenAIApi } from "openai";

export class Gpt4Wrapper {
  private readonly openai;

  constructor(openaiApiKey: string) {
    this.openai = new OpenAIApi(
      new Configuration({
        apiKey: openaiApiKey,
      })
    );
  }

  async complete(prompt): Promise<string> {
    if (this.openai === null) {
      throw new Error("Not initialized");
    }
    return await this.openai
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
        return data.choices && data.choices.length
          ? data.choices[0].message.content
          : "";
      });
  }
}
