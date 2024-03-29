# Overview

SylvieJS is a in-memory database. Unlike traditional databases, operations (query, insert, etc) are done completely in memory and are not loaded as needed. However, SylvieJS does support persistance - the role of persistance is limited to saving and restoring the state of this in-memory database.

Since SylvieJS runs in many different types of environments where capabilities for persistance can differ greatly (NodeJS and Browsers), persistence is implemented via an adapter interface, where adapters can easily be swapped depending on the use case. Persistence implementations can even differ greatly in a specific environment. For example, in a browser we could implement persistance using localStorage, IndexedDB, and now OPFS.

Sylvie provides two default persistance adapters and will select one depending on which environment it is being run in:

- Browsers will run using the LocalStorageAdapter by default
- NodeJS will run using the FsAdapter by default

The adapter Sylvie will be used can easily be overridden, and end-users can provide their own adapters to provide custom persistance implementations. To write your own persistance adapter, write a class that implements either the `PersistenceAdapter` interface or the `AsyncPersistenceAdapter` and pass the adapter to Sylvie on start.

Other persistance adapters available in this project include (but are not limited to):

- IndexedDBAdapter
- CryptedIndexedDBAdapter
- IncrementalIndexedDBAdapter
- OPFSAdapter
- MemoryAdapter
- FSStructuredAdapter

# Node.js QuickStart

If you are using SylvieJS in a node environment, we will automatically detect and use the built-in fs-adapter without your needing to provide an adapter.

### Manual Persistence Example

```javascript
import Sylvie from "sylviejs";

var db = new Sylvie("quickstart.db");
var users = db.addCollection("users");

users.insert({ name: "odin", age: 50 });
users.insert({ name: "thor", age: 35 });

var result = users.find({ age: { $lte: 35 } });

// dumps array with 1 doc (thor) to console
console.log(result);

// Sylvie will only persist the database if saveDatabase() or saveDatabaseAsync() is called.
await db.saveDatabaseAsync();
```

### Autosave/Autoload with default FsAdapter

```javascript
var db = new Sylvie("quickstart.db", {
  autoload: true,
  autoloadCallback: databaseInitialize,
  autosave: true,
  autosaveInterval: 4000,
});

// implement the autoloadback referenced in sylvie constructor
function databaseInitialize() {
  var entries = db.getCollection("entries");
  if (entries === null) {
    entries = db.addCollection("entries");
  }

  // kick off any program logic or start listening to external events
  runProgramLogic();
}

// example method with any bootstrap logic to run after database initialized
function runProgramLogic() {
  var entryCount = db.getCollection("entries").count();
  console.log("number of entries in database : " + entryCount);
}
```

If you expect your database to grow over 100mb or you experience slow save speeds you might to use our more high-performance FsStructuredAdapter. This adapter utilizes es6 generator iterators and node streams to stream the database line by line. It will also save each collection into its own file (partitioned) with a file name derived from the base name. This database should scale to support databases just under 1 gb on the default node heap allocation of 1.4gb. Increasing heap allocation, you can push this limit further.

### An example FsStructuredAdapter (NodeJS) might look like

```javascript
import Sylvie from "sylviejs";
const lfsa = require("./fs-structured-adapter.js");

var adapter = new lfsa();
var db = new Sylvie("sandbox.db", {
  adapter: adapter,
  autoload: true,
  autoloadCallback: databaseInitialize,
  autosave: true,
  autosaveInterval: 4000,
});

function databaseInitialize() {
  var log = db.getCollection("log");

  if (log === null) {
    db.addCollection("log");
  }

  // log some random event data as part of our example
  log.insert({ event: "dbinit", dt: new Date().getTime() });
}
```

# Web QuickStart

If you are using SylvieJS in a web environment, we will automatically use the built-in localStorage adapter.

```html
<script type="module" src="./sylviejs.js"></script>
<script>
  window.addEventListener("load", async () => {
    const db = new Sylvie("test.db");
    // Do stuff with db
  });
</script>
```

