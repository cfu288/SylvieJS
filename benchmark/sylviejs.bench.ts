import { benchmarkSuite } from "jest-bench";
import { SuiteOptions } from "jest-bench/dist/suite";
// import LokiOriginal from "./releases/lokijs-original";
// const loki_original = LokiOriginal;

import Sylvie from "../src/sylviejs";
const loki = Sylvie;

let db, samplecoll, uniquecoll;
const testCollectionSize = 50000;

function genRandomVal() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 20; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

const benchConfig: SuiteOptions = {
  minSamples: 100,
  timeoutSeconds: 60,
};

benchmarkSuite(
  "Collection (NON-INDEXED)",
  {
    setupSuite() {
      // setupSuite will run once before all tests
      db = new loki("perftest");
      samplecoll = db.addCollection("samplecoll");
      for (let idx = 0; idx < testCollectionSize; idx++) {
        const v1 = genRandomVal();
        const v2 = genRandomVal();
        samplecoll.insert({
          customId: idx,
          val: v1,
          val2: v2,
          val3: "more data 1234567890",
        });
      }
    },

    ["get()"]: () => {
      const customidx = Math.floor(Math.random() * testCollectionSize) + 1;
      samplecoll.get(customidx);
    },

    ["insert()"]: () => {
      const customidx = genRandomVal();

      const v1 = genRandomVal();
      const v2 = genRandomVal();
      samplecoll.insert({
        customId: customidx,
        val: v1,
        val2: v2,
        val3: "more data 1234567890",
      });
    },

    ["find()"]: () => {
      const customidx = Math.floor(Math.random() * testCollectionSize) + 1;
      samplecoll.find({
        customId: customidx,
      });
    },

    ["chain().find().data() [Resultset]"]: () => {
      const customidx = Math.floor(Math.random() * testCollectionSize) + 1;
      samplecoll
        .chain()
        .find({
          customId: customidx,
        })
        .data();
    },

    ["applyFind() [DynamicView]"]: () => {
      const dv = samplecoll.addDynamicView("perfview");
      const customidx = Math.floor(Math.random() * testCollectionSize) + 1;
      dv.applyFind({
        customId: customidx,
      });
      dv.data();
      samplecoll.removeDynamicView("perfview");
    },

    ["applyFind() (sequential 100x) [DynamicView]"]: () => {
      const dv = samplecoll.addDynamicView("perfview");
      const customidx = Math.floor(Math.random() * testCollectionSize) + 1;
      for (let idx = 0; idx < 100; idx++) {
        dv.applyFind({
          customId: customidx,
        });
        dv.data();
      }
      samplecoll.removeDynamicView("perfview");
    },
  },
  benchConfig
);

benchmarkSuite(
  "Collection (INDEXED)",
  {
    setupSuite() {
      // setupSuite will run once before all tests
      db = new loki("perftest");
      samplecoll = db.addCollection("samplecoll");
      for (let idx = 0; idx < testCollectionSize; idx++) {
        const v1 = genRandomVal();
        const v2 = genRandomVal();
        samplecoll.insert({
          customId: idx,
          val: v1,
          val2: v2,
          val3: "more data 1234567890",
        });
      }
      samplecoll.ensureIndex("customId");
    },

    ["get()"]: () => {
      const customidx = Math.floor(Math.random() * testCollectionSize) + 1;
      samplecoll.get(customidx);
    },

    ["insert()"]: () => {
      const customidx = genRandomVal();

      const v1 = genRandomVal();
      const v2 = genRandomVal();
      samplecoll.insert({
        customId: customidx,
        val: v1,
        val2: v2,
        val3: "more data 1234567890",
      });
    },

    ["find()"]: () => {
      const customidx = Math.floor(Math.random() * testCollectionSize) + 1;
      samplecoll.find({
        customId: customidx,
      });
    },

    ["chain().find().data() [Resultset]"]: () => {
      const customidx = Math.floor(Math.random() * testCollectionSize) + 1;
      samplecoll
        .chain()
        .find({
          customId: customidx,
        })
        .data();
    },

    ["applyFind() [DynamicView]"]: () => {
      const dv = samplecoll.addDynamicView("perfview");
      const customidx = Math.floor(Math.random() * testCollectionSize) + 1;
      dv.applyFind({
        customId: customidx,
      });
      dv.data();
      samplecoll.removeDynamicView("perfview");
    },

    ["applyFind() (sequential 100x) [DynamicView]"]: () => {
      const dv = samplecoll.addDynamicView("perfview");
      const customidx = Math.floor(Math.random() * testCollectionSize) + 1;
      for (let idx = 0; idx < 100; idx++) {
        dv.applyFind({
          customId: customidx,
        });
        dv.data();
      }
      samplecoll.removeDynamicView("perfview");
    },
  },
  benchConfig
);

