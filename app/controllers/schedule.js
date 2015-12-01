
var schedule = require('node-schedule');        // Node 스케줄러
var time = require('time');                     // Time
var logger = require('../../config/logger');        // Winston Logger

var timezone = time.currentTimeZone;        // Asia/Seoul

logger.info(timezone);
/*

// Node-scheduler WIKI - https://github.com/tejasmanohar/node-schedule/wiki/

// [1] 특정 시간에 한번만 수행
// 2015년 7월 28일 3시 27분에 스케줄링 작업을 수행하도록 함.
var scheduleTime1 = new time.Date(2015, 7, 28, 16, 03, 0, 0, timezone);
var scheduleJob1 = schedule.scheduleJob(scheduleTime1, function(){
    logger.info('[1] 기본 스케줄링 예약작업 => JOB1 message!!!');
    scheduleJob1.cancel();
});*/

// 스케줄링 작업을 취소하고자 할 경우는 아래와 같이 시행
//scheduleJob1.cancel();


// [2] 매시간마다 한번씩 수행
// 매시간 49분마다 한번씩 수행
var rule1 = new schedule.RecurrenceRule();
rule1.minute = 00;
var scheduledJob2 = schedule.scheduleJob(rule1,
    function(){
        logger.info('매시간 0분마다 수행!!');
        console.log('실행!!!');
    }
);




// [3] Recurrence Rule Scheduling
// 수요일부터 토요일까지 오전 10시 정각에 실행될 스케줄링 등록
// 0 - Sunday
// 1 - Monday
// 2 - Tuesday
// 3 - Wedsnesday
// 4 - Thursday
// 5 - Friday
// 6 - Saturday
/*var rule2 = new schedule.RecurrenceRule();
rule2.dayOfWeek = [0,new schedule.Range(2,6)];
rule2.hour = 16;
rule2.minute = 5;
var scheduledJob3 = schedule.scheduleJob(rule2,
    function(){
        logger.info('[3] Recurrence Rule Scheduling : 매주화-토요일 오후 4:05분에 수행');
    }
);*/

// [4] Cron style - Recurrence Rule Scheduling
// cron 스타일로 월요일부터 금요일까지 오전 11시에 시행될 스케줄링 등록
// *    *    *    *    *    *
//┬    ┬    ┬    ┬    ┬    ┬
//│    │    │    │    │    |
//│    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
//│    │    │    │    └───── month (1 - 12)
//│    │    │    └────────── day of month (1 - 31)
//│    │    └─────────────── hour (0 - 23)
//│    └──────────────────── minute (0 - 59)
//└───────────────────────── second (0 - 59, OPTIONAL)
/*
var cronStyle = '00 00 * * * 0-7';
var scheduledJob4 = schedule.scheduleJob(cronStyle,
    function(){
        logger.info('[4] Cron style 스케줄링 실행(월-금, 16시 06분)!!!!!');
    }
);*/
