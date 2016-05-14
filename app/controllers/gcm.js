/**
 * Created by Administrator on 2015-11-09.
 */
var mongoose = require('mongoose');
var Gcm = require('../models/gcm');
var Reserve = require('../models/reserves');
var User = require('../models/users');
var Bike = require('../models/bikes');

var nodeGcm = require('node-gcm');
var async = require('async');
var config = require("../../config/config")
var sender = new nodeGcm.Sender(config.gcm.sender);
var ObjectId = mongoose.Types.ObjectId;

exports.registerDevice = function(req,res,next){
    var deviceID = req.body.deviceID ? req.body.deviceID : "";
    var os = req.body.os ? req.body.os : "";
    var token = req.body.token ? req.body.token : undefined;
    var device = {
            deviceID : deviceID,
            os : os,
            token :token
        }

    Gcm.findOne({"$and":[{"user":new ObjectId(req.user.id)},{"devices.deviceID":deviceID}]},function(err,devices){
        if(devices){
            Gcm.findOneAndUpdate(
                {"$and":[{"user":new ObjectId(req.user.id)},{"devices.deviceID":deviceID}]},
                {'$set':{'devices.$.token':token,'devices.$.updatedAt': new Date()}},
                {  safe: true, upsert: true},
                function(err, model) {
                    if(err){
                        console.error(err);
                        return res.json({code:500 , success:false,result:[],msg:"토큰 등록 실패",err:err});
                    }
                    return res.json({code:200,success:true,result:[],msg:"토큰 수정 성공",err:err});
                });
        }else{
            Gcm.findOneAndUpdate(
                {"$and":[{"user":new ObjectId(req.user.id)}]},
                { $push: {"devices": device}},
                {  safe: true, upsert: true},
                function(err, model) {
                    if(err){
                        console.error(err);
                        return res.json({code:500 , success:false,result:[],msg:"토큰 등록 실패",err:err});
                    }
                    return res.json({code:200,success:true,result:[],msg:"토큰 등록 성공",err:err});
                });
        }
    })
}
exports.editStatus = function(req,res,next){
    var userId = req.user.id ? req.user.id : undefined;
    var deviceId = req.params.deviceId ? req.params.deviceId : undefined;

    Gcm.findOne({'user':new ObjectId(userId) ,'devices.deviceID': deviceId },{'devices.$':1, 'user':1},function(err,devices){
        if(err){
            console.error(err);
            return res.json({code:500,success:false,msg:"푸쉬 알람 수정 실패 했습니다.",err:err});
        }
        if(!devices){
            return res.json({code:500,success:false,msg:"기기 정보가 없습니다..",err:err});
        }
        if(devices.devices){
            devices.devices.forEach(function(device){
                var status = !device.status;
                Gcm.findOneAndUpdate({'user':new ObjectId(devices.user),'devices.deviceID':device.deviceID},{'$set':{'devices.$.status': status}},{safe : true , upsert : true},function(err,data){
                    if(err){
                        console.error(err);
                        return res.json({code:500,success:false,msg:"푸쉬 알람 수정 실패 했습니다.",err:err});
                    }
                    res.json({code:200,success:true,msg:"푸쉬 알람 수정 성공 했습니다.",err:err})
                });
            })
        }
    })

}

/**
 * sendMassage - mobile push message send function
 *
 * @param {String} userID , {String} msg
 * @return {success:true,err : null}
 * @api public
 */
