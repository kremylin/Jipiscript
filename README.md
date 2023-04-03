# Jipiscript


Jipiscript is a JavaScript library that allows you to integrate OpenAI's GPT-3 language model into your projects.
<br/>It allows you to ask questions using natural language and parameters and receive answers or results in a variety of data formats without ever generating any code.

## TL;DR What is it? What does it do?

Use Jipiscript to use LLM like a function (with parameters) in your code and get result in a desired variable type.

examples:
```javascript
// Ask a question with an array parameter, get a boolean answer
const answer = await jipi.ask("Are all those persons US presidents: $persons", { persons: ["Barack Obama", "Bill Clinton", "George Washington", "George W. Bush"] }, Boolean);
console.log(answer); // true


class ImdbSeries {
    static jipi = {
        structure: {
            title: "string",
            rating: "number",
            cast: [
                {
                    firstname: "string",
                    lastname: "string",
                    superHeroName: "string - wordPlay on his/her last name",
                },
            ],
        },
    };
}

const imdb = (series) => jipi.ask("get imdb details of $series", { series }, ImdbSeries);

const answer = await imdb("Black Adder");
console.log(answer);
/*
ImdbSeries {
        title: 'Black Adder',
        rating: 8.1,
        cast: [
        {
          firstname: 'Rowan',
          lastname: 'Atkinson',
          superHeroName: 'Atkinstorm'
        },
        {
          firstname: 'Tony',
          lastname: 'Robinson',
          superHeroName: 'Robinsman'
        },
        {
          firstname: 'Hugh',
          lastname: 'Laurie',
          superHeroName: 'Doctor Laurie' // I swear i didn't made this up
        },
        {
          firstname: 'Stephen',
          lastname: 'Fry',
          superHeroName: 'Fry Fighter'
        }
    ],
}
*/
```

## Installation

You can install Jipiscript using npm

```shell
npm install --save jipiscript
```

## Getting started
If you plan on using Jipiscript with GPT, you will first need to obtain an OpenAI API key. This can be done by signing up for an OpenAI account [here](https://beta.openai.com/signup/) and following the instructions provided.

Once you have your API key, you can use Jipiscript by creating an instance of the Jipiscript class.

```javascript
import { Jipiscript, Gpt3Wrapper } from "jipiscript";

const jipi = new Jipiscript(new Gpt3Wrapper("OPENAI_API_KEY"), "some context");
```

## Basic usage
Here's a simple example of how to use Jipiscript to ask a parametrized question and receive an array :
```javascript
import { Jipiscript, Gpt4Wrapper } from "jipiscript";

const jipi = new Jipiscript(new Gpt4Wrapper("OPENAI_API_KEY"), "some context");

const getCapitals = (countries) => jipi.ask("What are the capital of $countries?", { countries }, Array);

const answer = await getCapitals(["France", "Belgium", "Canada"]);
console.log(answer); // ["Paris", "Brussels", "Ottawa"]
```

You can receive answers in other data formats, such as numbers, booleans, or [custom classes](docs/using-class-as-return-type.md).
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

These examples are just the beginning of what you can achieve with Jipiscript's flexible class structure customization. Let your imagination run wild and see what else you can come up with!