Or:

```ts
import Sylvie from "./sylviejs";

const db = new Sylvie("test.db");
```

You can enable autoload/autosave with Sylvie:

```javascript
const db = new Sylvie("quickstart.db", {
  autoload: true,
  autoloadCallback: databaseInitialize,
  autosave: true,
  autosaveInterval: 4000,
});

function databaseInitialize() {
  if (!db.getCollection("users")) {
    db.addCollection("users");
  }
}
```

**Note**: We still default to the localStorage adapter for backwards compatibility with Loki. However, we suggest using another adapter like the IndexedDBAdapter due to a storage limitation of only 5 mb with the localStorage adapter (See next section).

### Example using IndexedDBAdapter

```html
<script type="module" src="./sylviejs.js"></script>
<script type="module" src="./indexeddb-adapter"></script>
<script>
  window.addEventListener("load", async () => {
    const adapter = new IndexedDBAdapter();
    const db = new Sylvie("quickstart.db", {
      adapter: adapter,
    });
    // Do stuff with db
  });
</script>
```

Or:

```ts
import Sylvie from "./sylviejs";
import { IndexedDBAdapter } from "./indexeddb-adapter";

const adapter = new IndexedDBAdapter();
const db = new Sylvie("quickstart.db", {
  adapter: adapter,
});
```

If you expect your database to grow over 60megs things start to get browser dependent. To provide singular guidance and since Chrome is the most popular web browser you will want to employ our PartitioningAdapter in addition to our IndexedAdapter. The PartitioningAdapter wraps other adapters to divide collections into their own files. If a collection exceeds 25megs (customizable) it will subdivide into separate pages(files). This allows our IndexedDB adapter to accomplish a single database save/load using many key/value pairs. This adapter will allow scaling up to around 300mb or so in current testing.

### An example using the PartitioningAdapter along with IndexedAdapter might appear as :

```
<script src="../../src/sylviejs.js"></script>
<script src="../../src/indexed-adapter.js"></script>
```

```javascript
const idbAdapter = new IndexedAdapter();
const partAdapter = new PartitioningAdapter(idbAdapter, { paging: true });
const db = new Sylvie("quickstart.db", {
  adapter: partAdapter,
});
```

### Example using IncrementalIndexedDBAdapter

A newer, more advanced alternative to `IndexedAdapter` with `PartitioningAdapter` is to use `IncrementalIndexedDBAdapter`.
Unlike `IndexedAdapter`, the database is saved not as one big JSON blob (or even pages of individual collections), but split into
small chunks with individual collection documents. When saving, only the chunks with changed
documents (and database metadata) is saved to IndexedDB. This speeds up small incremental
saves by an order of magnitude on large (tens of thousands of records) databases. It also
avoids Safari 13 bug that would cause the database to balloon in size to gigabytes.

`IncrementalIndexedDBAdapter` is not backwards compatible with `IndexedAdapter`.

```html
<script src="./sylviejs.js"></script>
<script src="./incremental-indexeddb-adapter.js"></script>
```

```javascript
var db = new Sylvie("quickstart.db", {
  adapter: new IncrementalIndexedDBAdapter(),
});
```

# Configuring persistence adapters

## Autosave, Autoload and close()

SylvieJS supports automatic saving at user defined intervals, configured via Sylvie constructor options. This is supported for all persistenceMethods. Data is only saved if changes have occurred since the last save. You can also specify an autoload to immediately load a saved database during new Sylvie construction. If you need to process anything on load completion you can also specify your own autoloadCallback. Finally, in an autosave scenario, if the user wants to exit or is notified of leaving the webpage (window.onbeforeunload) you can call close() on the database which will perform a final save (if needed).

