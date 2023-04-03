## Using a class as return type
When using Jipiscript, you can receive answers in custom class instances.
To do so, Jipiscript needs to be aware of the class structure.

This structure is an object containing the names of all properties of the class, along with their expected types. While Jipiscript can determine this structure automatically, it can be defined explicitly for greater control.
<br/>The most common types are "string", "number", "boolean", "array", and "object". Properties of type "array" and "object" can also be detailed to specify their structure.
<br/><br/>For example, an object structure might look like this:

```javascript
const structure = {
    name: "string",
    age: "number",
    isEmployed: "boolean",
    qualities: "array",
    hobbies: ["string"],
    address: {
        street: "string",
        city: "string",
        country: "string"
    }
}
```

In this example, the **`name`** property is of type **string**, **`age`** is of type **number**, **`isEmployed`** is of type **boolean**, **`hobbies`** is an **array** property containing elements of type string and **`address`** is an **object**, and the structure of this object is specified using a nested object.

There are three ways to specify the structure of a class:

### <a id="auto-structure" />1. By using a class definition</a>

The simplest way to define the structure of a custom class is to provide a class definition directly to the ask method, as shown in the previous example:

```javascript
class Person {
    name='';
    birthYear=0;
}

const answer = await jipi.ask("Who's the first black president of the USA?", {}, Person);
console.log(answer); // { name: "Barack Obama", birthYear: 1961 }
```

Jipiscript will then instantiate a new Person object using the constructor without any parameters and attempt to infer the structure from this instance.
It is recommended to initialize all properties of the class to allow Jipiscript to infer the types of properties correctly. Otherwise, the type of the property may not be predictable and will depend on the return of GPT-3.

### <a id="explicit-structure" />2. By having a jipi static property in the class definition</a>

You can also explicitely define the structure of your custom class by adding a static property named 'jipi' to its definition,
as shown in the example below. The 'jipi' object should contain the class structure under the 'structure' key.

```javascript
class Person {
  name;
  birthYear;
  
  static jipi = {
    structure: { name: "string", birthYear: "number" }
  };
}

const answer = await jipi.ask("Who's the first black president of the USA?", {}, Person);
console.log(answer); // Person { name: "Barack Obama", birthYear: 1961 }
```

### 3. By passing the structure in the options object

Finally, you can also define the structure of your custom class by passing an object to the options parameter of the ask method.
The object should contain the class structure under the 'structure' key.

```javascript
class Person {
  name;
  birthYear;
}

const answer = await jipi.ask("Who's the first black president of the USA?", {}, Person, { structure: { name: "string", birthYear: "number" } });
console.log(answer); // Person { name: "Barack Obama", birthYear: 1961 }
```

## Let the fun begin

You can further customize the structure of a class by not only specifying the type of each property. Here are some interesting examples:

### Conditional or computed value
You can use logical expressions and computations to define the value of a property in your custom class structure. For example:

```javascript
const answer = await jipi.ask(
"Who's the first black president of the USA?", {}, Person, {
  structure: {
    name: "string",
    nicestManOnEarth: "true if his name is Kremylin, false otherwise",
    backward: "his name spelled backward",
    children: [{
      name: "string child name preceded by the title 'Lady'",
      birthYear: "number",
    }],
    qualities: ["string - size of array: number of children"]
  }
});
console.log(answer);
/*
Person {
  name: 'Barack Obama',
  nicestManOnEarth: false,
  backward: 'amabo kcarB', // Yeah GPT-3 sucks at this :/
  children: [
    { name: 'Lady Malia Obama', birthYear: 1998 },
    { name: 'Lady Sasha Obama', birthYear: 2001 }
  ],
}
 */
```

These examples are just the beginning of what you can achieve with Jipiscript's flexible class structure customization. Let your imagination run wild and see what else you can come up with!