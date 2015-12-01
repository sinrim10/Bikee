/**
 * Created by Administrator on 2015-10-27.
 */
var mongoose = require('mongoose');
var Bike = mongoose.model('Bikes');
var Comment = mongoose.model('Comments');
var Reserves = mongoose.model('Reserves');
var ObjectId = mongoose.Types.ObjectId;
/**
 *
 * 보유 자전거 등록
 *
 * */
exports.create = function(req, res){
    var rst = req.body.bike ? req.body.bike : undefined;
   /* var images = req.files.image
        ? [req.files.image]
        : undefined; //  이미지 정보*/
    var bike = JSON.parse(rst);
    var coordinates = bike.loc.coordinates ? bike.loc.coordinates : undefined;
    var longitude = "";
    var latitude =  "";
    var images = [];
    for(var i=0;i<parseInt(req.body.size);i++){
        images.push(req.files["image"+i]);
    }
    if(coordinates) {
        if(coordinates.length >0 ){
            longitude = coordinates[0];
            latitude = coordinates[1];
        }
    }else{
        longitude = "126.978013";
         latitude =  "37.565596";
    }
    console.log('result type1', typeof bike);
    console.log("req.files.image ", images);
    console.log('coordinates ' , coordinates);
    console.log('latitude ' , latitude);
    console.log('longitude' , longitude);
     var bikes = new Bike(bike);
     bikes.user = req.user;
     bikes.loc = { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] };
     bikes.uploadAndSave(images, function (err,result) {
     if(err) {
         console.log('err ' , err);
         return res.json({code:500, success:true,result:[] ,msg:"보유 자전거 등록에 실패했습니다.",err : err});
     }
            res.json({code:"200",success:true,result:[],msg :'자전거 등록되었습니다'});
        });
     }

exports.all = function (req,res){

    var options = {};
    var lat,lon;

    lat = req.params.lat ?req.params.lat : "37.565596";
    lon = req.params.lon ? req.params.lon : "126.978013";


    var point = { type : "Point", coordinates : [parseFloat(lon), parseFloat(lat)] };
    options.loc = {
        loc: {
            $near: {
                $geometry: point
              /*  ,$maxDistance:10000 //단위 미터..*/
                , spherical: true
            }
        }
    }
    options.select = "type price height title loc createdAt updatedAt active user image";
    options.populate = "user"
    options.populateSel ="name email phone image"
    options.userid = [];
    if(req.user){
        options.userid.push(req.user.id);
        console.log('req.user ' ,req.user.id);
    }
    console.log("options.loc " , options.loc)
    Bike.list(options, function (err, bikes) {
        if (err){
            console.error(err)
            return res.json({msg:500,result:[],msg:"전체조회 실패 했습니다.",err: err});
        }
        console.log('자전거 전체 조회 ' , bikes);

        res.json({
            code:200,success:true,result:bikes,err:err
        });
    });
}
     /**
     *  필터 조회
     */
