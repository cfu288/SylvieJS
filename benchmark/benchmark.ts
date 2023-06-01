/* eslint-disable no-var */
// @ts-nocheck
import chalk from "chalk";
import Loki from "../dist/lokijs.js";
const loki_new = Loki;
import Loki from "../src/lokijs-old.js";
import { Collection } from "../dist/modules/Collection.js";
const loki_old = Loki;

const loki_vers = [
  { title: `${chalk.green("new")}`, impl: loki_new },
  { title: `${chalk.blue("orig")}`, impl: loki_old },
];

function runBench(
  newBench: { title: string; test: () => number },
  oldBench: { title: string; test: () => number }
) {
  const newBenchResult = newBench.test();
  const oldBenchResult = oldBench.test();
  console.log(
    newBenchResult > oldBenchResult
      ? chalk.greenBright(
          `${newBench.title} is ${Number(
            Math.abs(newBenchResult / oldBenchResult - 1)
          ).toLocaleString(undefined, {
            style: "percent",
            minimumFractionDigits: 2,
          })} faster`
        )
      : chalk.blueBright(
          `${oldBench.title} is ${Number(
            Math.abs(1 - oldBenchResult / newBenchResult)
          ).toLocaleString(undefined, {
            style: "percent",
            minimumFractionDigits: 2,
          })} faster`
        )
  );
}

const ARRAY_SIZE = 5000, // how large of a dataset to generate
  TOTAL_ITERATIONS = 20000, // how many times we search it
  GET_ITERATIONS = 2000000, // get is crazy fast due to binary search so this needs separate scale
  MULTIPLIER = 1;
const VERBOSE = false;
let RESULT = undefined;

console.log(chalk.yellowBright(`initalizing`));
const db = initializeDB(loki_vers[0].impl, loki_vers[0].title);
const db1 = initializeDB(loki_vers[1].impl, loki_vers[1].title);
//initializeWithEval();
initializeUnique(db);
initializeUnique(db1);

console.log(chalk.yellowBright(`benching coll.get()`));
for (let i = 0; i < MULTIPLIER; i++) {
  runBench(
    {
      title: loki_vers[0].title,
      test: () =>
        testperfGet(db.getCollection("samplecoll"), loki_vers[0].title),
    },
    {
      title: loki_vers[1].title,
      test: () =>
        testperfGet(db1.getCollection("samplecoll"), loki_vers[1].title),
    }
  );
}
console.log(chalk.yellowBright(`benching coll.by()`));
for (let i = 0; i < MULTIPLIER; i++) {
  runBench(
    {
      title: loki_vers[0].title,
      test: () =>
        benchUniquePerf(db.getCollection("uniquecoll"), loki_vers[0].title),
    },
    {
      title: loki_vers[1].title,
      test: () =>
        benchUniquePerf(db1.getCollection("uniquecoll"), loki_vers[1].title),
    }
  );
}

console.log("");
console.log("-- Benchmarking query on NON-INDEXED column --");
console.log(chalk.yellowBright(`benching coll.find()`));
for (let i = 0; i < MULTIPLIER; i++) {
  runBench(
    {
      title: loki_vers[0].title,
      test: () =>
        testperfFind(
          undefined,
          db.getCollection("samplecoll"),
          loki_vers[0].title
        ),
    },
    {
      title: loki_vers[1].title,
      test: () =>
        testperfFind(
          undefined,
          db1.getCollection("samplecoll"),
          loki_vers[1].title
        ),
    }
  );
}
console.log(chalk.yellowBright(`benching rs.chain().find()`));
for (let i = 0; i < MULTIPLIER; i++) {
  runBench(
    {
      title: loki_vers[0].title,
      test: () =>
        testperfRS(
          undefined,
          db.getCollection("samplecoll"),
          loki_vers[0].title
        ),
    },
    {
      title: loki_vers[1].title,
      test: () =>
        testperfRS(
          undefined,
          db1.getCollection("samplecoll"),
          loki_vers[1].title
        ),
    }
  );
}
console.log(chalk.yellowBright(`benching dv.data() initial`));
for (let i = 0; i < MULTIPLIER; i++) {
  runBench(
    {
      title: loki_vers[0].title,
      test: () =>
        testperfDV(
          undefined,
          db.getCollection("samplecoll"),
          loki_vers[0].title
        ),
    },
    {
      title: loki_vers[1].title,
      test: () =>
        testperfDV(
          undefined,
          db1.getCollection("samplecoll"),
          loki_vers[1].title
        ),
    }
  );
}
console.log(chalk.yellowBright(`benching dv.data() sub`));
for (let i = 0; i < MULTIPLIER; i++) {
  runBench(
    {
      title: loki_vers[0].title,
      test: () =>
        testperfDV2(
          undefined,
          db.getCollection("samplecoll"),
          loki_vers[0].title
        ),
    },
    {
      title: loki_vers[1].title,
      test: () =>
        testperfDV2(
          undefined,
          db1.getCollection("samplecoll"),
          loki_vers[1].title
        ),
    }
  );
}

