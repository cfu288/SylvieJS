# SylvieJS

[SylvieJS GitHub page](https://github.com/cfu288/SylvieJS)

## Documentation Overview

SylvieJS is a document oriented database written in javascript, published under MIT License.
Its purpose is to store javascript objects as documents in a nosql fashion and retrieve them with a similar mechanism.
Runs in node and the browser.

SylvieJS is a fork of [LokiJS repository](https://github.com/techfort/LokiJS). SylvieJS aims to be a drop-in replacement for LokiJS while maintaining more modern APIs.

## Getting Started

Creating a database :

```javascript
/**
 * Note: Sylvie exports loki as well for backwards compatibility.
 * let db = new loki("example.db");
 */
let db = new Sylvie("example.db");
```

Add a collection :

```javascript
let users = db.addCollection("users");
```

Insert documents :

```javascript
users.insert({
  name: "Odin",
  age: 50,
  address: "Asgard",
});

// alternatively, insert array of documents
users.insert([
  { name: "Thor", age: 35 },
  { name: "Loki", age: 30 },
]);
```

Simple find query :

```javascript
let results = users.find({ age: { $gte: 35 } });

let odin = users.findOne({ name: "Odin" });
```

Simple where query :

```javascript
let results = users.where(function (obj) {
  return obj.age >= 35;
});
```

Simple Chaining :

```javascript
let results = users
  .chain()
  .find({ age: { $gte: 35 } })
  .simplesort("name")
  .data();
```

Simple named transform :

```javascript
users.addTransform("progeny", [
  {
    type: "find",
    value: {
      age: { $lte: 40 },
    },
  },
]);

let results = users.chain("progeny").data();
```

Simple Dynamic View :

```javascript
let pview = users.addDynamicView("progeny");

pview.applyFind({
  age: { $lte: 40 },
});

pview.applySimpleSort("name");

let results = pview.data();
```
