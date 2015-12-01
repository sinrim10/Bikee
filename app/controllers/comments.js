/**
 * Created by lsk on 15. 10. 31.
 */
var mongoose = require('mongoose');
var Bike = mongoose.model('Bikes');
var Comments = mongoose.model('Comments');

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

    Comments.find({"reserve.writer": mongoose.Schema.ObjectId(writer) })
        .populate("bike","title image")
        .populate("lister","name email image")
        .populate("comments.writer","name email image _id")
        .exec(function(err,comment){
            if(err) {
                console.error(err);
                res.json({code:500 , success:false,result:comment,err:err});
            }
            console.log('comment ' , comment);
            res.json({code:200 , success:true,result : comment,err:err});
        })
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
    var data = req.body ? req.body : undefined;
    if(typeof data == "string"){
        data = JSON.parse(data);
    }
    console.log('result type1', typeof data);
    Comments.findOne({bike:bikeId},function(err,comments){
        if(err) {
            console.error(err);
            res.json({code:500 , success:false,result:[],msg:"후기 작성 실패",err:err});
        }
        if(!comments){
            console.log("자전거정보 없음 새로 생성");
            Bike.findById(bikeId,function(err,bike){
                if(err) {
                    console.error(err);
                    res.json({code:500 , success:false,result:[],msg:"자전거 조회 실패",err:err});
                }
                data.writer = user;
                var comment = { bike: bike._id,
                                lister: bike.user,
                    comments : data }
                /*comment.comments.writer = user;*/
                console.log('comment ' , comment);
                Comments.create(comment,function(err,result){
                    console.log('처음 생성 ' , result);
                    res.json({code:200,success:true,result:[],msg:"자전거 후기 정보 초기 생성",err:err});
                })
            })
        }else{
            var comment = data;
            comment.writer = user;
            comments.update({$push:{comments:comment}},{ safe: true, upsert: true},function(err,comments){
                if(err) {
                    console.error(err);
                    res.json({code:500 , success:false,result:[],msg:"자전거 후기 작성 실패",err:err});
                }
                console.log("comment 추가",comments);
                res.json({code:200,success:true,result:[],msg:"자전거 후기 추가",err:err});
            });
        }
    })

}
/**
 *
 * 자전거 후기 보기
 *
 * */
exports.bike = function(req,res,next){
    var bikeId = req.params.bikeId;
    /*console.log(' 현재 로그인중인 유저 정보 %s  %s',req.user.name , req.user.email);*/
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

