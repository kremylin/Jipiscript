# Jipiscript

Jipiscript is a JavaScript library that allows you to integrate OpenAI's GPT-3 language model into your projects. It allows you to ask questions and perform tasks using natural language, and receive answers or results in a variety of data formats.

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

## Usage
Here's a simple example of how to use Jipiscript to ask a question and receive a string answer:
```javascript
import Jipiscript from "jipiscript";

const jipi = new Jipiscript("your-openai-api-key");

const answer = await jipi.ask("What is the capital of France?", String);
console.log(answer); // "Paris"
```

You can provide parameters
```javascript
const answer = await jipi.ask("Are all those persons US presidents: $persons", Boolean, {persons: ["Barack Obama", "Bill Clinton", "George Washington", "George W. Bush"]});
console.log(answer); // true
```

You can also receive answers in other data formats, such as numbers, booleans, or custom classes.
Here's an example of how to receive a custom class answer:
```javascript
class Person {
  
  constructor(name='', birthYear=0) {
    this.name = name;
    this.birthYear = birthYear;
  }
}

const answer = await jipi.ask("Who's the first black president of the USA?", Person);
console.log(answer); // Person { name: "Barack Obama", birthYear: 1961 }
```

You can also provide context to Jipiscript, which it will use to generate more accurate answers. For example:
```javascript
jipi.changeContext("You are playing chess");
console.log(await jipi.ask("Are you playing a team game?", Boolean)); // false

jipi.changeContext("You are playing football");
console.log(await jipi.ask("Are you playing a team game?", Boolean)); // true
```

