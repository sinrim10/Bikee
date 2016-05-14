/**
 * Created by Administrator on 2015-10-27.
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Credit = mongoose.model('Credits');
var Payments = mongoose.model('Payments');
var payment = require('./payment');
var request = require('request');
var async = require('async');
var config = require('../../config/config');
exports.insert = function(req,res,next){
    async.waterfall([
        function(callback){
            getToken(
                function(body){
                    if(body.code == '0'){
                        callback(null,body.response);
                    }else{
                        return res.status(401).json({msg:body.message});
                    }
                }
            );
        },
        function(response,callback){
            var customer_uid = req.user.id + new Date().getTime();
            var card_number = req.body.card_number;
            var expiry = req.body.expiry;
            var birth = req.body.birth;
            var pwd_2digit = req.body.pwd_2digit;
            var json = {
                customer_uid :customer_uid,
                card_number : card_number,
                expiry : expiry,
                birth : birth,
                pwd_2digit : pwd_2digit
            }
            var url = "https://api.iamport.kr/subscribe/customers/"+customer_uid
            request({
                url: url, //URL to hit
                method: 'POST',
                qs:{"_token":response.access_token},
                json: json
            }, function(error, response, body){
                if(body.code == 0 ){
                    callback(null,body);
                } else {
                    return res.json({code:401,success:false,msg:body.message});
                }
            });
        }],function(err,result){
        var credit = new Credit({
            card_name : result.response.card_name,
            card_nick : req.body.card_nick ? req.body.card_nick : "",
            user : req.user.id
        });
        credit.password = result.response.customer_uid;
        credit.save(function(err,result){
            if(err){
                console.log(err);
                return res.json(err);
            }
            return res.json({code:200,success:true,result:[{_id:result._id,card_name:result.card_name,card_nick:result.card_nick}],err:null,msg:"빌 키 등록"});
        });

    })
}

exports.payment = function(req,res){
    var credit_id = req.params.creditid
    var merchant_uid = req.body.merchant_uid;
    var name = req.body.name ? req.body.name : "";
    var lister = req.body.lister ? req.body.lister :"";
    var bike = req.body.bike ? req.body.bike :"";
    var buyer_name = req.body.buyer_name ? req.body.buyer_name : "";
    var buyer_email = req.body.buyer_email ? req.body.buyer_email : "";
    var amount = req.body.amount;
    async.waterfall([
        function(callback){
            getToken(
                function(body){
                    if(body.code == '0'){
                        body.response.merchant_uid = merchant_uid;
                        body.response.amount = amount;
                        callback(null,body.response);
                    }else{
                        return res.json({msg:body.message});
                    }
                }
            );
        },function(response,  callback){

            var access_token = response.access_token
            var url = "https://api.iamport.kr/payments/prepare/"
            url += response.merchant_uid;
            request({
                url: url, //URL to hit
                method: 'GET',
                qs:{"_token": access_token}
                //Lets post the following key/values as form
            }, function(error, response, body){
                if(typeof body === 'string'){
                    body = JSON.parse(body);
                }
                if(body.code == 0 ){
                    var res_amount = typeof response.amount === "string" ? parseInt(response.amount) : response.amount;
                    console.log('amount ' , amount);
                    console.log('res_amount ' , res_amount);
                    if(amount == res_amount){
                        console.log('amount 같습니다');
                    }
                    body.access_token = access_token;
                    callback(null,body);
                } else {
                    //console.log(response.statusCode, body);
                    return res.status(response.statusCode).json({msg:body.message});
                }
            })
        }
    ], function (err, body) {
        Credit.decryptMerchant({_id:new ObjectId(credit_id)},function(err,r){
            var access_token = body.access_token;
            var json = {
                "merchant_uid": body.response.merchant_uid.trim(),
                "amount": parseInt(body.response.amount), //금액
                "customer_uid":r.trim(),
                "name" : name, //자전거 이름
                "buyer_name": buyer_name,  //구매자 이름
                "buyer_email": buyer_email //구매자 이메일
            }

            var url ='https://api.iamport.kr/subscribe/payments/again'
            request({
                url: url, //URL to hit
                method: 'POST',
                qs:{"_token": access_token},
                //Lets post the following key/values as form
                json: json
            }, function(error, response, body){

                if(body.code == 0 ){
                    /*console.log('result: ' , body);*/
                    var data = {
                        bike: bike,
                        lister: lister,
                        payment:{
                            renter:req.user.id,
                            iamport:body.response
                        }
                    }
                    payment.insert(data,function(err,result){
                        if(err){
                            next(err);
                        }else{
                            return res.json({code:200,success:true,result:[data],iamport:body.response,err:null,msg:"결재 완료"});
                        }
                    })
                } else {
                    return res.status(response.statusCode).json({msg:body.message});
                }
            })
        })
    });
};
exports.delete = function(req,res,next){
    var _id = req.params.creditid
    getToken(function(body){
        Credit.decryptMerchant({_id:new ObjectId(_id)},function(err,r){
            if(err){
                next(err);
            }
            var url ='https://api.iamport.kr/subscribe/customers/'+ r;
            var access_token = body.response.access_token
            request({
                url: url, //URL to hit
                method: 'DELETE',
                qs:{"_token": access_token}
            }, function(error, response, body){
                if(body.code == 0 ){
                    Credit.remove({_id:new ObjectId(_id)})
                        .exec(function(err){
                            if(err){
                                next(err);
                            }
                            return res.json({code:200,success:true,result:null,err:null,msg:"삭제 완료"});
                        })
                } else {
                    return res.json({code:500,success:false,result:null,err:null,msg:body.message});
                }
            })
        })
    })
}

