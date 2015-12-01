var mongoose = require('mongoose');
var SmsSchema = mongoose.model('Sms');
var sms = require('../../config/sms');
/*var random = require("node-random");*/


exports.authsms = function(req,res){
    var mobile = req.body.mobile ? req.body.mobile : undefined;
    var result = Math.floor(Math.random() * 1000000)+100000;
    var option = {};
    if(result>1000000){
        result = result - 100000;
    }
    option.msg = "발신번호 인증 코드 ["+result+"]를 입력해 주십시요"
    option.mobile = mobile;

    SmsSchema.create({mobile:mobile,auth_number:result},function(err,data){
        console.log('data ' ,data);
        if(err){
            return res.json({code:500,success:true,result:[],msg:"인증 번호 생성 오류",err:err});
        }
        console.log("option " , option);
        /*return res.json({code: 200, success: true, result: [{id: data._id}], msg: "인증 번호 생성", err: err});*/
        sms.send(option).then(function (result) {
            console.log(result);
            return res.json({code: 200, success: true, result: [{id: data._id}], msg: "인증 번호 생성", err: err});
        });
    })
};

exports.authcheck = function(req,res){
    var authid = req.params.authid ? req.params.authid : undefined;
    var auth_number = req.body.auth_number ? req.body.auth_number : undefined;
    SmsSchema.findById(authid,function(err,result){
        if(err){
            return res.json({code:403,success:false,result:[],msg:"인증 오류",err:err});
        }

        if(!result){
            return res.json({code:403,success:false,result:[],msg:"인증 오류",err:err});
        }
        console.log('result ' , result);
        if(result.auth_number == auth_number){
            result.update({$set:{accepted : true}},function(err,result){
                if(err){
                    return res.json({code:403,success:false,result:[],msg:"인증 오류",err:err});
                }
                SmsSchema.findById(authid,function(err,result){
                    if(err){
                        return res.json({code:403,success:false,result:[],msg:"인증 오류",err:err});
                    }
                    return res.json({code:200,success:true,result:[{accepted:result.accepted}],msg:"인증 성공",err:err});
                })
            })
        }else{
            return res.json({code:403,success:false,result:[],msg:"인증 오류",err:err});
        }
    })
}
