/**
 * Created by Administrator on 2015-11-14.
 */
var winston = require('winston');


var logger = new winston.Logger({
    transports:[
        new winston.transports.Console({
            level:'info',
            colorize:true
        }),
        new winston.transports.DailyRotateFile({
            level:'debug',
            filename:'./logger/app-debug',
            maxsize:1024,
            datePattern:'yyyy-MM-ddTHH-mm.log',
            timestamp:function(){
                var now = new Date();
                return now.toString();
            }
        })
    ]
});

module.exports = logger;