exports.cancel = function(req,res,next){
    getToken(function(body){
        console.log('body ' ,body)
        var url ='https://api.iamport.kr/payments/cancel';
        var imp_uid = req.body.imp_uid ? req.body.imp_uid : null;
        var merchant_uid = req.body.merchant_uid ? req.body.merchant_uid : null;
        var reason = req.body.reason ? req.body.reason : "";
        var access_token = body.response.access_token
        var json = {
            imp_uid : imp_uid,
            merchant_uid :merchant_uid,
            reason :reason
        }
        request({
            url: url, //URL to hit
            method: 'POST',
            qs:{"_token": access_token},
            json: json
        }, function(error, response, body){
            if(body.code == 0 ){
                var iamport = typeof body.response === "string" ? JSON.parse(body.response) : body.response;
                console.log('iamport :' , body);
                Payments.aggregate([
                    {
                        $match: {
                            "payment.renter":new ObjectId(req.user.id)
                            /*$and:[

                                {"payment.iamport.imp_uid":imp_uid},
                                {"payment.iamport.merchant_uid":merchant_uid}
                            ]*/
                        }
                    },{
                        $unwind:"$payment"
                    },{
                        $match: {
                            $and:[
                                {"payment.iamport.imp_uid":imp_uid},
                                {"payment.iamport.merchant_uid":merchant_uid}
                            ]
                        }
                    }

                ],function(err,result){
                    Payments.findOneAndUpdate({_id:new ObjectId(result[0]._id),"payment":{$elemMatch:{"_id" : new ObjectId(result[0].payment._id)}}},{$set:{
                        "payment.$.iamport" : iamport
                    }}).exec(function(err,result){
                        if(err){
                            next(err);
                        }
                        res.json({code:200,success:true,result:result,err:null,msg:"결제 취소 성공"});
                    })
                })
            } else {
                return res.json({code:500,success:false,result:null,err:null,msg:body.message});
            }
        })
    })
}

exports.index = function(req,res,next){
    var user = req.user.id;
    Credit.find({user : new ObjectId(user)}).select("card_name card_nick")
        .exec(function(err,result){
            if(err){
                console.log(err);
                next(err);
            }
            res.json({code:200,success:true,result:result,err:null,msg:"카드 조회 성공"});
        })
}

exports.token = function(req,res,next){
    getToken(function(body){
        if(body.code == 0){
            res.json({code:200,success:true,token:body.response.access_token,err:null,msg:"토큰 발급"});
        }else{
            res.json({code:500,success:false,token:null,err:null,msg:body.message});
        }
    });
}
function getToken(cb){
    request({
        url:"https://api.iamport.kr/users/getToken",
        method: 'POST',
        json: {
            imp_key : config.iamport.imp_key ,
            imp_secret : config.iamport.imp_secret
        }
    },function(err,res,body){

        cb(body);
    })
}