> _**Note : the ability of Sylvie to 'flush' data on events such as a browsers onbeforeunload event, depends on the storage adapter being synchronous. Local storage and file system adapters are synchronous but indexeddb is asynchronous and cannot save when triggered from db.close() in an onbeforeunload event. The mouseleave event may allow enough time to perform a preemptive save.**_

### Autosave example

```javascript
var idbAdapter = new IndexedAdapter("loki");
var db = new Sylvie("test", {
  autosave: true,
  autosaveInterval: 10000, // 10 seconds
  adapter: idbAdapter,
});
```

### Autosave with autoload example

```javascript
var idbAdapter = new lokiIndexedAdapter("loki");
var db = new Sylvie("test.db", {
  autoload: true,
  autoloadCallback: loadHandler,
  autosave: true,
  autosaveInterval: 10000, // 10 seconds
  adapter: idbAdapter,
});

function loadHandler() {
  // if database did not exist it will be empty so I will intitialize here
  var coll = db.getCollection("entries");
  if (coll === null) {
    coll = db.addCollection("entries");
  }
}
```

# Save throttling and persistence contention management

SylvieJS now supports throttled saves and loads to avoid overlapping saveDatabase and loadDatabase calls from interfering with each other. This is controlled by a loki constructor option called 'throttledSaves' and the default for that option is 'true'.

This means that within any single Sylvie database instance, multiple saves routed to the persistence adapter will be throttled and ensured to not conflict by overlap. With save throttling, during the time between an adapter save and an adapter response to that save, if new save requests come in we will queue those requests (and their callbacks) for a save which we will initiate immediately after the current save is complete. In that situation, if 10 requests to save had been made while a save is pending, the subsequent (single) save will callback all ten queued/tiered callbacks when -it- completes.

If a loadDatabase call occurs while a save is pending, we will (by default) wait indefinitely for the queue to deplete without being replenished. Once that occurs we will lock all saves during the load... any incoming save requests made while the database is being loaded will then be queued for saving once the load is completed. Since loadDatabase now internally calls a new 'throttledSaveDrain' we will pass through options to control that drain. (These options will be summarized below).

You may also directly call this 'throttledSaveDrain' loki method which can wait for the queue to drain. You might do this using any of these variations/options :

```javascript
// wait indefinitely (recursively)
db.throttledSaveDrain(function () {
  console.log("no saves in progress");
});
```

```javascript
// wait only for the -current- queue to deplete
db.throttledSaveDrain(
  function () {
    console.log("queue drained");
  },
  { recursiveWait: false },
);
```

```javascript
// wait recursively but only for so long...
db.throttledSaveDrain(
  function (success) {
    if (success) {
      console.log("no saves in progress");
    } else {
      console.log("taking too long, try again later");
    }
  },
  { recursiveWaitLimit: true, recursiveWaitLimitDuration: 2000 },
);
```

If you do not wish loki to supervise these conflicts with its throttling contention management, you can disable this by constructing loki with the following option (in addition to any existing options you are passing) :

```javascript
var db = new Sylvie("test.db", { throttledSaves: false });
```

# Creating your own Sylvie Persistence Adapters

Sylviejs currently supports three types of database adapters : 'normal', 'reference', and 'incremental' mode adapters.

Normal adapters implement the following methods:

```ts
  saveDatabase(
    dbname: string,
    dbstring: string,
    callback?: PersistenceAdapterCallback,
  ): void;
  loadDatabase(
    dbname: string,
    callback: (value: string | Error | null) => void,
  ): void;
  deleteDatabase(dbname: string, callback: PersistenceAdapterCallback): void;
```

Note that dbstring in saveDatabase is a serialized string to be written to the underlying store by the adapter. This is well suited to key/value stores.

Reference mode adapters implement the following interface:

```ts
  exportDatabase(
    dbname: string,
    dbref: Sylvie,
    callback?: PersistenceAdapterCallback,
  ): void;
  loadDatabase(
    dbname: string,
    callback: (value: string | Error | Sylvie) => void,
  ): void;
  deleteDatabase(dbname: string, callback: PersistenceAdapterCallback): void;
```

