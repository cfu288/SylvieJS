// @ts-nocheck
// import { Loki } from "../dist/lokijs.js";
import Loki from "../dist/lokijs.js";
const loki = Loki;

let db = new loki("perftest"),
  samplecoll = null,
  uniquecoll = null;
const arraySize = 5000, // how large of a dataset to generate
  totalIterations = 20000, // how many times we search it
  getIterations = 2000000; // get is crazy fast due to binary search so this needs separate scale

function genRandomVal() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 20; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

// in addition to the loki id we will create a key of our own
// (customId) which is number from 1- totalIterations
// we will later perform find() queries against customId with and
// without an index

function initializeDB() {
  db = new loki("perftest");

  let start, end;
  const totalTimes = [];
  let totalMS = 0.0;

  samplecoll = db.addCollection("samplecoll");
  /*
    {
      asyncListeners: true,
      disableChangesApi: true,
      transactional: false,
      clone: false 
    }
  ); 
  */

  for (var idx = 0; idx < arraySize; idx++) {
    const v1 = genRandomVal();
    const v2 = genRandomVal();

    start = process.hrtime();
    samplecoll.insert({
      customId: idx,
      val: v1,
      val2: v2,
      val3: "more data 1234567890",
    });
    end = process.hrtime(start);
    totalTimes.push(end);
  }

  for (var idx = 0; idx < totalTimes.length; idx++) {
    totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1] / 1e6;
  }

  //var totalMS = end[0] * 1e3 + end[1]/1e6;
  totalMS = totalMS.toFixed(2);
  let rate = (arraySize * 1000) / totalMS;
  rate = rate.toFixed(2);
  console.log("load (insert) : " + totalMS + "ms (" + rate + ") ops/s");
}

/**
 * initializeUnique : to support benchUniquePerf, we will set up another collection
 * where our customId is enforced as 'unique' using unique index feature of loki.
 */
function initializeUnique() {
  uniquecoll = db.addCollection("uniquecoll", {
    unique: ["customId"],
  });

  for (let idx = 0; idx < arraySize; idx++) {
    const v1 = genRandomVal();
    const v2 = genRandomVal();

    uniquecoll.insert({
      customId: arraySize - idx,
      val: v1,
      val2: v2,
      val3: "more data 1234567890",
    });
  }
}

function benchUniquePerf() {
  let start, end;
  const totalTimes = [];
  let totalMS = 0.0;

  for (var idx = 0; idx < getIterations; idx++) {
    const customidx = Math.floor(Math.random() * arraySize) + 1;

    start = process.hrtime();
    end = process.hrtime(start);
    totalTimes.push(end);
  }

  for (var idx = 0; idx < totalTimes.length; idx++) {
    totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1] / 1e6;
  }

  totalMS = totalMS.toFixed(2);
  let rate = (getIterations * 1000) / totalMS;
  rate = rate.toFixed(2);
  console.log("coll.by() : " + totalMS + "ms (" + rate + ") ops/s");
}

function testperfGet() {
  let start, end;
  const totalTimes = [];
  let totalMS = 0.0;

  for (var idx = 0; idx < getIterations; idx++) {
    const customidx = Math.floor(Math.random() * arraySize) + 1;

    start = process.hrtime();
    end = process.hrtime(start);
    totalTimes.push(end);
  }

  for (var idx = 0; idx < totalTimes.length; idx++) {
    totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1] / 1e6;
  }

  totalMS = totalMS.toFixed(2);
  let rate = (getIterations * 1000) / totalMS;
  rate = rate.toFixed(2);
  console.log("coll.get() : " + totalMS + "ms (" + rate + ") ops/s");
}

