import { Message } from "../message.js";

export interface LlmChatModel {
  chatCompletion(messages, functions, function_call): Promise<Message>;
}