Reference mode adapters are passed a reference to the database itself instead of a serialized string where it can save however it wishes to in saveDatabase(). When loading, reference mode adapters can return an object reference or serialized string. Below we will describe the minimal functionality which sylviejs requires, you may want to provide additional adapter functionality for deleting or inspecting its persistence store.

Incremental mode adapters implement the following interface:

```ts
  saveDatabase(
    dbname: string,
    dbref: () => Sylvie,
    callback?: PersistenceAdapterCallback,
  ): void;
  loadDatabase(
    dbname: string,
    callback: (value: string | Error | null) => void,
  ): void;
  deleteDatabase(dbname: string, callback: PersistenceAdapterCallback): void;
```

Incremental mode adapters are passed function that returns a reference to the database itself instead of a serialized string in saveDatabase().

## Creating your own 'Normal' persistence adapter

You can create your own custom adapters by implementing the `PersistenceAdapter` interface or `AsyncPersistenceAdapter`. Either will work, you do not need to implement both.

```javascript
export class MyCustomAdapter implements NormalPersistenceAdapter {
  mode: "normal";

  loadDatabase(
    dbname: string,
    callback: (value: string | Error) => void
  ): void {
     // Implement loading database
  }

  saveDatabase(dbname: string, dbstring, callback: PersistenceAdapterCallback): void {
    // Implement saving database
  }

  deleteDatabase(dbname: string, callback: PersistenceAdapterCallback): void {
    // Implement database deletion
  }
}
```

## Creating your own 'Reference Mode' persistence adapter

An additional 'level' of adapter support would be for your adapter to support **'reference'** mode support. This 'reference' mode will allow sylviejs to provide your adapter with a reference to a lightweight 'copy' of the database sharing only the collection.data[] document object instances with the original database. You would use this reference to destructure or save however you want to.

To instruct loki that your adapter supports 'reference' mode, you will need to implement a top level property called 'mode' on your adapter and set it equal to 'reference'. Having done that and configured that adapter to be used, whenever loki wishes to save the database it will instead call out to an exportDatabase() method on your adapter.

A simple example of an advanced 'reference' mode adapter might look like :

```javascript
export class MyCustomAdapter implements ReferencePersistenceAdapter {
  mode: "reference";

  loadDatabase(
    dbname: string,
    callback: (value: string | Error) => void
  ): void {
     // Implement loading database
  }

  saveDatabase(dbname: string, dbstring, callback: PersistenceAdapterCallback): void {
    // Implement saving database
  }

  deleteDatabase(dbname: string, callback: PersistenceAdapterCallback): void {
    // Implement database deletion
  }

  exportDatabase(dbname: string, dbref: typeof Sylvie, callback?: PersistenceAdapterCallback): void {
    // Implement database export
  }
}
```

# PartitioningAdapter

This is an adapter for adapters. It wraps around and converts any 'basic' persistence adapter into one that scales nicely to your memory contraints. It can split your database up, saving each collection independently and only if changes have occurred since the last save. Since each collection is saved separately there is lower memory overhead and since only dirty collections are saved there is improved i/o save speeds.

> Chrome (using indexedDb) places a restriction on how large a single saved 'chunk' can be, this Partitioning adapter with just partitioning raises that limit from being 'per db' to 'per collection'... when paging is enabled that limit is raised to being 'per document'. Chrome indexedDb limit is somewhere around 30-60megs sized chunks.

An example using partition adapter with our IndexedAdapter might appear such as :

```javascript
var idbAdapter = new IndexedAdapter("appAdapter");
var pa = new loki.PartitioningAdapter(idbAdapter);

var db = new Sylvie("sandbox.db", { adapter: pa });
```

