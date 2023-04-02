interface LlmModel {
  complete(prompt): Promise<string>;
}
