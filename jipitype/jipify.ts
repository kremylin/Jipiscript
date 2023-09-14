import { JipiFunction } from "./models/JipiFunction.js";
import { normalize } from "./jipitype.js";

export function jipify(
  toJipify: Function | (new (...args: any[]) => any),
  schema: any,
  descriptionOrFromJson?: string | ((json: any) => any)
) {
  if (isClass(toJipify)) {
    return bindSchema(toJipify, normalize(schema), descriptionOrFromJson as (json: any) => any);
  }

  return jipifyFn(toJipify, normalize(schema), descriptionOrFromJson as string);
}

function jipifyFn(f: Function, schema: any, description: string) {
  const name = f.name ? f.name : `JipiFunc_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  return new JipiFunction(name, description, schema, f);
}

function bindSchema(classe: any, schema: any, fromJson?: (json: any) => any) {
  classe.jipi = schema;
  if (fromJson) {
    classe.fromJson = fromJson;
  }
  return classe;
}

/****************************************** Utilities ******************************************/

function isClass(v: Function | (new (...args: any[]) => any)): v is new (...args: any[]) => any {
  if (!(typeof v === "function" && !!v.prototype && v.prototype.constructor === v)) return false;
  const str = v.toString();
  return str.startsWith("class ") || /class[\s{]/.test(str);
}
