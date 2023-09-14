import * as z from "zod";
import { inferStructure, isClass } from "../utils.js";
import { stringifiedSchemaToZod } from "./zod_converters/stringified_schema.js";

type ZodOptions = {
  errorMap?: z.ZodErrorMap | undefined;
  invalid_type_error?: string | undefined;
  required_error?: string | undefined;
  description?: string | undefined;
} & {
  coerce?: true | undefined;
};

export const JipiType = {
  ...z,
  string: (description?: string | ZodOptions, options?: ZodOptions) => {
    if (typeof description === "undefined") {
      return z.string();
    } else if (typeof description === "string") {
      return z.string(options).describe(description);
    }
    return z.string(description);
  },

  number: (description?: string | ZodOptions, options?: ZodOptions) => {
    if (typeof description === "undefined") {
      return z.number();
    } else if (typeof description === "string") {
      return z.number(options).describe(description);
    }
    return z.number(description);
  },

  integer: (description?: string | ZodOptions, options?: ZodOptions) => {
    if (typeof description === "undefined") {
      return z.number().int();
    } else if (typeof description === "string") {
      return z.number(options).int().describe(description);
    }
    return z.number(description).int();
  },

  date: (description?: string | ZodOptions, options?: ZodOptions) => {
    if (typeof description === "undefined") {
      return z.date().describe("date string in the format dd/MM/yyyy:HH:mm:ss");
    } else if (typeof description === "string") {
      return z.date(options).describe(description + ", date string in the format dd/MM/yyyy:HH:mm:ss");
    }
    return z.date(description).describe("date string in the format dd/MM/yyyy:HH:mm:ss");
  },

  boolean: (description?: string | ZodOptions, options?: ZodOptions) => {
    if (typeof description === "undefined") {
      return z.boolean();
    } else if (typeof description === "string") {
      return z.boolean(options).describe(description);
    }
    return z.boolean(description);
  },

  array: (contentType, description?: string | z.RawCreateParams, options?: z.RawCreateParams) => {
    let zContent = contentType;

    if (contentType instanceof z.ZodType) {
      zContent = contentType;
    } else if (contentType instanceof Array) {
      if (contentType.length < 2) {
        zContent = convertToZod(contentType[0]);
      } else {
        contentType = contentType as [any, any, any[]];
        z.union(contentType.map(convertToZod));
      }
    } else {
      zContent = convertToZod(contentType);
    }

    if (typeof description === "undefined") {
      return z.array(zContent);
    } else if (typeof description === "string") {
      return z.array(zContent, options).describe(description);
    }
    return z.boolean(zContent);
  },

  object: (shape: any, description?: string | z.RawCreateParams, options?: z.RawCreateParams) => {
    const zShape = {};
    for (const key of Object.keys(shape)) {
      zShape[key] = convertToZod(shape[key]);
    }

    if (typeof description === "undefined") {
      return z.object(zShape);
    } else if (typeof description === "string") {
      return z.object(zShape, options).describe(description);
    }
    return z.object(zShape, description);
  },

  enum: (values: [string, ...string[]], description?: string | z.RawCreateParams, options?: z.RawCreateParams) => {
    if (typeof description === "undefined") {
      return z.enum(values);
    } else if (typeof description === "string") {
      return z.enum(values, options).describe(description);
    }
    return z.enum(values, description);
  },
};

export function normalize(schema: any): z.ZodType {
  const zodSchema = convertToZod(schema);
  if (zodSchema instanceof z.ZodObject || zodSchema instanceof z.ZodEffects) {
    return zodSchema;
  } else if (zodSchema instanceof z.ZodDate) {
    // TODO : handle dates
    return z
      .object({
        response: zodSchema,
      })
      .transform((data) => new Date(data.response));
  } else {
    return z
      .object({
        response: zodSchema,
      })
      .transform((data) => data.response);
  }
}

function convertToZod(schema: any) {
  const type = typeof schema;
  if (schema instanceof z.ZodType) {
    return schema;
  } else if (type === "undefined") {
    return z.any();
  } else if (schema === String) {
    return z.string();
  } else if (schema === Number) {
    return z.number();
  } else if (schema === Boolean) {
    return z.boolean();
  } else if (schema === Date) {
    return z.date().describe("date string in the format dd/MM/yyyy:HH:mm:ss");
  } else if (schema instanceof Array) {
    if (schema.length < 2) return z.array(convertToZod(schema[0]));
    schema = schema as [any, any, any[]];
    return z.array(z.union(schema.map(convertToZod)));
  } else if (isClass(schema)) {
    return unknownClassNormalization(schema);
  } else if (schema instanceof Function && schema.jipi) {
    return schema.jipi;
  } else if (type === "object" && schema) {
    return objectToZodSchema(schema);
  } else if (type === "string") {
    return stringifiedSchemaToZod(schema);
  } else {
    return z.any().describe(String(schema) === "[object Object]" ? JSON.stringify(schema) : String(schema));
  }
}

function unknownClassNormalization(UnknownClass: any) {
  if (UnknownClass.jipi) return UnknownClass.jipi;
  return convertToZod(inferStructure(new UnknownClass()));
}

function objectToZodSchema(schema: Object) {
  const shape = {};
  for (const key of Object.keys(schema)) {
    shape[key] = convertToZod(schema[key]);
  }
  return z.object(shape);
}