exports.index = function (req, res){
    /*lat=37.468501&lon=126.957913&start=2015/11/08 20:14:43&end=2015/11/12 20:14:43&type=03&height=A&component=01,02,03,04&smartlock=true*/
    /*lat=37.468501&lon=126.957913&start=&end=&type=&height=&component=&smartlock=*/
    var options = {};
    var lat,lon,start,end,type,height,component,smartlock,comp,lastindex =0;
    lastindex = req.params.lastindex ? req.params.lastindex : 0;
    lat = req.params.lat ?req.params.lat : "37.565596";
    lon = req.params.lon ? req.params.lon : "126.978013";
    start = req.query.start ?req.query.start : "";
    end = req.query.end ? req.query.end :"";
    type = req.query.type ? req.query.type :"";
    height = req.query.height ? req.query.height :"";
    component = req.query.component ? req.query.component : "";
    smartlock = req.query.smartlock ? req.query.smartlock : false;

    if(start !="" && end != ""){
        start = new Date(Date.parse(start))
        end = new Date(Date.parse(end))
    }



    console.log('start ' , start + " ")
    console.log('end ' , end+ " ")
    console.log('type ' , type+ " ")
    console.log('height ' , height+ " ")
    console.log('component ' , component+ " ")
    console.log('smartlock ' , smartlock+ " ")

    if(component != ""){
        comp = component.split(",");
        console.log('comp ',comp+ " ");
    }


    console.log('typeof lon ' , typeof lon)
    console.log('typeof lat ' , typeof lat)
    var point = { type : "Point", coordinates : [parseFloat(lon),parseFloat(lat) ] };
    options.loc = {
        loc: {
            $near: {
                $geometry: point
                //,$maxDistance:84 //단위 미터..
                , spherical: true
            }
        }
    }
    options.select = "type price height title loc createdAt updatedAt active user image";
    options.populate = "user"
    options.populateSel ="name email phone image"
    options.skip = parseInt(lastindex);
    options.limit = 10;
    options.ninid = [];
    options.userid = [];
    if(req.user){
        options.userid.push(req.user.id);
        console.log('req.user ' ,req.user.id);
    }
    var query = Reserves.find({$or:[{'reserve.rentStart':{$gt : end}} , {'reserve.rentEnd':{$lt : start}}]})
    query.select("_id");
    query.exec(function(err,data){
        console.log('예약가능한 id. ', data);
        Reserves.find({_id:{$nin:data}}).select("bike")
            .exec(function(err,data){
                console.log('예약 불가능한 id..', data);
                if(start != "" && end != ""){
                    if(data.length>0){
                        for(var i=0 ;i < data.length;i++){
                            console.log('data[i].bike ' , data[i].bike);
                            options.ninid.push(data[i].bike);
                        }
                    }
                }

                Bike.list(options, function (err, bikes) {
                    if (err){
                        console.error(err)
                        return res.json({msg:500,result:[],msg:"전체조회 실패 했습니다.",err: err});
                    }

                    console.log('자전거 전체 조회 ' , bikes);
                    Bike.count(function(err,count){
                        console.log('&& count > options.limit ' , count);
                        if(count < parseInt(lastindex)){
                            res.json({
                                code:200,success:true,result:bikes,lastindex:lastindex,err:err
                            });
                        }else{
                            lastindex = parseInt(lastindex) + parseInt(options.limit) ;
                            console.log('lastIndex' , lastindex);
                            res.json({
                                code:200,success:true,result:bikes,lastindex:parseInt(lastindex),err:err
                            });
                        }
                    })
                });
            })
        })

    /*     if(bikes.slice(-1)[0]){
     req.session.lastSeen = bikes.slice(-1)[0]._id;
     res.json({
     code:200,success:true,result:bikes,err:err
     });
     } else {
     req.session.lastSeen = null;
     res.json({
     code:200,success:true,result:null,err:err
     });
     }*/
/*
    Bike.list(options, function (err, bikes) {
        if (err){
            console.error(err)
            return res.json({msg:500,result:[],msg:"전체조회 실패 했습니다.",err: err});
                    }
        /!*console.log('조회한 데이터 ' ,bikes);*!/
        if(bikes.slice(-1)[0]){
            req.session.lastSeen = bikes.slice(-1)[0]._id;
            res.json({
                code:200,success:true,result:bikes,err:err
            });
        } else {
            req.session.lastSeen = null;
            res.json({
                code:200,success:true,result:null,err:err
            });
        }
    });*/
};

/**
 *
 * 보유자전거 조회
 *
 * */
exports.myList = function(req,res){
    var options = {};
    options.criteria = {user : req.user.id}
    options.select = "title createdAt updatedAt active image";
    options.limit = 100;
    Bike.list(options, function (err, bikes) {
        if(err) {
            console.error(err);
            res.json({code:500 , success:false,result:bikes,err:err});
        }
        res.json({code:200 , success:true,result : bikes,err:err});
    });
};

/**
 *
 * 자전거 상세조회
 *
 * */

exports.detail = function(req,res){
    var options = {};

    options.criteria = {_id : req.params.bikeId}
    options.populate = "user";
    options.popselect = "_id email name";
    Bike.list(options, function (err, bikes) {
        if(err) {
            console.error(err);
            res.json({code:500 , success:false,result:bikes,err:err});
        }
        res.json({code:200 , success:true,result : bikes,err:err});
    });
}
/**
 *
 * 보유자전거 삭제
 *
 * */