console.log("");
console.log(
  "-- ADDING BINARY INDEX to query column and repeating benchmarks --"
);
db.getCollection("samplecoll").ensureIndex("customId");
db1.getCollection("samplecoll").ensureIndex("customId");
console.log(chalk.yellowBright(`benching coll.find()`));
for (let i = 0; i < MULTIPLIER; i++) {
  runBench(
    {
      title: loki_vers[0].title,
      test: () =>
        testperfFind(20, db.getCollection("samplecoll"), loki_vers[0].title),
    },
    {
      title: loki_vers[1].title,
      test: () =>
        testperfFind(20, db1.getCollection("samplecoll"), loki_vers[1].title),
    }
  );
}
console.log(chalk.yellowBright(`benching rs.chain().find()`));
for (let i = 0; i < MULTIPLIER; i++) {
  runBench(
    {
      title: loki_vers[0].title,
      test: () =>
        testperfRS(3, db.getCollection("samplecoll"), loki_vers[0].title),
    },
    {
      title: loki_vers[1].title,
      test: () =>
        testperfRS(3, db1.getCollection("samplecoll"), loki_vers[1].title),
    }
  );
}
console.log(chalk.yellowBright(`benching dv.data() initial`));
for (let i = 0; i < MULTIPLIER; i++) {
  runBench(
    {
      title: loki_vers[0].title,
      test: () =>
        testperfDV(3, db.getCollection("samplecoll"), loki_vers[0].title),
    },
    {
      title: loki_vers[1].title,
      test: () =>
        testperfDV(3, db1.getCollection("samplecoll"), loki_vers[1].title),
    }
  );
}
console.log(chalk.yellowBright(`benching dv.data() sub`));
for (let i = 0; i < MULTIPLIER; i++) {
  runBench(
    {
      title: loki_vers[0].title,
      test: () =>
        testperfDV2(3, db.getCollection("samplecoll"), loki_vers[0].title),
    },
    {
      title: loki_vers[1].title,
      test: () =>
        testperfDV2(3, db1.getCollection("samplecoll"), loki_vers[1].title),
    }
  );
}

// =======================================================================
// =======================================================================
// =======================================================================

// testperfDV(5);

function testperfGet(samplecoll: Collection<any>, title: string) {
  var start, end;
  var totalTimes = [];
  var totalMS = 0.0;

  for (var idx = 0; idx < GET_ITERATIONS; idx++) {
    var customidx = Math.floor(Math.random() * ARRAY_SIZE) + 1;

    start = process.hrtime();
    RESULT = samplecoll.get(customidx);
    end = process.hrtime(start);
    totalTimes.push(end);
  }

  for (var idx = 0; idx < totalTimes.length; idx++) {
    totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1] / 1e6;
  }

  totalMS = parseFloat(totalMS.toFixed(2));
  var rate = (GET_ITERATIONS * 1000) / totalMS;
  rate = parseFloat(rate.toFixed(2));
  VERBOSE &&
    console.log(
      title + "\t" + "coll.get() : " + totalMS + "ms (" + rate + ") ops/s"
    );

  return rate;
}

// in addition to the loki id we will create a key of our own
// (customId) which is number from 1- totalIterations
// we will later perform find() queries against customId with and
// without an index

