import { JipiFunction } from "../jipitype/models/JipiFunction.js";
import { Message } from "../message.js";

export class FunctionExecutionResult {
  public readonly result: string;
  public readonly changes: {
    messages?: Message[];
    functions?: JipiFunction[];
    function_call?: string | { name: string };
    interrupt?: boolean;
  };

  constructor(
    result: string,
    changes: {
      messages?: Message[];
      functions?: JipiFunction[];
      function_call?: string | { name: string };
      interrupt?: boolean;
    } = {}
  ) {
    this.result = result;
    this.changes = changes;
  }
}
