export function inferClassStructure(instance) {
  const structure = {};

  for (const key of Object.keys(instance)) {
    const type = typeof instance[key];
    if (instance[key] instanceof Array) {
      structure[key] = getArrayStructure(instance[key]);
    } else if (type === "object" && instance[key]) {
      structure[key] = inferClassStructure(instance[key]);
    } else if (type === "undefined") {
      structure[key] = "any";
    } else {
      structure[key] = type;
    }
  }

  return structure;
}

function getArrayStructure(array) {
  const structure = [];

  for (const value of array) {
    const type = typeof value;
    if (value instanceof Array) {
      structure.push(getArrayStructure(value));
    } else if (type === "object" && value) {
      structure.push(inferClassStructure(value));
    } else if (type === "undefined") {
      structure.push("any");
    } else {
      structure.push(type);
    }
  }

  return structure;
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
  return (
    "[" +
    array
      .map((value, index) => index + ": " + convertToString(value))
      .join(", ") +
    "]"
  );
}
