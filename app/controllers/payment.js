/**
 * Created by Administrator on 2016-04-18.
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Payments = mongoose.model('Payments')
var User = mongoose.model('Users')
var Bike = mongoose.model('Bikes');
var request = require('request');
var async = require('async');
var config = require('../../config/config');

exports.insert = function(data,cb){
    Payments.findOneAndUpdate(
        {$and:[{"bike":new ObjectId(data.bike)},{"lister":new ObjectId(data.lister)}]},
        {$push:{"payment":data.payment}},
        {safe: true, upsert: true}).exec(cb);
}

exports.lister = function(req,res,next){
    var lister = req.user.id ? new ObjectId(req.user.id):null;
    Payments.aggregate([
        {
            $match:{
                "lister":lister
            }
        },{
            $unwind:"$payment"
        },{
            $group:{
                _id:{lister:"$lister",bike:"$bike"},
                payment:{$push:"$payment"}
            }
        }],function(err,result){
        if(err){
            next(err);
        }
        if(result.length>0){
            Bike.populate(result,{"path":"_id.bike"},function(err,bikes){
                if(err){
                    next(err);
                }
                User.populate(bikes,{"path":"payment.renter _id.lister",select:"email phone name image facebook"},function(err,users){
                    if(err){
                        next(err);
                    }
                    if(users.length>0){
                        return res.json({code:200 , success:true,result:users,msg:"결제 내역 조회",err:err});
                    }
                })
            })
        }else{
            return res.json({code:200 , success:true,result:result,msg:"결제 내역 조회",err:err})
        }
    });
}

exports.renter = function(req,res,next){

    var renter = req.user.id ? new ObjectId(req.user.id):null;
    Payments.aggregate([
        {
            $unwind:"$payment"
        },{
          $sort:{"payment._id":-1}
        },
        {
            $match:{
                "payment.renter": renter
            }
        },{
            $group:{
                "_id":{lister:"$lister",bike:"$bike"},
                payment:{$push:"$payment"}
            }
        }],function(err,result){
        if(err){
            next(err);
        }

        if(result.length>0){
            Bike.populate(result,{"path":"_id.bike"},function(err,bikes){
                if(err){
                    next(err);
                }
                User.populate(bikes,{"path":"payment.renter _id.lister",select:"email phone name image facebook"},function(err,users){
                    if(err){
                        next(err);
                    }
                    if(users.length>0){
                        return res.json({code:200 , success:true,result:users,msg:"결제 내역 조회",err:err});
                    }
                })
            })
        }else{
            return res.json({code:200 , success:true,result:result,msg:"결제 내역 조회",err:err})
        }
    /*    if(result.length>0){
            User.populate(result,{"path":"payment.renter lister",select:"email phone name image facebook"},function(err,users){
                if(err){
                    next(err);
                }
                if(users.length>0){
                    return res.json({code:200 , success:true,result:users,msg:"결제 내역 조회",err:err});
                }
            })
        }else{
            return res.json({code:200 , success:true,result:result,msg:"결제 내역 조회",err:err})
        }*/
    });
}
/*
*
* 리스터 기준 refund 조회
* */
exports.refund = function(req,res,next){
    var lister = req.user.id;
    Payments.aggregate([
        {
            $match:{
                "lister":new ObjectId(lister)
            }
        },{
            $unwind:"$payment"
        },  {
            $group : {
                _id : { lister:"$lister",refund:"$payment.refund"},
                totalPrice: { $sum: "$payment.iamport.amount" },
                count: { $sum: 1 }
            }
        }],function(err,result){
        if(err){
            next(err);
        }
        return res.json({code:200 , success:true,result: result,err:err,msg:"환급 조회"});
    });
}

exports.refund_state = function(req,res,next){
    var _id = req.body._id ? req.body._id : null;
    var payment_id = req.body.payment_id ? req.body.payment_id : null;
    var state = req.body.state ? req.body.state : null;
    if(typeof state === "string"){
        state = state == "true";
    }
    console.log("state " , state);
    Payments.aggregate([
        {
            $match: {
                "_id":new ObjectId(_id)
            }
        },{
            $unwind:"$payment"
        },{
            $match: {
                "payment._id":new ObjectId(payment_id)
            }
        }

    ],function(err,result){
        Payments.findOneAndUpdate({_id:new ObjectId(result[0]._id),"payment":{$elemMatch:{"_id" : new ObjectId(result[0].payment._id)}}},{$set:{
            "payment.$.refund" : state
        }}).exec(function(err,result){
            if(err){
                next(err);
            }
            res.json({code:200,success:true,result:result,err:null,msg:"환급 수정 성공"});
        })
    })
}

/*
*
* 리스터 기준 결제 내역 조회
* */

/*
* 리스터 기준 환급 금액 미환급 금액 조회 쿼리
*
 Payment.aggregate([
 {
 $match:{
 "lister":new ObjectId("5657e314c2d55cc577621f25")
 }
 },{
 $unwind:"$payment"
 },  {
 $group : {
 _id : { lister:"$lister",refund:"$payment.refund"},
 totalPrice: { $sum: "$payment.iamport.amount" },
 count: { $sum: 1 }
 }
 }],function(err,result){
 console.log('result ' ,result)
 })
* */
