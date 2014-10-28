var loki = require('../src/lokijs.js'),
Datastore = require('nedb'),
	//db = new loki('perftest'),
  ndb = new Datastore(),
    samplecoll = null,
    arraySize = 10000,			// how large of a dataset to generate
    totalIterations = 200,	// how many times we search it
    results = [],
	getIterations = 2000,	// get is crazy fast due to binary search so this needs separate scale
  gAsyncCount = 0,
  startTime,
  endTime,
  isIndexed = false;;
  
function genRandomVal()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 20; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function insertNext() {
}

// in addition to the loki id we will create a key of our own
// (customId) which is number from 1- totalIterations
// we will later perform find() queries against customId with and 
// without an index

function initializeDB() {
	//db = new loki('perftest');
  
	//var start, end, totalTime;
	//var totalTimes = [];
	//var totalMS = 0.0;

	//samplecoll = db.addCollection('samplecoll', 'samplecoll');
    
  gAsyncCount = 0;
  
  startTime = process.hrtime();

  // nedb uses async callbacks so we will not time each operation but 
  // use globals to count when the last async op has finished
	for (var idx=0; idx < arraySize; idx++) {
   	var v1 = '12345'; //genRandomVal();
    var v2 = '23456'; //genRandomVal();
    
   	ndb.insert({ 
			customId: idx, 
			val: v1, 
			val2: v2, 
			val3: "more data 1234567890"
		}, function (err, newDoc) {   // Callback is optional
      if (++gAsyncCount == arraySize) {
        endTime = process.hrtime(startTime);
        var totalMS = endTime[0] * 1e3 + endTime[1] / 1e6;
        var rate = arraySize * 1000 / totalMS;
        rate = rate.toFixed(2);
        console.log("load (insert) : " + totalMS + "ms (" + rate + ") ops/s");
        
        testperfFind();
      }
    });

		//end = process.hrtime(start);
 		//totalTimes.push(end);
   }
    
	//for(var idx=0; idx < totalTimes.length; idx++) {
	//	totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1]/1e6;
	//}
	
    
	//var totalMS = end[0] * 1e3 + end[1]/1e6;
	//totalMS = totalMS.toFixed(2);
	//var rate = arraySize * 1000 / totalMS;
}

// function testperfGet() {
	// var start, end;
	// var totalTimes = [];
	// var totalMS = 0.0;
	
	// for (var idx=0; idx < getIterations; idx++) {
    	// var customidx = Math.floor(Math.random() * arraySize) + 1;
        
		// start = process.hrtime();
        // var results = samplecoll.get(customidx);
		// end = process.hrtime(start);
		// totalTimes.push(end);
    // }
    
	// for(var idx=0; idx < totalTimes.length; idx++) {
		// totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1]/1e6;
	// }
	
	// totalMS = totalMS.toFixed(2);
	// var rate = getIterations * 1000 / totalMS;
	// rate = rate.toFixed(2);
	// console.log("coll.get() : " + totalMS + "ms (" + rate + ") ops/s");
// }

 function testperfFind(multiplier) {
	// var start, end;
	// var totalTimes = [];
	// var totalMS = 0;

	var loopIterations = totalIterations;
	if (typeof(multiplier) != "undefined") {
		loopIterations = loopIterations * multiplier;
	}
	
  gAsyncCount = 0;
  
  startTime = process.hrtime();
  
	for (var idx=0; idx < loopIterations; idx++) {
    var customidx = Math.floor(Math.random() * arraySize) + 1;
        
		// start = process.hrtime();
        //var results = samplecoll.find({ 'customId': customidx });
    ndb.find({ customId: customidx }, function (err, docs) {
      ++gAsyncCount;
      
      if ((!isIndexed && gAsyncCount == totalIterations) || (isIndexed && gAsyncCount == totalIterations * 200) ) {
        endTime = process.hrtime(startTime);
        var totalMS = endTime[0] * 1e3 + endTime[1] / 1e6;
        var rate = (isIndexed?totalIterations*200:totalIterations) * 1000 / totalMS;
        rate = rate.toFixed(2);
        console.log("find (indexed : " + isIndexed + ") : " + totalMS + "ms (" + rate + ") ops/s");

        if (!isIndexed) {
          isIndexed = true;
          ndb.ensureIndex({ fieldName: 'customId' }, function (err) {
            testperfFind(200);
          });
        }
      }
    });
		// end = process.hrtime(start);
		// totalTimes.push(end);
  }
    
	// for(var idx=0; idx < totalTimes.length; idx++) {
		// totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1]/1e6;
	// }
	
	// totalMS = totalMS.toFixed(2);
	// var rate = loopIterations * 1000 / totalMS;
	// rate = rate.toFixed(2);
	// console.log("coll.find() : " + totalMS + "ms (" + rate + " ops/s) " + loopIterations + " iterations");
}

