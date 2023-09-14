export class JipiParseError extends Error {
  functionCalled: string;
  constructor(message, functionCalled) {
    super(message);
    this.name = "JipiParseError";
    this.functionCalled = functionCalled;
  }
}
