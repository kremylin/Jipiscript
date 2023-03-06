# Jipiscript


Jipiscript is a JavaScript library that allows you to integrate OpenAI's GPT-3 language model into your projects.
<br/>It allows you to ask questions using natural language and parameters and receive answers or results in a variety of data formats.

## TL;DR What is it? What does it do?

Use Jipiscript to call GPT-3 (almost) like a function (with parameters) in your code and get result in a desired variable type.

examples:
```javascript
// Ask a question with an array parameter, get a boolean answer
const answer = await jipi.ask("Are all those persons US presidents: $persons", { persons: ["Barack Obama", "Bill Clinton", "George Washington", "George W. Bush"] }, Boolean);
console.log(answer); // true

// Ask a question, get an Animal object as a response
class Animal { name=''; meanWeightInKg=0; }
const answer = await jipi.ask("What's the biggest animal?", {}, Animal);
console.log(answer); // Animal { name: 'Blue Whale', meanWeightInKg: 190000 }
```

## Installation

You can install Jipiscript using npm

```shell
npm install --save jipiscript
```

## Getting started
To get started with Jipiscript, you will first need to obtain an OpenAI API key. This can be done by signing up for an OpenAI account [here](https://beta.openai.com/signup/) and following the instructions provided.

Once you have your API key, you can use Jipiscript by creating an instance of the Jipiscript class.

```javascript
import Jipiscript from "jipiscript";

const jipi = new Jipiscript("OPENAI_API_KEY", "some context");
```

## Basic usage
Here's a simple example of how to use Jipiscript to ask a question and receive a string answer:
```javascript
import Jipiscript from "jipiscript";

const jipi = new Jipiscript("your-openai-api-key");

const answer = await jipi.ask("What is the capital of France?", {}, String);
console.log(answer); // "Paris"
```

You can provide parameters
```javascript
const answer = await jipi.ask("Are all those persons US presidents: $persons", { persons: ["Barack Obama", "Bill Clinton", "George Washington", "George W. Bush"] }, Boolean);
console.log(answer); // true
```

You can receive answers in other data formats, such as numbers, booleans, or custom classes.
```javascript
class Person {
  
  constructor(name='', birthYear=0) {
    this.name = name;
    this.birthYear = birthYear;
  }
}

const answer = await jipi.ask("Who's the first black president of the USA?", {}, Person);
console.log(answer); // Person { name: "Barack Obama", birthYear: 1961 }
```

You can also provide context to Jipiscript, which it will use to generate more accurate answers.
```javascript
jipi.changeContext("You are playing chess");
console.log(await jipi.ask("Are you playing a team game?", {}, Boolean)); // false

jipi.changeContext("You are playing football");
console.log(await jipi.ask("Are you playing a team game?", {}, Boolean)); // true
```

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
  }
});
console.log(answer);
/*
Person {
  name: 'Barack Obama',
  nicestManOnEarth: false,
  backward: 'amabo kcarB' // Yeah GPT-3 sucks at this :/
}
 */
```

### Array of custom objects

```javascript
const answer = await jipi.ask(
"Who's the first black president of the USA?", {}, Person, {
  structure: {
    name: "string",
    children: [{
        name: "string child name preceded by the title 'Lady'",
        birthYear: "number",
    }],
  },
});
console.log(answer);
/*
Person {
  name: 'Barack Obama',
  children: [
    { name: 'Lady Malia Obama', birthYear: 1998 },
    { name: 'Lady Sasha Obama', birthYear: 2001 }
  ]
}
*/
```

### Fixed size and multitype Array

You can define an array with a fixed size and multiple types of elements.

```javascript
const answer = await jipi.ask(
"Pick some random elements from this array $mixedArray", { mixedArray: [1, 'Dog', 42, 'Cutie'] }, Result, {
  structure: {
    random: ["number or string - size of array: 3"],
  },
});
console.log(answer); // Result { random: [ 1, 'Cutie', 42 ] }
```

These examples are just the beginning of what you can achieve with Jipiscript's flexible class structure customization. Let your imagination run wild and see what else you can come up with!