// function testperfRS(multiplier) {
	// var start, end;
	// var totalTimes = [];
	// var totalMS = 0;

	// var loopIterations = totalIterations;
	// if (typeof(multiplier) != "undefined") {
		// loopIterations = loopIterations * multiplier;
	// }
	
	// for (var idx=0; idx < loopIterations; idx++) {
    	// var customidx = Math.floor(Math.random() * arraySize) + 1;
        
		// start = process.hrtime();
        // var results = samplecoll.chain().find({ 'customId': customidx }).data();
		// end = process.hrtime(start)
		// totalTimes.push(end);
    // }
    
	// for(var idx=0; idx < totalTimes.length; idx++) {
		// totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1]/1e6;
	// }
	
	// totalMS = totalMS.toFixed(2);
	// var rate = loopIterations * 1000 / totalMS;
	// rate = rate.toFixed(2);
	// console.log("resultset chained find() :  " + totalMS + "ms (" + rate + " ops/s) " + loopIterations + " iterations");
// }

// function testperfDV(multiplier) {
	// var start, end;
	// var start2, end2, totalTime2 = 0.0;
	// var totalTimes = [];
	// var totalTimes2 = [];
	// var totalMS = 0;
	// var totalMS2 = 0;
    
	// var loopIterations = totalIterations;
	// if (typeof(multiplier) != "undefined") {
		// loopIterations = loopIterations * multiplier;
	// }
	
	// for (var idx=0; idx < loopIterations; idx++) {
    	// var customidx = Math.floor(Math.random() * arraySize) + 1;
       
		// start = process.hrtime();
		// var dv = samplecoll.addDynamicView("perfview");
        // dv.applyFind({ 'customId': customidx });
        // var results = dv.data();
		// end = process.hrtime(start);
		// totalTimes.push(end);
      
      	//test speed of repeated query on an already set up dynamicview
      	// start2 = process.hrtime();
        // var results = dv.data();
        // end2 = process.hrtime(start2);
		// totalTimes2.push(end2);
        
        // samplecoll.removeDynamicView("perfview");
    // }
    
	// for(var idx=0; idx < totalTimes.length; idx++) {
		// totalMS += totalTimes[idx][0] * 1e3 + totalTimes[idx][1]/1e6;
		// totalMS2 += totalTimes2[idx][0] * 1e3 + totalTimes2[idx][1]/1e6;
	// }
	
	// totalMS = totalMS.toFixed(2);
	// totalMS2 = totalMS2.toFixed(2);
	// var rate = loopIterations * 1000 / totalMS;
	// var rate2 = loopIterations * 1000 / totalMS2;
	// rate = rate.toFixed(2);
	// rate2 = rate2.toFixed(2);
	
	// console.log("loki dynamic view first find : " + totalMS + "ms (" + rate + " ops/s) " + loopIterations + " iterations");
	// console.log("loki dynamic view subsequent finds : " + totalMS2 + "ms (" + rate2 + " ops/s) " + loopIterations + " iterations");
// }

initializeDB();

// console.log("-- Benchmarking query on non-indexed column --");
// testperfGet();	// get bechmark on id field
//testperfFind();	// find benchmark on unindexed customid field
// testperfRS();	// resultset find benchmark on unindexed customid field
// testperfDV();	// dataview find benchmarks on unindexed customid field

// console.log("-- Adding binary index to query column and repeating benchmarks --");
// samplecoll.ensureBinaryIndex("customId");
// testperfFind(20);
// testperfRS(15);
// testperfDV(15);