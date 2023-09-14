## Using a class as return type
When working with custom classes, Jipiscript needs to be aware of the properties of the class and their expected types.
We're going to describe the class structure with an object containing the names of all properties of the class, along with their expected types.
<br/>While Jipiscript can sometimes correctly infer this structure automatically, it is recommended to explicitly specify it.
<br/><br/>A class structure might look like this:

```javascript
const structure = {
    name: "string",
    age: j.number(),
    isEmployed: Boolean,
    qualities: j.array(),
    hobbies: [j.string()],
    address: {
        street: j.string("street number and street name"),
        city: String,
        country: "string"
    }
}
```

Accepted types are:
- **strings**: "string", "number", "boolean", "array", and "object"
- **primitive wrapper objects** : String, Number, Boolean, Array, Object
- **{j} from "jipiscript"** : j.string(), j.number(), j.boolean(), j.array(), j.object()
- **[] and {}** : [] is equivalent to j.array() and {} is equivalent to j.object()

There are ~~three~~(honestly, just use the first one, jipify might get some cool features in the future) ways to specify the structure of a class:

### <a id="jipify" />1. Using jipify</a>

```javascript
class Person {
    name;
    birthYear;
    constructor({name, birthYear}) {
        this.name = name;
        this.birthYear = birthYear;
    }
}

jipify(Person, { name: "string", birthYear: "number" });

// Querying the model and getting a response of type Person
const answer = await jipi.ask("Who's the first black president of the USA?", {}, Person);
console.log(answer); // Person { name: "Barack Obama", birthYear: 1961 }
```

By jipifiying a class, you bind the structure to the class itself.
This means that you can use the class as return type without having to specify the structure again.
<br/>Jipiscript will then instantiate the class using the constructor on the JSON object returned by GPT
<br/>A third parameter can be used to specify how to instanciate the class 

```javascript
class Person {
    name;
    birthYear;
    constructor(name, birthYear) {
        this.name = name;
        this.birthYear = birthYear;
    }
}

jipify(
  Person,
  { firstname: "string", lastname: "string", birthYear: "number" },
  (json) => {
    // Turning the received JSON data into a person
    return new Person(`${json.firstname} ${json.lastname}`, json.birthYear);
  }
);

// Querying the model and getting a response of type Person
const answer = await jipi.ask("Who's the first black president of the USA?", {}, Person);
console.log(answer); // Person { name: "Barack Obama", birthYear: 1961 }
```

### <a id="auto-structure" />2. By letting Jipiscript do the work</a>

The ~~simplest~~ laziest way to define the structure of a custom class is to pass the class as return type and hope it gets correctly infered :

```javascript
class Person {
    name='';
    birthYear=0;
}

// Querying the model and getting a response of type Person
const answer = await jipi.ask("Who's the first black president of the USA?", {}, Person);
console.log(answer); // Person { name: "Barack Obama", birthYear: 1961 }
```

Jipiscript will then instantiate a new Person object using the constructor without any parameters and attempt to infer the structure from this instance.
For Jipiscript to accurately infer the types of properties, it's recommended to initialize all properties of the class.

### 3. By passing the structure in the options object

Finally, you can also define the structure of your custom class by passing an object to the options parameter of the ask method.
The object should contain the class structure under the 'structure' key.

```javascript
class Person {
  name;
  birthYear;
}

// Querying the model and getting a response of type Person
const answer = await jipi.ask("Who's the first black president of the USA?", {}, Person, { structure: { name: "string", birthYear: "number" } });
console.log(answer); // Person { name: "Barack Obama", birthYear: 1961 }
```

## Let the fun ~~begin~~ rest in peace

As of version 1.1.0, Jipiscript uses OpenAI's function calling as its engine for customizing return types. While this functionality's use of standard JSON schema is a significant addition, it appears not to apply all the rules of the schema we provide and to ignore most of the fancy descriptions (bummer!)
<br/>I'm working on it, and might not exclude the possibility of a rollback to the previous system with some ameliorations.

~~It's possible to add a description to the properties thus allowing further customization of the value returned.
It's particularly easy using j (which is a zod extension):~~


<pre><s>import { j } from "jipiscript";
<br/><br/>
const answer = await jipi.ask(
"Who's the first black president of the USA?", {}, Person, {
  structure: {
    name: j.string(),
    nicestManOnEarth: j.boolean("true if his name is Kremylin, false otherwise"),
    backward: j.string("his name spelled backward"),
    children: [{
      name: j.string("child name preceded by the title 'Lady'"),
      birthYear: j.number(),
    }],
    qualities: [j.string("size of array: number of children")]
  }
});
console.log(answer);
</s>
</pre>
<pre><s>/*
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
</s></pre>


~~These examples are just the beginning of what you can achieve with Jipiscript's flexible class structure customization. Let your imagination run wild and see what else you can come up with!~~~~