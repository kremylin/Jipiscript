export const MessageRole = {
  SYSTEM: "system",
  ASSISTANT: "assistant",
  FUNCTION: "function",
  USER: "user",
};

interface MessageOptions {
  role: string;
  content: string;
  name: string;
  function: string;
  function_call: string | { name: string };
}

export class Message {
  public role: string;
  public content: string;
  public name: string;
  public function: string;
  public function_call: string | { name: string; arguments?: string };

  constructor(
    role: string | MessageOptions,
    content: string,
    name?: string,
    f?: string,
    function_call?: string | { name: string; arguments?: string }
  ) {
    if (typeof role !== "string") {
      const options = role;
      role = options.role;
      content = options.content;
      name = options.name;
      f = options.function;
      function_call = options.function_call;
    }
    this.role = role;
    this.content = content;
    this.name = name;
    this.function = f;
    this.function_call = function_call;
  }
}
