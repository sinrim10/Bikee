/////////////////////////
// REQUIRE THE PACKAGE //
/////////////////////////

/*var NR = require(__dirname + "/../index.js");*/
var NR = require("node-resque");

// we'll use https://github.com/tejasmanohar/node-schedule for this example, 
// but there are many other excelent node scheduling projects
var schedule = require('node-schedule');
var mongoose = require('mongoose');
mongoose.connect('mongodb://54.64.210.161:3000/bikee')
var Bike = require('./app/models//bikes');
var Reserves = require('./app/models/reserves');
var logger = require('./config/logger');        // Winston Logger
var send = require('./app/controllers/gcm');
var async = require("async");
var time = new Date();
///////////////////////////
// SET UP THE CONNECTION //
///////////////////////////
logger.info(time);
var connectionDetails = {
  package:   'ioredis',
  host:      'bikee.kr.pe',
  password:  null,
  port:      6379,
  database:  0,
  // namespace: 'resque',
  // looping: true,
  // options: {password: 'abc'},
};

//////////////////////////////
// DEFINE YOUR WORKER TASKS //
//////////////////////////////

var jobs = {
  sendMassage: function(results, callback){
    console.log('results :' ,results.result)
    if(results.result.length>0){
      for(var i in results.result){
        schedule.scheduleJob(new Date(results.result[i].rentEnd) ,
            function(){
              console.log('*** THE TIME IS ' + new Date() + ' ***');
              console.log('*** THE RentEnd IS ' + new Date(results.result[i].rentEnd) + ' ***');
              send.sendMessage1(results.result[i].renter, results.result[i].bike.title+"의 예약이 30분 남았습니다.");
            })
      }
    }
    callback(null, true);
  }
};

////////////////////
// START A WORKER //
////////////////////

var worker = new NR.worker({connection: connectionDetails, queues: ['gcm']}, jobs);
worker.connect(function(){
  worker.workerCleanup(); // optional: cleanup any previous improperly shutdown workers on this host
  worker.start();
});

///////////////////////
// START A SCHEDULER //
///////////////////////

var scheduler = new NR.scheduler({connection: connectionDetails});
scheduler.connect(function(){
  scheduler.start();
});

/////////////////////////
// REGESTER FOR EVENTS //
/////////////////////////

worker.on('start',           function(){ console.log("worker started"); });
worker.on('end',             function(){ console.log("worker ended"); });
worker.on('cleaning_worker', function(worker, pid){ console.log("cleaning old worker " + worker); });
worker.on('poll',            function(queue){ console.log("worker polling " + queue); });
worker.on('job',             function(queue, job){ console.log("working job " + queue + " " + JSON.stringify(job)); });
worker.on('reEnqueue',       function(queue, job, plugin){ console.log("reEnqueue job (" + plugin + ") " + queue + " " + JSON.stringify(job)); });
worker.on('success',         function(queue, job, result){ console.log("job success " + queue + " " + JSON.stringify(job) + " >> " + result); });
worker.on('failure',         function(queue, job, failure){ console.log("job failure " + queue + " " + JSON.stringify(job) + " >> " + failure); });
worker.on('error',           function(queue, job, error){ console.log("error " + queue + " " + JSON.stringify(job) + " >> " + error); });
worker.on('pause',           function(){ console.log("worker paused"); });

scheduler.on('start',             function(){ console.log("scheduler started"); });
scheduler.on('end',               function(){ console.log("scheduler ended"); });
scheduler.on('poll',              function(){ console.log("scheduler polling"); });
scheduler.on('master',            function(state){ console.log("scheduler became master"); });
scheduler.on('error',             function(error){ console.log("scheduler error >> " + error); });
scheduler.on('working_timestamp', function(timestamp){ console.log("scheduler working timestamp " + timestamp); });
scheduler.on('transferred_job',   function(timestamp, job){ console.log("scheduler enquing job " + timestamp + " >> " + JSON.stringify(job)); });


/////////////////
// DEFINE JOBS //
/////////////////

var queue = new NR.queue({connection: connectionDetails}, jobs);
var rule = new schedule.RecurrenceRule();
var range = 1;
rule.minute = new schedule.Range(0, 59, range);
queue.on('error', function(error){ console.log(error); });
queue.connect(function(){
  /*'* 0,5,10,15,20,25,30,35,40,45,50,55 * * * *'*/
  schedule.scheduleJob(rule, function() { // do this job every 10 seconds, cron style
    // we want to ensure that only one instance of this job is scheduled in our enviornment at once,
    // no matter how many schedulers we have running

    var time = new Date()
        ,month = time.getMonth()
        ,hour = time.getHours()
        ,min = time.getMinutes()
        ,year = time.getFullYear()
        ,days = time.getDate();

    var start = new Date(year,month,days,hour,min+30);
    var end = new Date(year,month,days,hour,min+range);

    console.log('start ', start);
    console.log('end ', end);
    async.waterfall([
          function (callback) {
            Reserves.aggregate(
                [
                  {
                    "$match": {
                      'reserve.rentEnd': start/*{
                        $gt: start,
                        $lte: end
                      }*/
                    }
                  },
                  {"$unwind": "$reserve"},
                  {
                    "$match": {
                      'reserve.rentEnd': start /*{
                        $gt: start,
                        $lte: end
                      }*/
                    }
                  },
                  {
                    "$group": {
                      "_id": "$_id",
                      "bike": {"$first": "$bike"},
                      "rentEnd": {"$first": "$reserve.rentEnd"},
                      /*"reserveid": {$push:"$reserve._id"},*/
                      "renter": {$push: '$reserve.renter'} /*{ "$first": "$reserve.renter" }*/
                    }
                  }
                ],
                function (err, result) {
                  /*console.log('data ' ,result);*/
                  Bike.populate(result, {"path": "bike", select: 'title'}, function (err, results) {
                    if (err) throw err;
                    console.log(JSON.stringify(results, undefined, 4));
                    callback(null, results);
                  });
                }
            )
          }
        ],
        function (err, results) {
          if (scheduler.master) {
            console.log(">>> enquing a job  " , results);
            queue.enqueue('gcm', "sendMassage", {result: results});
          }
        });
  });
});



//////////////////////
// SHUTDOWN HELPERS //
//////////////////////

var shutdown = function(){
  scheduler.end(function(){
    worker.end(function(){
      console.log('bye.');
      process.exit();
    });
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