exports.sendMessage = function(userID,msg){

    var message = new nodeGcm.Message({
        collapseKey: 'demo',/*
        notification:{
            title:'BIKEE',
            body:msg,
            icon:'ic_launcher'
        },*/data:{
            title:"BIKEE",
            body:msg,
            icon:'ic_launcher'
        }
    });
    var regIDList = []

    Gcm.findOne({user: new ObjectId(userID)})
        .select("devices.token devices.deviceID devices.status")
        .exec(function(err,devices){
            if(err) {
                console.error(err);
            }
            if(!devices){
                console.error("기기정보가 없습니다.")
                return false;
            }
            if(devices.devices){
                devices.devices.forEach(function(device){
                    if(device.status){
                        regIDList.push(device.token);
                    }
                })

                sender.send(message, regIDList, function(err, result) {
                    if (err) {
                        console.error('Error : ' + err);
                        return {success:false,err : err}
                    }
                    else {

                        var results = result.results;
                        for(var i = 0 ; i < results.length ; i++) {
                            var item = results[i];
                            var regID = regIDList[i];
                            var sendError = item.error;
                            if ( sendError ) {
                                console.error(sendError, regID);
                            }
                            else {
                                console.log('Success : ', regID);
                            }
                        }
                    }
                });
            } else {
                console.error(userID , '사용자의 등록된 기기 정보가 없습니다.');
            }
        })

    // GCM 메세지 발송 요청console.log(JSON.stringify(bikes, undefined, 4));

}
exports.rentEndGcmSend = function(token,msg,cb){
    var message = new nodeGcm.Message({
        collapseKey: 'rentEnd',
        data:{
            title:"BIKEE",
            body:msg,
            icon:'ic_launcher'
        }
    });
    sender.send(message, token, function(err, result) {
        if (err) {
            cb(err,result);
        }
        else {
            cb(null,result);
        }
    });
}
exports.rentEndGcm = function(cb){
    var time = new Date()
        ,month = time.getMonth()
        ,hour = time.getHours()
        ,min = time.getMinutes()
        ,year = time.getFullYear()
        ,days = time.getDate();
    var today = new Date(year,month,days,hour,min);
    var start = new Date(year,month,days,hour,min+29);
    var end = new Date(year,month,days,hour,min+31);
    console.log('today' , today);
    console.log('start ', start);
    console.log('end ', end);
    var gcm = [];
    Reserve.aggregate(
        [
            {
                "$match": {
                    'reserve.rentEnd': {
                        $gt: today
                    }
                }
            },
            {"$unwind": "$reserve"},
            {
                "$match": {
                    $and:[
                        {'reserve.rentEnd':{
                            $gt: start
                        }},
                        {'reserve.rentEnd':{
                            $lt: end
                        }}
                    ]
                }
            },
            {
                "$group": {
                    _id: {"id": "$_id", renter: "$reserve.renter"},
                    gcm: {$push: {bike: "$bike", rentEnd: "$reserve.rentEnd"}}
                }
            }],function(err,result){
            async.forEach(result, function (renter, callback){
                Gcm.aggregate([
                    {
                        $match:{
                            user:new ObjectId(renter._id.renter)
                        }
                    },{
                        $group :{
                            _id:{user: "$user"},
                            token:{$addToSet:"$devices.token"}
                        }
                    }
                ],function(err,result){
                    renter._id.token = result[0].token;
                    gcm.push(renter);
                    callback(); // tell async that the iterator has completed
                })
            }, function(err) {
                User.populate(gcm,{"path":"_id.renter", select: "name"},function(err,users){
                    Bike.populate(users, {"path": "gcm.bike", select: 'title'}, function (err, bikes) {
                        console.log('gcm result ' , JSON.stringify(bikes,undefined,4));
                        cb(err,bikes);
                    })
                });
            });
        });
}


exports.sendMessage1 = function(renter,msg) {

    var message = new nodeGcm.Message({
        collapseKey: 'demo',
        notification: {
            title: 'BIKEE',
            body: msg,
            icon: 'ic_launcher'
        }, data: {}
    });
    var regIDList = []
    var renters = [];
    for (var i in renter) {
        renters.push(mongoose.Types.ObjectId(renter[i]))
    }
    Gcm.aggregate([
            {
                $match: {
                    $and: [
                        {"devices.status": true},
                        {user: {$in: renters}}
                    ]
                }
            },
            {"$unwind": "$devices"},
            {
                $match: {
                    $and: [
                        {"devices.status": true},
                        {user: {$in: renters}}
                    ]
                }
            },
            {
                "$group": {
                    "_id": "$_id",
                    "token": {$push: '$devices.token'}
                }
            }
        ],
        function (err, result) {


            if (result.length > 0) {
                for (var i in result) {
                    if (result[i].token.length > 0) {
                        for (var t in result[i].token) {
                            regIDList.push(result[i].token[t])
                        }
                    }
                }
            }

            sender.send(message, regIDList, function (err, result) {
                if (err) {
                    console.error('Error : ' + err);
                    return {success: false, err: err}
                }
                else {

                    var results = result.results;
                    for (var i = 0; i < results.length; i++) {
                        var item = results[i];
                        var regID = regIDList[i];
                        var sendError = item.error;
                        if (sendError) {
                            console.error(sendError, regID);
                        }
                        else {
                            console.log('Success : ', regID);
                        }
                    }
                }
            });
        }
    )
}

   /* Gcm.findOne({user: userID})
        .select("devices.token devices.deviceID devices.status")
        .exec(function(err,devices){
            if(err) {
                console.error(err);
            }
            if(!devices){
                console.error("기기정보가 없습니다.")
                return false;
            }
            if(devices.devices){
                devices.devices.forEach(function(device){
                    if(device.status){
                        regIDList.push(device.token);
                    }
                })
                console.log('regIDList',regIDList)
                sender.send(message, regIDList, function(err, result) {
                    if (err) {
                        console.error('Error : ' + err);
                        return {success:false,err : err}
                    }
                    else {
                        console.log("send result : " ,result);
                        var results = result.results;
                        for(var i = 0 ; i < results.length ; i++) {
                            var item = results[i];
                            var regID = regIDList[i];
                            var sendError = item.error;
                            if ( sendError ) {
                                console.error(sendError, regID);
                            }
                            else {
                                console.log('Success : ', regID);
                            }
                        }
                    }
                });
            } else {
                console.error(userID , '사용자의 등록된 기기 정보가 없습니다.');
            }
        })*/

    // GCM 메세지 발송 요청
