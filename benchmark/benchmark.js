import chalk from "chalk";
const loki_new = Loki;
import Loki from "../src/lokijs-old.js";
const loki_old = Loki;
const loki_vers = [
  { title: `${chalk.green("new")}`, impl: loki_new },
  { title: `${chalk.blue("orig")}`, impl: loki_old }
];
function runBench(newBench, oldBench) {
  const newBenchResult = newBench.test();
  const oldBenchResult = oldBench.test();
  console.log(
    newBenchResult > oldBenchResult ? chalk.greenBright(
      `${newBench.title} is ${Number(
        Math.abs(newBenchResult / oldBenchResult - 1)
      ).toLocaleString(void 0, {
        style: "percent",
        minimumFractionDigits: 2
      })} faster`
    ) : chalk.blueBright(
      `${oldBench.title} is ${Number(
        Math.abs(1 - oldBenchResult / newBenchResult)
      ).toLocaleString(void 0, {
        style: "percent",
        minimumFractionDigits: 2
      })} faster`
    )
  );
}
const ARRAY_SIZE = 5e3, TOTAL_ITERATIONS = 2e4, GET_ITERATIONS = 2e6, MULTIPLIER = 1;
const VERBOSE = true;
console.log(chalk.yellowBright(`initalizing`));
const db = initializeDB(loki_vers[0].impl, loki_vers[0].title);
const db1 = initializeDB(loki_vers[1].impl, loki_vers[1].title);
initializeUnique(db);
initializeUnique(db1);
console.log(chalk.yellowBright(`benching coll.get()`));
for (let i = 0; i < MULTIPLIER; i++) {
  runBench(
    {
      title: loki_vers[0].title,
      test: () => testperfGet(db.getCollection("samplecoll"), loki_vers[0].title)
    },
    {
      title: loki_vers[1].title,
      test: () => testperfGet(db1.getCollection("samplecoll"), loki_vers[1].title)
    }
  );
}
console.log(chalk.yellowBright(`benching coll.by()`));
for (let i = 0; i < MULTIPLIER; i++) {
  runBench(
    {
      title: loki_vers[0].title,
      test: () => benchUniquePerf(db.getCollection("uniquecoll"), loki_vers[0].title)
    },
    {
      title: loki_vers[1].title,
      test: () => benchUniquePerf(db1.getCollection("uniquecoll"), loki_vers[1].title)
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
      test: () => testperfFind(
        void 0,
        db.getCollection("samplecoll"),
        loki_vers[0].title
      )
    },
    {
      title: loki_vers[1].title,
      test: () => testperfFind(
        void 0,
        db1.getCollection("samplecoll"),
        loki_vers[1].title
      )
    }
  );
}
console.log(chalk.yellowBright(`benching rs.chain().find()`));
for (let i = 0; i < MULTIPLIER; i++) {
  runBench(
    {
      title: loki_vers[0].title,
      test: () => testperfRS(
        void 0,
        db.getCollection("samplecoll"),
        loki_vers[0].title
      )
    },
    {
      title: loki_vers[1].title,
      test: () => testperfRS(
        void 0,
        db1.getCollection("samplecoll"),
        loki_vers[1].title
      )
    }
  );
}
console.log(chalk.yellowBright(`benching dv.data() initial`));
for (let i = 0; i < MULTIPLIER; i++) {
  runBench(
    {
      title: loki_vers[0].title,
      test: () => testperfDV(
        void 0,
        db.getCollection("samplecoll"),
        loki_vers[0].title
      )
    },
    {
      title: loki_vers[1].title,
      test: () => testperfDV(
        void 0,
        db1.getCollection("samplecoll"),
        loki_vers[1].title
      )
    }
  );
}
console.log(chalk.yellowBright(`benching dv.data() sub`));
for (let i = 0; i < MULTIPLIER; i++) {
  runBench(
    {
      title: loki_vers[0].title,
      test: () => testperfDV2(
        void 0,
        db.getCollection("samplecoll"),
        loki_vers[0].title
      )
    },
    {
      title: loki_vers[1].title,
      test: () => testperfDV2(
        void 0,
        db1.getCollection("samplecoll"),
        loki_vers[1].title
      )
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
      test: () => testperfFind(20, db.getCollection("samplecoll"), loki_vers[0].title)
    },
    {
      title: loki_vers[1].title,
      test: () => testperfFind(20, db1.getCollection("samplecoll"), loki_vers[1].title)
    }
  );
}
console.log(chalk.yellowBright(`benching rs.chain().find()`));
for (let i = 0; i < MULTIPLIER; i++) {
  runBench(
    {
      title: loki_vers[0].title,
      test: () => testperfRS(15, db.getCollection("samplecoll"), loki_vers[0].title)
    },
    {
      title: loki_vers[1].title,
      test: () => testperfRS(15, db1.getCollection("samplecoll"), loki_vers[1].title)
    }
  );
}
console.log(chalk.yellowBright(`benching dv.data() initial`));
for (let i = 0; i < MULTIPLIER; i++) {
  runBench(
    {
      title: loki_vers[0].title,
      test: () => testperfDV(15, db.getCollection("samplecoll"), loki_vers[0].title)
    },
    {
      title: loki_vers[1].title,
      test: () => testperfDV(15, db1.getCollection("samplecoll"), loki_vers[1].title)
    }
  );
}
console.log(chalk.yellowBright(`benching dv.data() sub`));
for (let i = 0; i < MULTIPLIER; i++) {
  runBench(
    {
      title: loki_vers[0].title,
      test: () => testperfDV2(15, db.getCollection("samplecoll"), loki_vers[0].title)
    },
    {
      title: loki_vers[1].title,
      test: () => testperfDV2(15, db1.getCollection("samplecoll"), loki_vers[1].title)
    }
  );
}
function testperfGet(samplecoll, title) {
  var start, end;
  var totalTimes = [];
  var totalMS = 0;
  for (var idx = 0; idx < GET_ITERATIONS; idx++) {
    var customidx = Math.floor(Math.random() * ARRAY_SIZE) + 1;
    start = process.hrtime();
    samplecoll.get(customidx);
    end = process.hrtime(start);
    totalTimes.push(end);
  }
  for (var idx = 0; idx < totalTimes.length; idx++) {
    totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1] / 1e6;
  }
  totalMS = parseFloat(totalMS.toFixed(2));
  var rate = GET_ITERATIONS * 1e3 / totalMS;
  rate = parseFloat(rate.toFixed(2));
  VERBOSE && console.log(
    title + "	coll.get() : " + totalMS + "ms (" + rate + ") ops/s"
  );
  return rate;
}
function initializeDB(loki, title) {
  const db2 = new loki("perftest");
  var start, end;
  var totalTimes = [];
  var totalMS = 0;
  const samplecoll = db2.addCollection("samplecoll");
  for (var idx = 0; idx < ARRAY_SIZE; idx++) {
    var v1 = genRandomVal();
    var v2 = genRandomVal();
    start = process.hrtime();
    samplecoll.insert({
      customId: idx,
      val: v1,
      val2: v2,
      val3: "more data 1234567890"
    });
    end = process.hrtime(start);
    totalTimes.push(end);
  }
  for (var idx = 0; idx < totalTimes.length; idx++) {
    totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1] / 1e6;
  }
  totalMS = totalMS.toFixed(2);
  var rate = ARRAY_SIZE * 1e3 / totalMS;
  rate = rate.toFixed(2);
  VERBOSE && console.log(
    title + "	load (insert) : " + totalMS + "ms (" + rate + ") ops/s"
  );
  return db2;
}
function initializeUnique(db2) {
  const uniquecoll = db2.addCollection("uniquecoll", {
    unique: ["customId"]
  });
  for (var idx = 0; idx < ARRAY_SIZE; idx++) {
    var v1 = genRandomVal();
    var v2 = genRandomVal();
    uniquecoll.insert({
      customId: ARRAY_SIZE - idx,
      val: v1,
      val2: v2,
      val3: "more data 1234567890"
    });
  }
}
function genRandomVal() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 20; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}
function benchUniquePerf(uniquecoll, title) {
  var start, end;
  var totalTimes = [];
  var totalMS = 0;
  for (var idx = 0; idx < GET_ITERATIONS; idx++) {
    var customidx = Math.floor(Math.random() * ARRAY_SIZE) + 1;
    start = process.hrtime();
    uniquecoll.by("customId", customidx);
    end = process.hrtime(start);
    totalTimes.push(end);
  }
  for (var idx = 0; idx < totalTimes.length; idx++) {
    totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1] / 1e6;
  }
  totalMS = totalMS.toFixed(2);
  var rate = GET_ITERATIONS * 1e3 / totalMS;
  rate = rate.toFixed(2);
  VERBOSE && console.log(
    title + "	coll.by() : " + totalMS + "ms (" + rate + ") ops/s"
  );
  return rate;
}
function testperfFind(multiplier, samplecoll, title) {
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
    samplecoll.find({
      customId: customidx
    });
    end = process.hrtime(start);
    totalTimes.push(end);
  }
  for (var idx = 0; idx < totalTimes.length; idx++) {
    totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1] / 1e6;
  }
  totalMS = totalMS.toFixed(2);
  var rate = loopIterations * 1e3 / totalMS;
  rate = rate.toFixed(2);
  VERBOSE && console.log(
    title + "	coll.find() : " + totalMS + "ms (" + rate + " ops/s) " + loopIterations + " iterations"
  );
  return rate;
}
function testperfRS(multiplier, samplecoll, title) {
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
    samplecoll.chain().find({
      customId: customidx
    }).data();
    end = process.hrtime(start);
    totalTimes.push(end);
  }
  for (var idx = 0; idx < totalTimes.length; idx++) {
    totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1] / 1e6;
  }
  totalMS = totalMS.toFixed(2);
  var rate = loopIterations * 1e3 / totalMS;
  rate = rate.toFixed(2);
  VERBOSE && console.log(
    title + "	resultset chained find() :  " + totalMS + "ms (" + rate + " ops/s) " + loopIterations + " iterations"
  );
  return rate;
}
function testperfDV(multiplier, samplecoll, title) {
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
    dv.applyFind({
      customId: customidx
    });
    dv.data();
    end = process.hrtime(start);
    totalTimes.push(end);
    start2 = process.hrtime();
    dv.data();
    end2 = process.hrtime(start2);
    totalTimes2.push(end2);
    samplecoll.removeDynamicView("perfview");
  }
  for (var idx = 0; idx < totalTimes.length; idx++) {
    totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1] / 1e6;
  }
  totalMS = totalMS.toFixed(2);
  var rate = loopIterations * 1e3 / totalMS;
  rate = rate.toFixed(2);
  VERBOSE && console.log(
    title + "	loki dynamic view first find : " + totalMS + "ms (" + rate + " ops/s) " + loopIterations + " iterations"
  );
  return rate;
}
function testperfDV2(multiplier, samplecoll, title) {
  var start, end;
  var start2, end2;
  var totalTimes = [];
  var totalTimes2 = [];
  var totalMS = 0;
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
      customId: customidx
    });
    dv.data();
    end = process.hrtime(start);
    totalTimes.push(end);
    start2 = process.hrtime();
    dv.data();
    end2 = process.hrtime(start2);
    totalTimes2.push(end2);
    samplecoll.removeDynamicView("perfview");
  }
  for (var idx = 0; idx < totalTimes.length; idx++) {
    totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1] / 1e6;
    totalMS2 += totalTimes2[idx][0] * 1e3 + totalTimes2[idx][1] / 1e6;
  }
  totalMS2 = totalMS2.toFixed(2);
  var rate2 = loopIterations * 1e3 / totalMS2;
  rate2 = rate2.toFixed(2);
  VERBOSE && console.log(
    title + "	loki dynamic view subsequent finds : " + totalMS2 + "ms (" + rate2 + " ops/s) " + loopIterations + " iterations"
  );
  return rate2;
}
