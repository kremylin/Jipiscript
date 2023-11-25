import { Message, MessageRole } from "./message.js";
import { JipiFunction } from "./jipitype/models/JipiFunction.js";
import { FunctionExecutionResult } from "./models/FunctionExecutionResult.js";

export function inferStructure(object) {
  const type = typeof object;
  if (object instanceof Array) {
    return object.map(inferStructure);
  } else if (type === "object" && object) {
    const structure = {};
    for (const key of Object.keys(object)) {
      structure[key] = inferStructure(object[key]);
    }
    return structure;
  } else if (type === "undefined") {
    return "any";
  } else {
    return type;
  }
}

export function convertToString(param: any): string {
  if (param === null) {
    return "null";
  } else if (param instanceof Array) {
    return convertArrayToString(param);
  } else if (typeof param === "object") {
    return convertObjectToString(param);
  }

  return param.toString();
}

function convertObjectToString(obj: object) {
  return obj.constructor.name + JSON.stringify(obj);
}

function convertArrayToString(array: any[]) {
  return "[" + array.map((value, index) => index + ": " + convertToString(value)).join(", ") + "]";
}

export function tryRetryNTimes(f, n) {
  let currentException = null;
  for (let i = 0; i < n; i++) {
    try {
      return f();
    } catch (e) {
      currentException = e;
    }
  }
  throw currentException;
}

export async function AsyncTryRetryNTimes(f, n) {
  let currentException = null;
  for (let i = 0; i < n; i++) {
    try {
      return await f();
    } catch (e) {
      currentException = e;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw currentException;
}

export function isClass(c) {
  if (typeof c !== "function") return false;
  if (!c.prototype) return false;
  if (c === String || c === Number || c === Boolean || c === Date) return false;
  return c.prototype.constructor === c;
}

//************************* Disambiguation functions *************************//
export function stringOrMessageArrayToMessageArray(action: string | Message[]): Message[] {
  if (typeof action === "string") {
    return [new Message(MessageRole.USER, action)];
  }
  return action;
}

export function toJipiFunctionArray(functions: JipiFunction | JipiFunction[]): JipiFunction[] {
  if (functions instanceof JipiFunction) {
    return [functions];
  }
  return functions;
}

export function normalizeFunctionExecutionResult(
  response: string | FunctionExecutionResult
): FunctionExecutionResult {
  function stringify(response) {
    return String(response) === "[object Object]" ? JSON.stringify(response) : String(response);
  }

  if (typeof response === "string") {
    return new FunctionExecutionResult(stringify(response), {});
  }

  const result = response.changes.interrupt ? response.result : stringify(response.result);
  return new FunctionExecutionResult(result, response.changes);
}
