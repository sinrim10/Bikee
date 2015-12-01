/**
 * Created by Administrator on 2015-11-09.
 */
var mongoose = require('mongoose');
/*var Gcm = mongoose.model('Gcms');*/
var Gcm = require('../models/gcm');
var nodeGcm = require('node-gcm');
var sender = new nodeGcm.Sender('AIzaSyCjS6GYoUP0OPIBcoSljKWZvpJM8kkCx_4');


exports.registerDevice = function(req,res,next){
    var deviceID = req.body.deviceID ? req.body.deviceID : "";
    var os = req.body.os ? req.body.os : "";
    var token = req.body.token ? req.body.token : undefined;
    var userID = req.user._id ? req.user._id : undefined;
    /*var userID = "563996f1e0ae79af0c093b8c"*/


    Gcm.findOne({'user': userID},function(err,user){
        if(!user){
            console.log("유저정보 없음 새로만들자");
            var device = {
                user: userID,
                devices:{
                    deviceID:deviceID,
                    token: token,
                    os: os
                }
            }
            Gcm.create(device,function(err,data){
                console.log('처음 생성 ' , data);
                res.json({code:200,success:true,msg:"기기가 등록되었습니다",err:err});
            })
        }else{
            Gcm.findOneAndUpdate({'user': userID,'devices.deviceID': deviceID},
                {'$set':{'devices.$.token':token,'devices.$.updatedAt': new Date()}},
                {safe : true , upsert : false},
                function(err,devices){
                    if(err){
                        console.error(err);
                        return res.json({code:500,success:false,msg:"기기등록에 실패 했습니다.",err:err});
                    }
                    console.log('devices ', devices);
                    if(!devices){
                        user.update({$push:{devices:{deviceID:deviceID, token:token}}},{ safe: true, upsert: true},function(err,device){
                            if(err){
                                console.error(err);
                                return res.json({code:500,success:false,msg:"기기등록에 실패 했습니다.",err:err});
                            }
                            console.log("device 추가",device);
                        });
                    }
                    res.json({code:200,success:true,msg:"기기가 등록되었습니다",err:err});
                });
            }
        })

}
exports.editStatus = function(req,res,next){
    var userId = req.user.id ? req.user.id : undefined;
    var deviceId = req.params.deviceId ? req.params.deviceId : undefined;


    Gcm.findOne({'user':userId ,'devices.deviceID': deviceId },{'devices.$':1, 'user':1},function(err,devices){
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
                Gcm.findOneAndUpdate({'user':devices.user,'devices.deviceID':device.deviceID},{'$set':{'devices.$.status': status}},{safe : true , upsert : true},function(err,data){
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
    Gcm.findOne({user: userID})
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
        })

    // GCM 메세지 발송 요청

}



exports.sendMessage1 = function(renter,msg) {
    console.log('renter' , renter);
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
            console.log('data ', result);

            if (result.length > 0) {
                for (var i in result) {
                    if (result[i].token.length > 0) {
                        for (var t in result[i].token) {
                            regIDList.push(result[i].token[t])
                        }
                    }
                }
            }
            console.log(regIDList);
            sender.send(message, regIDList, function (err, result) {
                if (err) {
                    console.error('Error : ' + err);
                    return {success: false, err: err}
                }
                else {
                    console.log("send result : ", result);
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
