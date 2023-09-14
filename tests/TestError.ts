export class TestError extends Error {
  private infos: any;

  constructor(message, infos) {
    super(message);
    this.name = "TestError";
    this.infos = infos;
  }
}