function initializeDB(loki: Loki, title: string) {
  const db: Loki = new loki("perftest");

  var start, end;
  var totalTimes = [];
  var totalMS = 0.0;

  const samplecoll = db.addCollection("samplecoll");

  for (var idx = 0; idx < ARRAY_SIZE; idx++) {
    var v1 = genRandomVal();
    var v2 = genRandomVal();

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

  totalMS = totalMS.toFixed(2);
  var rate = (ARRAY_SIZE * 1000) / totalMS;
  rate = rate.toFixed(2);
  VERBOSE &&
    console.log(
      title + "\t" + "load (insert) : " + totalMS + "ms (" + rate + ") ops/s"
    );

  return db;
}

/**
 * initializeUnique : to support benchUniquePerf, we will set up another collection
 * where our customId is enforced as 'unique' using unique index feature of loki.
 */
function initializeUnique(db: Loki) {
  const uniquecoll = db.addCollection("uniquecoll", {
    unique: ["customId"],
  });

  for (var idx = 0; idx < ARRAY_SIZE; idx++) {
    var v1 = genRandomVal();
    var v2 = genRandomVal();

    uniquecoll.insert({
      customId: ARRAY_SIZE - idx,
      val: v1,
      val2: v2,
      val3: "more data 1234567890",
    });
  }
}

function genRandomVal() {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 20; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function benchUniquePerf(uniquecoll: Collection<any>, title: string) {
  var start, end;
  var totalTimes = [];
  var totalMS = 0.0;

  for (var idx = 0; idx < GET_ITERATIONS; idx++) {
    var customidx = Math.floor(Math.random() * ARRAY_SIZE) + 1;
    start = process.hrtime();
    RESULT = uniquecoll.by("customId", customidx);
    end = process.hrtime(start);
    totalTimes.push(end);
  }

  for (var idx = 0; idx < totalTimes.length; idx++) {
    totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1] / 1e6;
  }

  totalMS = totalMS.toFixed(2);
  var rate = (GET_ITERATIONS * 1000) / totalMS;
  rate = rate.toFixed(2);
  VERBOSE &&
    console.log(
      title + "\t" + "coll.by() : " + totalMS + "ms (" + rate + ") ops/s"
    );
  return rate;
}

//   function testperfGet() {
//     var start, end;
//     var totalTimes = [];
//     var totalMS = 0.0;

//     for (var idx = 0; idx < getIterations; idx++) {
//       var customidx = Math.floor(Math.random() * arraySize) + 1;

//       start = process.hrtime();
//       RESULTults = samplecoll.get(customidx);
//       end = process.hrtime(start);
//       totalTimes.push(end);
//     }

//     for (var idx = 0; idx < totalTimes.length; idx++) {
//       totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1] / 1e6;
//     }

//     totalMS = totalMS.toFixed(2);
//     var rate = (getIterations * 1000) / totalMS;
//     rate = rate.toFixed(2);
//     console.log("coll.get() : " + totalMS + "ms (" + rate + ") ops/s");
//   }

function testperfFind(
  multiplier: number,
  samplecoll: Collection<any>,
  title: string
) {
  var start, end;
  var totalTimes = [];
  var totalMS = 0;

  var loopIterations = TOTAL_ITERATIONS;

  if (typeof multiplier != "undefined") {
    loopIterations = loopIterations * multiplier;
  }

  for (var idx = 0; idx < loopIterations; idx++) {
    var customidx = Math.floor(Math.random() * ARRAY_SIZE) + 1;

    start = process.hrtime();
    RESULT = samplecoll.find({
      customId: customidx,
    });
    end = process.hrtime(start);
    totalTimes.push(end);
  }

  for (var idx = 0; idx < totalTimes.length; idx++) {
    totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1] / 1e6;
  }

  totalMS = totalMS.toFixed(2);
  var rate = (loopIterations * 1000) / totalMS;
  rate = rate.toFixed(2);
  VERBOSE &&
    console.log(
      title +
        "\t" +
        "coll.find() : " +
        totalMS +
        "ms (" +
        rate +
        " ops/s) " +
        loopIterations +
        " iterations"
    );
  return rate;
}

