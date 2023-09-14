//TODO : add retrocompatibility
interface LlmModel {
  complete(prompt): Promise<string>;
}
