import * as z from "zod";

export function stringifiedSchemaToZod(schema) {
  const lowercaseSchema = schema.toLowerCase();
  if (lowercaseSchema.startsWith("string")) {
    const description = schema.substring(6);
    return z.string().describe(description);
  } else if (lowercaseSchema.startsWith("number")) {
    const description = schema.substring(6);
    return z.number().describe(description);
  } else if (lowercaseSchema.startsWith("boolean")) {
    const description = schema.substring(7);
    return z.boolean().describe(description);
  } else if (lowercaseSchema.startsWith("date")) {
    const description = schema.substring(4);
    return z.date().describe(description);
  } else if (lowercaseSchema.startsWith("any")) {
    const description = schema.substring(3);
    return z.any().describe(description);
  }
  return z.string().describe(schema);
}
