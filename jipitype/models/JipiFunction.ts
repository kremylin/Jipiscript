export class JipiFunction extends Function {
  public jipiName: string;
  public description: string | null;
  public zodSchema: any; // Schema is a zod schema
  public f: Function;

  // TODO : clean this mess
  public __self__: this;

  constructor(name: string, description: string | null, zodSchema: any, f: Function) {
    super("...args", "return this.__call__(...args)");
    const self: any = this.bind(this);
    this.jipiName = name;
    this.description = description;
    this.zodSchema = zodSchema;
    this.f = f;

    //this.__self__ = this;

    self.jipiName = name;
    self.description = description;
    self.zodSchema = zodSchema;
    self.f = f;

    self.__self__ = this;
    return self;
  }

  __call__(...args: any[]) {
    return this.f(...args);
  }

  fromSchema(zodSchema) {
    const uniqueName = `JipiFunc_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    return new JipiFunction(uniqueName, null, zodSchema, (x) => x);
  }
}
