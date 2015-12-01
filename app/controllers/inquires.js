/**
 * Created by Administrator on 2015-10-27.
 */

var mongoose = require('mongoose');

var Inquires = mongoose.model('Inquires');
var User = mongoose.model('Users');


/**
 *
 * 고객센터 문의 입력
 *
 * */
exports.create = function(req, res){


    var data = req.body ? req.body : undefined;
    if(typeof data == "string"){
        data = JSON.parse(data);
    }

    var userId = req.user.id;
    User.findById(userId)
        .select("email name phone facebook").exec(function(err,user){
            if(err){
                console.error(err)
                return res.json({code:500 ,success:false, msg:"회원 정보가 없습니다.",err:err});
            }
            data.writer = user;
            Inquires.create(data ,function(err,result){
                if(err) {
                    console.error(err);
                    res.json({code:500 , success:false,msg:"고객 문의 실패 했습니다.",err:err});
                }
                res.json({code:200 , success:true,msg :"고객 문의 등록 되었습니다.",err:err});
            })
        })
    }

