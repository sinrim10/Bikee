/**
 * Created by Administrator on 2015-10-27.
 */

var mongoose = require('mongoose');
var Reserves = mongoose.model('Reserves');
var Bike = mongoose.model('Bikes');
var User = mongoose.model('Users');
var gcm = require('../controllers/gcm');
var ObjectId = mongoose.Types.ObjectId;
/**
 *
 * 자전거 예약 요청
 *
 * */
exports.create = function(req,res,next){
    var reserve = {};
    var bikeId = req.params.bikeId ? req.params.bikeId : undefined;
    var rentStart = req.body.rentStart ? req.body.rentStart : undefined;
    var rentEnd = req.body.rentEnd ? req.body.rentEnd : undefined;
    var lister = "";
    var title = "";
    var bikeid = "";
   /* if(typeof data == "string"){
        data = JSON.parse(data);
    }*/
    if(rentStart && rentEnd){
        reserve.rentStart = new Date(rentStart);
        reserve.rentEnd = new Date(rentEnd);
        reserve.renter = req.user.id;
        Bike.findById(new ObjectId(bikeId)).exec(function(err,result){
            if(err){
                console.log('err ',err);
                next()
            }
            if(result){
                lister = result.user;
                title = result.title;
                bikeid = result._id;
                Reserves.findOneAndUpdate(
                    {$and:[{"bike":new ObjectId(bikeid)},{"lister":new ObjectId(lister)}]},
                    {$push:{"reserve":reserve}},
                    {safe: true, upsert: true}).exec(function(err,result){
                        if(err){
                            return res.json({code:500,success:false,result:[],msg:"예약 요청 실패",err:err});
                        }

                        gcm.sendMessage(lister,title+"자전거가 예약 되었습니다.");
                        res.json({code:200,success:true,result:[],msg:"자전거 예약 성공",err:err});
                    })
            }
        })
    }
}
/**회
 *
 * 자전거 예약 목록 조회
 * 리스터가 예약목록조
 * */
exports.show = function(req,res){
    var userid = req.user.id;
    Reserves.find({lister:userid})
        .sort("-reserve.updatedAt")
        .populate("bike")
        .populate("lister","name email phone image")
        .populate("reserve.renter","name email phone image ")
        .exec(function(err,result){
            if(err) {
                console.error(err);
                res.json({code:500 , success:false,result:[],msg:"예약목록 조회 실패 했습니다.",err:err});
            }
            res.json({code:200 , success:true,result : result,err:err});
        })
}

exports.index = function(req,res,next){
    var bikeId = req.params.bikeId ? req.params.bikeId : undefined;
    Reserves.aggregate([ {
        $match:{
            $and:[
                {"reserve.rentEnd":{$gte : new Date()}},
                {"bike":new ObjectId(bikeId)}
            ]
        }
    },{
        $unwind:"$reserve"
    },{
        $match:{
            $and:[
                {"reserve.rentEnd":{$gte : new Date()}},
                {"bike":new ObjectId(bikeId)}
            ]
        }
    },{
        $sort:{"reserve.updatedAt":-1}
    }],function(err,result){
        Bike.populate( result, { "path": "bike" }, function(err,results) {
            if (err){
                next(err);
            }
            User.populate(results,{"path":"reserve.renter lister",select:"email phone name image facebook"},function(err,users){
                if(err) {
                    console.error(err);
                    return res.json({code:500 , success:false,result:null,msg:"예약목록 조회 실패 했습니다.",err:err});
                }
                res.json({code:200 , success:true,result : users,err:err,msg:"예약목록 조회 성공"});
            })
        })
    })
}
/**
 *
 * 자전거 예약 목록 조회
 * 렌터가 예약조회할경우.
 * */
