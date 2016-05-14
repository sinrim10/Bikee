/**
 * Created by lsk on 15. 10. 31.
 */
var mongoose = require('mongoose');
var Bike = mongoose.model('Bikes');
var User = mongoose.model('Users');
var Users = require('../models/users')
var Comments = mongoose.model('Comments');
var ObjectId = mongoose.Types.ObjectId;
/**
 * 내평가 보기
 * */
exports.show = function(req,res,next) {
    var writer = req.user.id;

    /*var comments = Comments.find({lister: lister });
    comments.populate("comments.writer","name email image _id")
    comments.populate("bike", "title _id")
    comments.exec(function(err,comment){
        if(err) {
            console.error(err);
            res.json({code:500 , success:false,result:comment,err:err});
        }
        res.json({code:200 , success:true,result : comment,err:err});
    })*/
    Comments.aggregate([ {
        $match:
        {"comments.writer":new ObjectId(writer)}
    },
        { "$unwind": "$comments" },
        {
            $match:
            {"comments.writer":new ObjectId(writer)}
        },
        { "$group": {
            "_id" :"$_id",
            "bike": {$first:'$bike'},
            "lister" :{$first:'$lister'},
            "comments":{$push:"$comments"}

        }}],function(err,result){

        Bike.populate( result, { "path": "bike",select:"title image" }, function(err,results) {
            if (err) throw err;
            User.populate(results,{"path":"lister",select:"email image name"},function(err,users){
                res.json({code:200 , success:true,result : users,err:err});
            })
        })
    });
}

/**
 * 나에게 작성된 평가 보기.
 * */
exports.myshow = function(req,res,next) {
    var lister = req.user.id;
    var comments = Comments.find({lister: lister });
    comments.populate("bike", "title _id")
    comments.populate("lister","name email image")
    comments.populate("comments.writer","name email image _id")
    comments.exec(function(err,comment){
        if(err) {
            console.error(err);
            res.json({code:500 , success:false,result:comment,err:err});
        }
        res.json({code:200 , success:true,result : comment,err:err});
    })
}

/**
 *
 * 자전거 후기 작성
 *
 * */
exports.create = function(req,res,next){
    var user = req.user.id;
    var bikeId = req.params.bikeId ? req.params.bikeId : undefined;
    var comment = req.body ? req.body : undefined;
    if(typeof data == "string"){
        comment = JSON.parse(comment);
    }
    if(comment){
        comment.writer = user;
        Comments.findOneAndUpdate(
            {"$and":[{"bike":new ObjectId(bikeId)},{"lister":comment.lister}]},
            { $push: {"comments": comment}},
            {  safe: true, upsert: true},
            function(err, model) {
                if(err){
                    console.error(err);
                    return res.json({code:500 , success:false,result:[],msg:"자전거 후기 작성 실패",err:err});
                }

                return res.json({code:200,success:true,result:[],msg:"자전거 후기 추가",err:err});
            });
    }else{
        return res.json({code:200,success:false,result:[],msg:"자전거 후기 내용이 없습니다.",err:null});
    }

}
/**
 *
 * 자전거 후기 보기
 *
 * */
exports.bike = function(req,res,next){
    var bikeId = req.params.bikeId;
    Comments.findOne({bike : bikeId}).exec(function(err,comments){
        var writer={path:'comments.writer',select:'name email facebook'};
        var bike={path:'bike',select:'image user title'};
        var lister={path:'lister',select:'name email facebook'};
        Comments.populate(comments,[writer,bike,lister],function(err,comment){ //본인의 자전거에 등록된 후기 작성자들 정보 조회
            if(err) {
                console.error(err);
                res.json({code:500 , success:false,result:[comment],err:err});
            }
            res.json({code:200 , success:true,result : [comment],err:err});
        })
    });
}



exports.fail = function(req,res,next){
    res.render('pages/index',{
        type:"auth"
    })
}