function testperfRS(
  multiplier: number,
  samplecoll: Collection<any>,
  title: string
) {
  var start, end;
  var totalTimes = [];
  var totalMS = 0;

  var loopIterations = TOTAL_ITERATIONS;
  if (typeof multiplier != "undefined") {
    loopIterations = loopIterations * multiplier;
  }

  for (var idx = 0; idx < loopIterations; idx++) {
    var customidx = Math.floor(Math.random() * ARRAY_SIZE) + 1;

    start = process.hrtime();
    RESULT = samplecoll
      .chain()
      .find({
        customId: customidx,
      })
      .data();
    end = process.hrtime(start);
    totalTimes.push(end);
  }

  for (var idx = 0; idx < totalTimes.length; idx++) {
    totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1] / 1e6;
  }

  totalMS = totalMS.toFixed(2);
  var rate = (loopIterations * 1000) / totalMS;
  rate = rate.toFixed(2);
  VERBOSE &&
    console.log(
      title +
        "\t" +
        "resultset chained find() :  " +
        totalMS +
        "ms (" +
        rate +
        " ops/s) " +
        loopIterations +
        " iterations"
    );
  return rate;
}

function testperfDV(
  multiplier: number,
  samplecoll: Collection<any>,
  title: string
) {
  var start, end;
  var start2, end2;
  var totalTimes = [];
  var totalTimes2 = [];
  var totalMS = 0;

  var loopIterations = TOTAL_ITERATIONS;
  if (typeof multiplier != "undefined") {
    loopIterations = loopIterations * multiplier;
  }

  for (var idx = 0; idx < loopIterations; idx++) {
    var customidx = Math.floor(Math.random() * ARRAY_SIZE) + 1;

    start = process.hrtime();
    var dv = samplecoll.addDynamicView("perfview");
    RESULT = dv.applyFind({
      customId: customidx,
    });
    RESULT = dv.data();
    end = process.hrtime(start);
    totalTimes.push(end);

    // test speed of repeated query on an already set up dynamicview
    start2 = process.hrtime();
    RESULT = dv.data();
    end2 = process.hrtime(start2);
    totalTimes2.push(end2);

    samplecoll.removeDynamicView("perfview");
  }

  for (var idx = 0; idx < totalTimes.length; idx++) {
    totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1] / 1e6;
  }

  totalMS = totalMS.toFixed(2);
  var rate = (loopIterations * 1000) / totalMS;
  rate = rate.toFixed(2);

  VERBOSE &&
    console.log(
      title +
        "\t" +
        "loki dynamic view first find : " +
        totalMS +
        "ms (" +
        rate +
        " ops/s) " +
        loopIterations +
        " iterations"
    );

  return rate;
}

function testperfDV2(
  multiplier: number,
  samplecoll: Collection<any>,
  title: string
) {
  var start, end;
  var start2, end2;
  var totalTimes = [];
  var totalTimes2 = [];
  var totalMS2 = 0;

  var loopIterations = TOTAL_ITERATIONS;
  if (typeof multiplier != "undefined") {
    loopIterations = loopIterations * multiplier;
  }

  for (var idx = 0; idx < loopIterations; idx++) {
    var customidx = Math.floor(Math.random() * ARRAY_SIZE) + 1;

    start = process.hrtime();
    var dv = samplecoll.addDynamicView("perfview");
    dv.applyFind({
      customId: customidx,
    });
    dv.data();
    end = process.hrtime(start);
    totalTimes.push(end);

    // test speed of repeated query on an already set up dynamicview
    start2 = process.hrtime();
    RESULT = dv.data();
    end2 = process.hrtime(start2);
    totalTimes2.push(end2);

    samplecoll.removeDynamicView("perfview");
  }

  for (var idx = 0; idx < totalTimes.length; idx++) {
    totalMS2 += totalTimes2[idx][0] * 1e3 + totalTimes2[idx][1] / 1e6;
  }

  totalMS2 = totalMS2.toFixed(2);
  var rate2 = (loopIterations * 1000) / totalMS2;
  rate2 = rate2.toFixed(2);

  VERBOSE &&
    console.log(
      title +
        "\t" +
        "loki dynamic view subsequent finds : " +
        totalMS2 +
        "ms (" +
        rate2 +
        " ops/s) " +
        loopIterations +
        " iterations"
    );
  return rate2;
}
