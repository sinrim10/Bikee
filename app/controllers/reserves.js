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
exports.create = function(req,res){
    var data = {};
    var bikeId = req.params.bikeId ? req.params.bikeId : undefined;
    var rentStart = req.body.rentStart ? req.body.rentStart : undefined;
    var rentEnd = req.body.rentEnd ? req.body.rentEnd : undefined;
    /*var rentStart = new Date('2015','11','06','13','30');
    var rentEnd = new Date('2015','11','07','13','30');*/
    /*var data = req.body.reserve ? req.body.reserve : undefined;*/

   /* if(typeof data == "string"){
        data = JSON.parse(data);
    }*/

    data.rentStart = new Date(rentStart);
    data.rentEnd = new Date(rentEnd);
    data.renter = req.user.id;
    if(!data){
        return res.json({code:500,success:false,result:[],msg:"예약 요청 오류",err:null});
    }
    Reserves.findOne({bike:bikeId },function(err,reserves){
        if(err) {
            console.error(err);
            return res.json({code:500,success:false,result:[],msg:"예약 요청 오류",err:err});
        }
        if(reserves){
            reserves.reserve.push(data);
            reserves.save(function(err){
                if(err){
                    console.error(err);
                    return res.json({code:500,success:false,result:[],msg:"예약 요청 오류",err:err});
                }
                res.json({code:200,success:true,result:[],msg:"예약 요청 완료",err:err});
            })

        }else{
            console.log('없음');
            var rsv = new Reserves();
            Bike.findOne({_id : bikeId},function(err,bikes){
                if(err) {
                    console.error(err);
                    return res.json({code:500,success:false,result:[],msg:"예약 가능한 자전거를 찾을 수 없습니다.",err:err});
                }
                if(bikes){
                    rsv.bike = bikes;
                    rsv.lister = bikes.user;
                    rsv.reserve = data;
                    rsv.save(function(err){
                        res.json({code:200,success:true,result:[],msg:"자전거 예약 성공 했습니다..",err:err});
                    });
                }else{
                    res.json({code:500,success:false,result:[],msg:"예약 가능한 자전거를 찾을 수 없습니다.",err:err});
                }

            })
        }

    })

}
/**
 *
 * 자전거 예약 목록 조회
 *
 *  path: 'consoles',
     match: { manufacturer: 'Nintendo' },
     select: 'name',
     options: { comment: 'population' }
 * */
exports.show = function(req,res){
    var userid = req.user.id;
    Reserves.find({lister:userid})
        .populate("bike")
        .populate("lister","name email image")
        .populate("reserve.renter","name email image")
        .exec(function(err,result){
            if(err) {
                console.error(err);
                res.json({code:500 , success:false,result:[],msg:"예약목록 조회 실패 했습니다.",err:err});
            }
            res.json({code:200 , success:true,result : result,err:err});
        })
}

exports.index = function(req,res){
    var bikeId = req.params.bikeId ? req.params.bikeId : undefined;
    Reserves.find({bike:bikeId})
        .populate("bike")
        .populate("lister","name email image")
        .populate("reserve.renter","name email image")
        .exec(function(err,result){
            if(err) {
                console.error(err);
                return res.json({code:500 , success:false,result:[],msg:"예약목록 조회 실패 했습니다.",err:err});
            }
            res.json({code:200 , success:true,result : result,err:err,msg:"예약목록 조회 성공"});
        })
}
/**
 *
 * 자전거 예약 목록 조회
 *
 *  path: 'consoles',
 match: { manufacturer: 'Nintendo' },
 select: 'name',
 options: { comment: 'population' }
 * */
exports.showrent = function(req,res){
    var userid = req.user.id;
    Reserves.aggregate([ {
        $match:
        {"reserve.renter":new ObjectId(userid)}
    },
        { "$unwind": "$reserve" },
        {
            $match:
            {"reserve.renter":new ObjectId(userid)}
        },
        { "$group": {
            "_id" :"$_id",
            "bike": {$first:'$bike'},
            "renter" :{$first:'$reserve.renter'},
            "reserve":{$push:"$reserve"}

        }}],function(err,result){

        Bike.populate( result, { "path": "bike" }, function(err,results) {
            if (err) throw err;
            User.populate(results,{"path":"renter",select:"email image status"},function(err,users){
                console.log('users ' , users);
                res.json({code:200 , success:true,result:users,msg:"예약목록조회 완료",err:err});
            })
        })
    })
}


/**
 *
 * 자전거 예약상태 변경
 *
 * */
exports.status = function(req,res,next){

    var status = req.body.status ; //code  RS : 자전거 예약 승인 , RC : 자전거 예약 취소, RR : 예약 대기
    var reserveId = req.params.reserveId ? req.params.reserveId : undefined;
    var bikeId = req.params.bikeId ? req.params.bikeId : undefined;

    var query = Reserves.findOne({bike: bikeId });
    query.exec(function(err,reseves) {
        if(err) {
            console.error(err);
            res.json({code:500 , success:false,result:[],msg:"자전거 예약 변경 실패 했습니다.",err:err});
        }
        if(reseves){
            reseves.reserve.forEach(function (reserve) {
                if (reserve._id == reserveId) {
                    reserve.status = status;
                    reserve.updatedAt = new Date();
                    reseves.save(function (err, data) {
                        if(err) {
                            console.error(err);
                            res.json({code:500 , success:false,result:[],msg:"자전거 예약 변경 실패 했습니다.",err:err});
                        }
                        if(status == "RS"){
                            gcm.sendMessage(reserve.renter,"자전거 예약승인 되었습니다.");
                            res.json({code:200,success:true,result:[],msg:"자전거 예약승인 되었습니다.",err:err});
                        }else if(status == "RC"){
                            gcm.sendMessage(reserve.renter,"자전거 예약취소 되었습니다.");
                            res.json({code:200,success:true,result:[],msg:"자전거 예약취소 되었습니다.",err:err});
                        }
                    })
                }
            })
        }else{
            res.json({code:200,success:true,result:[],msg:"변경 가능한 자전거 정보가 없습니다.",err:err});
        }

    })
}