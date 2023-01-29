import { Configuration, OpenAIApi } from "openai";

export class Gpt3Wrapper {
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
      throw new Error("Not initialiazed");
    }
    return await this.openai
      .createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        temperature: 0.7,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      })
      .then((response) => {
        const { data } = response;
        return data.choices && data.choices.length ? data.choices[0].text : "";
      });
  }
}
