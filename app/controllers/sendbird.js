/**
 * Created by Administrator on 2016-04-14.
 */
var mongoose = require('mongoose');
var SendBird = mongoose.model('SendBird');
var Bike = mongoose.model('Bikes');
var User = mongoose.model('Users');
var ObjectId = mongoose.Types.ObjectId;

exports.create = function(req,res,next){
    var data = req.body;
    var sendbird = new SendBird(data);
    sendbird.save(function(err,result){
        if(err){
            console.log(err);
            next(err);

            /*return res.json({})*/
        }
        return res.json({code:200,success:true,result:[],msg:"채널 생성",err:err});
    })
    /*SendBird.create(sendbird,function(err,result){
        if(err){
            next(err);
        }
        res.json({code:200,success:true,result:[],msg:"채널 생성",err:err});
    })*/
}

exports.channel = function(req,res,next){
    var channel_url = req.params.channel_url;
    SendBird.findOne({channel_url:channel_url}).exec(function(err,result){
        if(err){
            next(err);
        }
        res.json({code:200,success:true,result:[result],msg:"채널 조회",err:err});
    })
}