exports.delete = function(req,res){
    var options = {};
    options.criteria = {_id : req.params.bikeId}
    var bikeId = req.params.bikeId ? req.params.bikeId : undefined;

    Comment.findOne({bike :bikeId },function(err,data){
        if (err){
            console.error(err);
            return res.status(500).json({code:'500',success:false,result:[],msg:"보유자전거 삭제 실패 했습니다.",err:err});
        }
        if(data){
            res.json({
                code:403,success:false,result:[],msg:"작성된 후기내용이 있으므로 삭제 불가능 합니다."
            });
        }else{
            Bike.findOneAndRemove(options.criteria,function(err,data){
                console.log('delete data :', data);
                if(err){
                    console.error(err);
                    return res.json({code:'500',success:false,result:[],msg:"보유자전거 삭제 실패 했습니다.",err:err});
                }
                res.json({
                    code:200,success:true,result:[],msg:"보유자전거 삭제 성공 했습니다.",err:err
                });
            });
        }
    })

}

/**
 *
 * 보유자전거 수정
 *
 * */
exports.edit = function(req,res,next){
    var options = {};
    /*var updates = { $set: {title:"수정된 자전거",loc :{ type: 'Point', coordinates: [parseFloat(121.958781), parseFloat(34.468383)] },updatedAt :new Date()} };*/
    var data = req.body.bike ? req.body.bike : undefined;
    var bikeId = req.params.bikeId ? req.params.bikeId : undefined;

    if(typeof data == "string"){
        data = JSON.parse(data);
    }
    var updates = { $set: data ,updatedAt :new Date()} ;
    options.criteria = {_id : bikeId};
    Bike.findOneAndUpdate(options.criteria,updates,{ runValidators: true },
        function(err,data){
            if (err){
                console.log('err ',err);
                return res.json({code:'500',success:false,result:[],msg:"보유자전거 수정 실패 했습니다.",err:err});
            }
            res.json({code:200,success:true,result:[],msg : "보유자전거 수정 완료되었습니다.",err : err});
        })
}

/**
 *
 * 보유자전거 활성화 비활성화
 *
 * */
exports.active = function(req,res,next){
    var options = {};
    options.criteria = {_id : req.params.bikeId};
    Bike.findOne(options.criteria,function(err,data){
        var updates = {}
        var result = "";
        var active = !data.active;
        updates = { $set: {active:active, updatedAt : new Date() } };
        if(active){
            result =  "보유자전거 활성화되 었습니다."
        } else {
            result =  "보유자전거 비활성화되 었습니다."
        }
        data.update(updates).exec(function(err,data){
            console.log('result : ' , data);
            if (err){
                console.error('err ',err);
                return res.json({code:'500',success:false,result:[],msg:"보유자전거 활성화 실패 했습니다.",err:err});
            }
            res.json({code:200,success:true,result:[],msg:result,err:err});
        })
    });
}

exports.addLock = function(req,res,next){
    var bikeId = req.params.bikeId ? req.params.bikeId : undefined;
    var lockdeviceId = req.body.lockdeviceId ? req.body.lockdeviceId : undefined;
    Bike.findOne({_id:new ObjectId(bikeId)},function(err,bike){
        if(err){
            console.error('err ' , err);
            return res.json({code:'500',success:false,result:[],msg:"자전거 정보조회 실패",err:err});
        }
        if(bike){
            var update = {$set:{lockdeviceId:lockdeviceId}}
            bike.update(update,function(err,result){
                if(err){
                    return res.json({code:'500',success:false,result:[],msg:"자물쇠 등록 실패",err:err});
                }
                return res.json({code:'500',success:false,result:[],msg:"자물쇠 등록 실패",err:err});
            })
        }
    })
}

exports.test = function(req,res){
    var Imager = require('imager');
    var imagerConfig = require("../../config/imager");
    var imager = new Imager(imagerConfig, 'S3');
    var images = req.files.image
        ? [req.files.image]
        : undefined; //  이미지 정보
    console.log("images " , images);
    var rst  = {}
    console.log('req.files ', req.files);
    console.log('req.body ' , req.body);

    images.forEach(function(data){
        imager.upload(data, function (err, cdnUri, files) {
            console.log('cdnUril ',cdnUri);
            console.log('files ', files);
            if (err) return cb(err);
            console.log(files.length)
            if (files.length) {
                rst.image = { cdnUri : cdnUri, files : files };
            }
            console.log(' self ' , rst)
        }, 'article');
    })
    res.end();
}

