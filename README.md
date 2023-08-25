# SylvieJS

The super fast in-memory javascript document oriented database.

See our [Documentation](https://cfu288.github.io/SylvieJS/).

**This repo is a fork of the original [LokiJS repository](https://github.com/techfort/LokiJS)**.

SylvieJS aims to be a drop-in replacement for LokiJS. The objectives of this fork are to modernize the API and the codebase:

- Migrate codebase to ES6
- Export SylvieJS as an ES Module
- Add API for Async/Await + Promises instead of callbacks
- Use TypeScript
- Add automated browser test runner for Chrome/Safari/Firefox
- Maintain backwards compatibility with LokiJS

[![Node.js CI](https://github.com/cfu288/SylvieJS/actions/workflows/ci.yaml/badge.svg)](https://github.com/cfu288/SylvieJS/actions/workflows/ci.yaml)

## Overview

SylvieJS is a document oriented database written in javascript, published under MIT License.
Its purpose is to store javascript objects as documents in a NoSQL fashion and retrieve them with a similar mechanism.
Runs in node and the browser.

SylvieJS is ideal for the following scenarios:

1. client-side in-memory db is ideal (e.g., a session store)
2. performance critical applications
3. Ionic/Capacitor mobile apps where you can leverage the power of javascript and avoid interacting with native databases
4. Data sets loaded into a browser page and synchronized at the end of the work session
5. Electron desktop apps

SylvieJS supports indexing and views and achieves high-performance through maintaining unique and binary indexes (indices) for data.

## Quickstart

### Install

#### Via NPM

```bash
npm install sylviejs
```

#### Via `<script/>` tag

You can use the `sylvie.js` file found in the `dist/` folder or use the file found at `https://cfu288.github.io/SylvieJS/sylviejs.js`.

```html
<!doctype html>
<html>
  <head>
    <title>SylvieJS Example</title>
    <script
      id="sylvie"
      type="module"
      src="https://cfu288.github.io/SylvieJS/sylviejs.js"
    ></script>
  </head>
  <body>
    <h1>SylvieJS Examples</h1>
    <p>Open up the console and see it happen!</p>
    <script type="text/javascript">
      var script = document.querySelector("#sylvie");
      script.addEventListener("load", function () {
        // Do stuff with Sylvie
        var db = new Sylvie("example.db");
      });
    </script>
  </body>
</html>
```

### Example usage with default IndexedDB adapter

```ts
import Sylvie from "sylviejs";

let db = new Sylvie("example.db");
let users = db.addCollection("users");

users.insert([
  {
    name: "Odin",
    age: 50,
    address: "Asgard",
  },
  { name: "Thor", age: 35 },
  { name: "Loki", age: 30 },
  { name: "Sylvie", age: 25 },
]);

console.group("Search by find() with mongo-like query");
let results = users.find({ age: { $gte: 35 } });
console.log(results);
console.groupEnd();
```

[Full documentation can be found here](https://cfu288.github.io/SylvieJS/).

## Demo

The following demos are available:

- [Node Sandbox / Playground](https://replit.com/@cfu288/sylviejs-sandbox).

More examples can be found in our [examples folder](./examples/).

## Main Features

1. Fast performance NoSQL in-memory database, collections with unique index (1.1M ops/s) and binary-index (500k ops/s)
2. Runs in multiple environments (browser, node, nativescript)
3. Dynamic Views for fast access of data subsets
4. Built-in persistence adapters, and the ability to support user-defined ones
5. Changes API
6. Joins

## Current state

This fork is currently undergoing a rework.

Currently maintained by cfu288. Originally made by [@techfort](http://twitter.com/tech_fort), with the precious help of Dave Easterday.

## License

Copyright (c) 2023 Christopher Fu

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