If you expect a single collection to grow rather large you may even want to utilize an additional 'paging' mode that this adapter provides. This is useful if you want to limit the size of data sent to the inner persistence adapter. This paging mode was added to accomodate a Chrome limitation on maximum record sizes. An example using paging mode might appear as follows :

```javascript
var idbAdapter = new IndexedAdapter("appAdapter");
var pa = new loki.PartitioningAdapter(idbAdapter, { paging: true });

var db = new Sylvie("sandbox.db", { adapter: pa });
```

You can also pass in a pageSize option if you wish to use a page size other than the default 25meg page size.

```javascript
// set up adapter to page using 35 meg page size
var pa = new loki.PartitioningAdapter(idbAdapter, {
  paging: true,
  pageSize: 35 * 1024 * 1024,
});
```

# MemoryAdapter

This 'basic' persistence adapter is only intended for experimenting and testing since it retains its key/value store in memory and will be lost when session is done. This enables us to verify the partitioning adapter works and can be used to mock persistence for unit testing.

You might access this memory adapter (which is included in the main source file) similarly to the following :

```javascript
var mem = new MemoryAdapter();
var db = new Sylvie("sandbox.db", { adapter: mem });
```

If you wish to simulate asynchronous 'basic' adapter you can pass options to its constructor :

```javascript
// simulate 50ms async delay for loads and saves. this will yield thread until then
var mem = new MemoryAdapter({
  asyncResponses: true,
  asyncTimeout: 50,
});
var db = new Sylvie("sandbox.db", { adapter: mem });
```

