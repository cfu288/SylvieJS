# SylvieJS

**This repo is a fork of the original [LokiJS repository](https://github.com/techfort/LokiJS) maintained by cfu288.**

The objectives of this fork are to modernize the API and the codebase (ES6, ES Module, Async/Await + Promises instead of callbacks, TypeScript, modern browser test runner for Chrome/Safari/Firefox).

The super fast in-memory javascript document oriented database.

[![Node.js CI](https://github.com/cfu288/SylvieJS/actions/workflows/ci.yaml/badge.svg)](https://github.com/cfu288/SylvieJS/actions/workflows/ci.yaml)

## Overview

SylvieJS is a document oriented database written in javascript, published under MIT License.
Its purpose is to store javascript objects as documents in a nosql fashion and retrieve them with a similar mechanism.
Runs in node (including cordova/phonegap and node-webkit), [nativescript](http://www.nativescript.org) and the browser.
SylvieJS is ideal for the following scenarios:

1. client-side in-memory db is ideal (e.g., a session store)
2. performance critical applications
3. cordova/phonegap mobile apps where you can leverage the power of javascript and avoid interacting with native databases
4. data sets loaded into a browser page and synchronised at the end of the work session
5. node-webkit desktop apps
6. nativescript mobile apps that mix the power and ubiquity of javascript with native performance and ui

SylvieJS supports indexing and views and achieves high-performance through maintaining unique and binary indexes (indices) for data.

## Demo

The following demos are available:

- [Sandbox / Playground](https://rawgit.com/techfort/LokiJS/master/examples/sandbox/LokiSandbox.htm)
- a node-webkit small demo in the folder demos/desktop_app. You can launch it by running `/path/to/nw demos/desktop_app/`

## Wiki

Example usage can be found on the [wiki](https://github.com/techfort/LokiJS/wiki)

## Main Features

1. Fast performance NoSQL in-memory database, collections with unique index (1.1M ops/s) and binary-index (500k ops/s)
2. Runs in multiple environments (browser, node, nativescript)
3. Dynamic Views for fast access of data subsets
4. Built-in persistence adapters, and the ability to support user-defined ones
5. Changes API
6. Joins

## Current state

This fork is undergoing a rework and has not been released on npm yet.

As SylvieJS is written in JavaScript it can be run on any environment supporting JavaScript such as browsers, node.js/node-webkit, nativescript mobile framework and hybrid mobile apps (such as phonegap/cordova).

Currently maintained by cfu288. Originally made by [@techfort](http://twitter.com/tech_fort), with the precious help of Dave Easterday.

## Installation

For browser environments you simply need the sylviejs.js file contained in `dist/`

For node environments you can install through `npm install cfu288/SylvieJS`.

## License

Copyright (c) 2015 Christopher Fu

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