benchmarkSuite(
  "Unique Collection (NON-INDEXED)",
  {
    setupSuite() {
      // setupSuite will run once before all tests
      db = new loki("perftest");
      uniquecoll = db.addCollection("uniquecoll", {
        unique: ["customId"],
      });
      for (let idx = 0; idx < testCollectionSize; idx++) {
        const v1 = genRandomVal();
        const v2 = genRandomVal();
        uniquecoll.insert({
          customId: idx,
          val: v1,
          val2: v2,
          val3: "more data 1234567890",
        });
      }
    },

    ["get()"]: () => {
      const customidx = Math.floor(Math.random() * testCollectionSize) + 1;
      uniquecoll.get(customidx);
    },

    ["insert()"]: () => {
      const customidx = genRandomVal();

      const v1 = genRandomVal();
      const v2 = genRandomVal();
      uniquecoll.insert({
        customId: customidx,
        val: v1,
        val2: v2,
        val3: "more data 1234567890",
      });
    },

    ["find()"]: () => {
      const customidx = Math.floor(Math.random() * testCollectionSize) + 1;
      uniquecoll.find({
        customId: customidx,
      });
    },

    ["chain().find().data() [Resultset]"]: () => {
      const customidx = Math.floor(Math.random() * testCollectionSize) + 1;
      uniquecoll
        .chain()
        .find({
          customId: customidx,
        })
        .data();
    },

    ["applyFind() [DynamicView]"]: () => {
      const dv = samplecoll.addDynamicView("perfview");
      const customidx = Math.floor(Math.random() * testCollectionSize) + 1;
      dv.applyFind({
        customId: customidx,
      });
      dv.data();
      samplecoll.removeDynamicView("perfview");
    },

    ["applyFind() (sequential 100x) [DynamicView]"]: () => {
      const dv = samplecoll.addDynamicView("perfview");
      const customidx = Math.floor(Math.random() * testCollectionSize) + 1;
      for (let idx = 0; idx < 100; idx++) {
        dv.applyFind({
          customId: customidx,
        });
        dv.data();
      }
      samplecoll.removeDynamicView("perfview");
    },
  },
  benchConfig
);

benchmarkSuite(
  "Unique Collection (INDEXED)",
  {
    setupSuite() {
      // setupSuite will run once before all tests
      db = new loki("perftest");
      uniquecoll = db.addCollection("uniquecoll", {
        unique: ["customId"],
      });
      for (let idx = 0; idx < testCollectionSize; idx++) {
        const v1 = genRandomVal();
        const v2 = genRandomVal();
        uniquecoll.insert({
          customId: idx,
          val: v1,
          val2: v2,
          val3: "more data 1234567890",
        });
        uniquecoll.ensureIndex("customId");
      }
    },

    ["get()"]: () => {
      const customidx = Math.floor(Math.random() * testCollectionSize) + 1;
      uniquecoll.get(customidx);
    },

    ["insert()"]: () => {
      const customidx = genRandomVal();

      const v1 = genRandomVal();
      const v2 = genRandomVal();
      uniquecoll.insert({
        customId: customidx,
        val: v1,
        val2: v2,
        val3: "more data 1234567890",
      });
    },

    ["find()"]: () => {
      const customidx = Math.floor(Math.random() * testCollectionSize) + 1;
      uniquecoll.find({
        customId: customidx,
      });
    },

    ["chain().find().data() [Resultset]"]: () => {
      const customidx = Math.floor(Math.random() * testCollectionSize) + 1;
      uniquecoll
        .chain()
        .find({
          customId: customidx,
        })
        .data();
    },

    ["applyFind() [DynamicView]"]: () => {
      const dv = samplecoll.addDynamicView("perfview");
      const customidx = Math.floor(Math.random() * testCollectionSize) + 1;
      dv.applyFind({
        customId: customidx,
      });
      dv.data();
      samplecoll.removeDynamicView("perfview");
    },

    ["applyFind() (sequential 100x) [DynamicView]"]: () => {
      const dv = samplecoll.addDynamicView("perfview");
      const customidx = Math.floor(Math.random() * testCollectionSize) + 1;
      for (let idx = 0; idx < 100; idx++) {
        dv.applyFind({
          customId: customidx,
        });
        dv.data();
      }
      samplecoll.removeDynamicView("perfview");
    },
  },
  benchConfig
);