> In order to see PartitioningAdapter used in conjunction with MemoryAdapter you can view this [Sylvie Sandbox gist](https://rawgit.com/techfort/SylvieJS/master/examples/sandbox/SylvieSandbox.htm#rawgist=https://gist.githubusercontent.com/obeliskos/15c1aa87da16cd89b328eb84bbcdf8fa/raw/d91ac3fee212dc5aa96cb05f479d825faa17c1c8/PartitionedMemoryAdapterTest) in your browser.

What is happening in the gist linked above is that we create an instance of a MemoryAdapter and pass that instance to the PartitioningAdapter. We ultimately pass in the created PartitioningAdapter instance to the database constructor. We then add multiple collections to our database, save it, update one of the collections (causing that collection's 'dirty' flag to be set), and save again. When we examine the output of the script we can view the contents of the memory adapter's internal hash store to see how there are multiple keys for a single database. We can also see that our modified collection (along with the database container itself) was saved again. The database container currently has no 'dirty' flag set but since we remove all collection.data[] object instances from it, it is relatively lightweight.

# 'Rolling your own' structured serialization mechanism

In addition to the [ChangesAPI](https://github.com/techfort/SylvieJS/wiki/Changes-API) which can be utilized to isolate changesets, SylvieJS has established several internal utility methods to assist users in developing optimal persistence or transmission of database contents.

Those mechanisms include the ability to decompose the database into 'partitions' of structured serializations or assembled into a line oriented format (non-partitioned) and either delimited (single delimited string per collection) or non-delimited (array of strings, one per document). These utility methods are located on the Sylvie object instance itself as the 'serializeDestructured' and 'deserializeDestructured' methods. They can be invoked to create structured json serialization for the entire database, or (if you pass a partition option) it can provide a single partition at a time. Internal loki structured serialization in its current form provides mild memory overhead reduction and decreases I/O time if only some collections need to be saved. It may also be useful for other data exchange or synchronization mechanisms.

In sylviejs terminology the partitions of a database include the database container (partition -1) along with each individual collection (partitions 0-n).

To destructure in various formats you can experiment with the following parameters :

```javascript
var result = db.serializeDestructured({
  partitioned: false,
  delimited: false,
});
```

To destructure a single partition you might use the following syntax and experiment with 'delimited' and 'partition' properties :

```javascript
var result = db.serializeDestructured({
  partitioned: true,
  partition: 1,
  delimited: false,
});
```

> To experiment with the various structured serialization formats you can view this [Sylvie Sandbox gist](https://rawgit.com/techfort/SylvieJS/master/examples/sandbox/SylvieSandbox.htm#rawgist=https://gist.githubusercontent.com/obeliskos/98a73205d7fe9746a687634e19a5eb89/raw/3821c9bbb6bae2689b00d16be9fae78dff430e28/destructuring%2520demo) and try various combinations of 'partitioned' and 'delimited' options (making sure both the serializeDestructured and deserializeDestructured use the same values.

Destructuring (making many smaller json serializations vs one large serialization) does not lower memory overhead but seems to be a little faster. Partitioning can reduce memory overhead if you can dispose of those memory chunks before advancing to the next (which our adapter implementations do). Our 2.0.0 branch which is able to use ES6 language constructs may gain an iterable interface in the future for data exchange or line-by-line streaming.

If your database is small enough you can use the PartitioningAdapter (with or without paging) along with MemoryAdapter to decompose database into appropriately sized 'chunks' for transmission.

# Detailed IndexedAdapter Description

Our IndexedAdapter is implemented as a 'Normal' mode persistence adapter. Since this will probably be the default web persistence adapter, this section will overview some of its advanced features.

It implements persistence by defining an app/key/value database in indexeddb for storing serialized databases (or partitions). The 'app' portion is designated when instantiating the adapter and loki only supplies it key/value pair for storage.

### Simple Example of using IndexedAdapter (for browser environments) :

```javascript
<script src="scripts/sylviejs/sylviejs.js"></script>
<script src="scripts/sylviejs/indexed-adapter.js"></script>
```

...

```javascript
var idbAdapter = new IndexedAdapter("finance");
var db = new Sylvie("test", { adapter: idbAdapter });
```

Note the 'finance' in this case represents an 'App' context and the 'test' designates the key (or database name)... the 'value' is the serialized strings representing your database which Sylvie will provide. Advantages include larger storage limits over localstorage, and a catalog based approach where you can store many databases, grouped by an 'App' context. Since indexedDB storage is provided 'per-domain', and on any given domain you might be running several web 'apps' each with its own database(s), this structure allows for organization and expandibility.

> _**Note : the 'App' context is an conceptual separation, not a security partition. Security is provided by your web browser, partitioned per-domain within client storage in the browser/system.**_

### Full Examples of using IndexedDB adapter

```javascript
// Save : will save App/Key/Val as 'finance'/'test'/{serializedDb}
// if appContect ('finance' in this example) is omitted, 'sylvie' will be used
var idbAdapter = new IndexedAdapter("finance");
var db = new Sylvie("test", { adapter: idbAdapter });
var coll = db.addCollection("testColl");
coll.insert({ test: "val" });
db.saveDatabase(); // could pass callback if needed for async complete

// Load database
var idbAdapter = new IndexedAdapter("finance");
var db = new Sylvie("test", { adapter: idbAdapter });
db.loadDatabase({}, function (result) {
  console.log("done");
});

// Get database list
var idbAdapter = new IndexedAdapter("finance");
idbAdapter.getDatabaseList(function (result) {
  // result is array of string names for that appcontext ('finance')
  result.forEach(function (str) {
    console.log(str);
  });
});

// Delete database
var idbAdapter = new IndexedAdapter("finance");
idbAdapter.deleteDatabase("test"); // delete 'finance'/'test' value from catalog

// Delete database partitions and/or pages
// This deletes all partitions or pages derived from this base filename
var idbAdapter = new IndexedAdapter("finance");
idbAdapter.deleteDatabasePartitions("test");

// Summary
var idbAdapter = new IndexedAdapter("finance");
idbAdapter.getCatalogSummary(function (entries) {
  entries.forEach(function (obj) {
    console.log("app : " + obj.app);
    console.log("key : " + obj.key);
    console.log("size : " + obj.size);
  });
});
```