exports.showrent = function(req,res,next){
    var userid = req.user.id;

    Reserves.aggregate([ {
        $match:{"reserve.renter":new ObjectId(userid)}
    },{
        $sort:{"reserve.updatedAt":-1}
    },{
        $unwind:"$reserve"
    },{
        $match:{"reserve.renter":new ObjectId(userid)}

    }],function(err,result){
        if(err){
            next(err);
        }
        Bike.populate( result, { "path": "bike" }, function(err,results) {
            if (err) throw err;
            User.populate(results,{"path":"reserve.renter lister",select:"email phone name image facebook"},function(err,users){
                res.json({code:200 , success:true,result:users,msg:"예약목록조회 완료",err:err});
            })
        })
    })
}

exports.channel = function(req,res,next){
    var lister = req.body.lister;
    var renter = req.body.renter;
    var bike = req.body.bike;
    Reserves.aggregate([{
        $match:{
            $and:[{bike:new ObjectId(bike)},{"lister":new ObjectId(lister)}]
        }
    },{
        $unwind:"$reserve"
    },{
        $match:{
            "reserve.renter":new ObjectId(renter)
        }
    },{
        $sort:{"reserve.updatedAt":-1}
    }
    ]).exec(function(err,result){
        if(result.length>0){
            Bike.populate(result[0],{path:"bike"},function(err,bikes){
                if(err){
                    console.error(err);
                    res.json({code:500 , success:false,result:[],msg:"예약 조회 실패.",err:err});
                }
                res.json({code:200,success:true,result:[bikes],msg:"예약 조회 성공",err:err});
            });
        }else{
            res.json({code:200,success:true,result:result,msg:"예약 조회 성공",err:err});
        }

    });


}

/**
 *
 * 자전거 예약상태 변경
 *
 * */
exports.status = function(req,res,next){

    var status = req.body.status ; //code  RS : 자전거 예약 승인 , RC : 자전거 예약 취소, RR : 예약 대기 , PS : 결제 완료
    var reserveId = req.params.reserveId ? req.params.reserveId : undefined;
    var bikeId = req.params.bikeId ? req.params.bikeId : undefined;
    var renter = {};
    if(status){
        Reserves.findOneAndUpdate(
            {$and:[{bike:new ObjectId(bikeId)},{"reserve._id":new ObjectId(reserveId)}]},
            {$set:{"reserve.$.status":status,"reserve.$.update":new Date()}})
            .populate("bike")
            .populate("lister")
            .populate("reserve.renter")
            .exec(function(err,result){
                if(err) {
                    console.error(err);
                    res.json({code:500 , success:false,result:[],msg:"자전거 예약 변경 실패.",err:err});
                }
                if(result){
                    result.reserve.forEach(function (reserve) {
                        if(reserve._id == reserveId){
                            renter = reserve.renter;
                        }
                    })

                    if(status == "RS"){
                        gcm.sendMessage(renter._id,"자전거 예약승인 되었습니다.");
                        res.json({code:200,success:true,result:[],msg:"자전거 [" + result.bike.title +"] 예약승인 되었습니다.",err:err});
                    }else if(status == "RC"){
                        gcm.sendMessage(renter._id,"자전거 예약취소 되었습니다.");
                        res.json({code:200,success:true,result:[],msg:"자전거 [" + result.bike.title +"] 예약취소 되었습니다.",err:err});
                    }else if(status =="PS"){
                        gcm.sendMessage(result.lister,"자전거 [" + result.bike.title +"] 결제 되었습니다.");
                        res.json({code:200,success:true,result:[],msg:"자전거 결제 되었습니다.",err:err});
                    }else if(status =="PC"){
                        gcm.sendMessage(result.lister,"자전거 [" + result.bike.title +"] 결제 취소 되었습니다.");
                        res.json({code:200,success:true,result:[],msg:"자전거 결제 취소 되었습니다.",err:err});
                    }else {
                        res.json({code:200,success:true,result:[],msg:"변경 가능한 예약상태 코드가 없습니다..",err:err});
                    }
                } else {
                    res.json({code:200,success:true,result:[],msg:"예약 정보가 없습니다.",err:err});
                }


            })
    }
}