function testperfFind(multiplier) {
  let start, end;
  const totalTimes = [];
  let totalMS = 0;

  let loopIterations = totalIterations;
  if (typeof multiplier != "undefined") {
    loopIterations = loopIterations * multiplier;
  }

  for (var idx = 0; idx < loopIterations; idx++) {
    const customidx = Math.floor(Math.random() * arraySize) + 1;

    start = process.hrtime();
    end = process.hrtime(start);
    totalTimes.push(end);
  }

  for (var idx = 0; idx < totalTimes.length; idx++) {
    totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1] / 1e6;
  }

  totalMS = totalMS.toFixed(2);
  let rate = (loopIterations * 1000) / totalMS;
  rate = rate.toFixed(2);
  console.log(
    "coll.find() : " +
      totalMS +
      "ms (" +
      rate +
      " ops/s) " +
      loopIterations +
      " iterations"
  );
}

function testperfRS(multiplier) {
  let start, end;
  const totalTimes = [];
  let totalMS = 0;

  let loopIterations = totalIterations;
  if (typeof multiplier != "undefined") {
    loopIterations = loopIterations * multiplier;
  }

  for (var idx = 0; idx < loopIterations; idx++) {
    const customidx = Math.floor(Math.random() * arraySize) + 1;

    start = process.hrtime();
    end = process.hrtime(start);
    totalTimes.push(end);
  }

  for (var idx = 0; idx < totalTimes.length; idx++) {
    totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1] / 1e6;
  }

  totalMS = totalMS.toFixed(2);
  let rate = (loopIterations * 1000) / totalMS;
  rate = rate.toFixed(2);
  console.log(
    "resultset chained find() :  " +
      totalMS +
      "ms (" +
      rate +
      " ops/s) " +
      loopIterations +
      " iterations"
  );
}

function testperfDV(multiplier) {
  let start, end;
  let start2, end2;
  const totalTimes = [];
  const totalTimes2 = [];
  let totalMS = 0;
  let totalMS2 = 0;

  let loopIterations = totalIterations;
  if (typeof multiplier != "undefined") {
    loopIterations = loopIterations * multiplier;
  }

  for (var idx = 0; idx < loopIterations; idx++) {
    const customidx = Math.floor(Math.random() * arraySize) + 1;

    start = process.hrtime();
    const dv = samplecoll.addDynamicView("perfview");
    dv.applyFind({
      customId: customidx,
    });
    var results = dv.data();
    end = process.hrtime(start);
    totalTimes.push(end);

    // test speed of repeated query on an already set up dynamicview
    start2 = process.hrtime();
    var results = dv.data();
    end2 = process.hrtime(start2);
    totalTimes2.push(end2);

    samplecoll.removeDynamicView("perfview");
  }

  for (var idx = 0; idx < totalTimes.length; idx++) {
    totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1] / 1e6;
    totalMS2 += totalTimes2[idx][0] * 1e3 + totalTimes2[idx][1] / 1e6;
  }

  totalMS = totalMS.toFixed(2);
  totalMS2 = totalMS2.toFixed(2);
  let rate = (loopIterations * 1000) / totalMS;
  let rate2 = (loopIterations * 1000) / totalMS2;
  rate = rate.toFixed(2);
  rate2 = rate2.toFixed(2);

  console.log(
    "loki dynamic view first find : " +
      totalMS +
      "ms (" +
      rate +
      " ops/s) " +
      loopIterations +
      " iterations"
  );
  console.log(
    "loki dynamic view subsequent finds : " +
      totalMS2 +
      "ms (" +
      rate2 +
      " ops/s) " +
      loopIterations +
      " iterations"
  );
}

initializeDB();
//initializeWithEval();
initializeUnique();

testperfGet(); // get bechmark on id field
benchUniquePerf();

console.log("");
console.log("-- Benchmarking query on NON-INDEXED column --");
testperfFind(); // find benchmark on unindexed customid field
testperfRS(); // resultset find benchmark on unindexed customid field
testperfDV(); // dataview find benchmarks on unindexed customid field

console.log("");
console.log(
  "-- ADDING BINARY INDEX to query column and repeating benchmarks --"
);
samplecoll.ensureIndex("customId");
testperfFind(20);
testperfRS(15);
testperfDV(15);
