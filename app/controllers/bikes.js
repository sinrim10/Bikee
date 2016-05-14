/**
 * Created by Administrator on 2015-10-27.
 */
var mongoose = require('mongoose');
var Bike = mongoose.model('Bikes');
var Comment = mongoose.model('Comments');
var Reserves = mongoose.model('Reserves');
var User = mongoose.model("Users");
var ObjectId = mongoose.Types.ObjectId;
/**
 *
 * 보유 자전거 등록
 *
 * */
exports.create = function(req, res){
    var bike = req.body.bike ? req.body.bike : undefined;
    var files = req.files;
    var image = [];
    if(typeof bike === "string"){
        bike = JSON.parse(bike);
    }

    var coordinates = bike.loc.coordinates ? bike.loc.coordinates : undefined;
    var longitude = "";
    var latitude =  "";

    if(coordinates) {
        if(coordinates.length >0 ){
            longitude = coordinates[0];
            latitude = coordinates[1];
        }
    }else{
        longitude = "126.978013";
         latitude =  "37.565596";
    }

     var bikes = new Bike(bike);
     bikes.user = req.user;
     bikes.loc = { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] };
    files.forEach(function(file){
        image.push("/"+file.key);
    })
    bikes.image = { cdnUri : 'https://sharebike.s3.amazonaws.com', files : image };
    bikes.save(function(err,result){
        if(err) {
            console.log('err ', err);
            return res.json({code:500, success:true,result:[] ,msg:"보유 자전거 등록에 실패했습니다.",err : err});
        }
            res.json({code:"200",success:true,result:[],msg :'자전거 등록되었습니다'});
    })
     /*bikes.uploadAndSave(req.files.files, function (err,result) {
     if(err) {
         console.log('err ', err);
         return res.json({code:500, success:true,result:[] ,msg:"보유 자전거 등록에 실패했습니다.",err : err});
     }
            res.json({code:"200",success:true,result:[],msg :'자전거 등록되었습니다'});
        });*/
     }


exports.list = function (req,res){
    var lat = req.params.lat ?req.params.lat : "37.565596";
    var lon = req.params.lon ? req.params.lon : "126.978013";
    var lastindex = req.params.lastindex ? req.params.lastindex : 0;
    var obj = Object.getOwnPropertyNames(req.query);
    var json = {};

    var skip = parseInt(lastindex);
    var limit = 20;

    if(obj.length >0){
        for(var i in obj ){
            if(typeof req.query[obj[i]] === "string"){
                json[obj[i]] =JSON.parse(req.query[obj[i]])
            }
        }
    }
    if(json.filter){
        if(json.filter.start && json.filter.end){
            var start = new Date(Date.parse(json.filter.start));
            var end = new Date(Date.parse(json.filter.end));
            Reserves.aggregate([
                {
                    $unwind:"$reserve"
                },
                {
                    $match: {
                        $or: [
                            {$and:[{'reserve.rentStart':{$lt:start}},{'reserve.rentEnd':{$gt:start}},{'reserve.rentStart':{$lt:end}},{'reserve.rentEnd':{$lt:end}}]},
                            {$and:[{'reserve.rentStart':{$gt:start}},{'reserve.rentEnd':{$gt:start}},{'reserve.rentStart':{$lt:end}},{'reserve.rentEnd':{$gt:end}}]},//없음
                            {$and:[{'reserve.rentStart':{$lt:start}},{'reserve.rentEnd':{$gt:start}},{'reserve.rentStart':{$lt:end}},{'reserve.rentEnd':{$gt:end}}]},
                            {$and:[{'reserve.rentStart':{$gt:start}},{'reserve.rentEnd':{$gt:start}},{'reserve.rentStart':{$lt:end}},{'reserve.rentEnd':{$lt:end}}]}
                            /*{$and:[{'reserve.rentStart':{$lt:start}},{'reserve.rentEnd':{$gt:start}},{'reserve.rentStart':{$lt:end}},{'reserve.rentEnd':{$lt:end}}]},
                            {$and:[{'reserve.rentStart':{$gt:start}},{'reserve.rentEnd':{$lt:start}},{'reserve.rentStart':{$lt:end}},{'reserve.rentEnd':{$gt:end}}]},
                            {$and:[{'reserve.rentStart':{$gt:start}},{'reserve.rentEnd':{$gt:start}},{'reserve.rentStart':{$lt:end}},{'reserve.rentEnd':{$lt:end}}]},
                            {$and:[{'reserve.rentStart':{$lt:start}},{'reserve.rentEnd':{$gt:start}},{'reserve.rentStart':{$lt:end}},{'reserve.rentEnd':{$gt:end}}]},*/
                        ]
                    }

                },
                {
                    $group:{
                        _id:"$bike"
                    }
                }
            ]).exec(function(err,result){

                if (err){
                    console.error(err)
                    return res.json({code:500,result:[],msg:"필터조회 실패 했습니다.",err: err.stack});
                }
                var and = [];
                and.push({_id:{$nin: result.map(function(u){
                    return new ObjectId(u._id);
                })}});
                if(json.filter.type){
                    and.push({"type":json.filter.type})
                }
                if(json.filter.height){
                    and.push({"height":json.filter.height});
                }
                if(!(json.filter.smartlock === 'undefined')){
                    and.push({"smartlock":json.filter.smartlock});
                }
                if(and.length == 0){
                    and.push({});
                }
                Bike.aggregate(
                    [{
                        $geoNear:{
                            near:[parseFloat(lon), parseFloat(lat)],
                            distanceField:"distance",
                            /*includeLocs: "dist.location",*/
                            spherical:true,
                            distanceMultiplier:6378.139266/*,
                             maxDistance:parseFloat("1010101010")/6378.139266*/
                        }
                    },{
                        $skip:skip
                    },{
                        $limit:limit
                    },{
                        $match:{
                            /*$and:[{_id:{$in: result.map(function(u){
                             return new ObjectId(u.bike);
                             })}},{"type":json.filter.type},{"height":json.filter.height}]*/
                            $and: and

                        }
                    }])
                    .exec(function(err,result){
                        /*console.log( JSON.stringify( result, undefined, 4 ) );*/
                        if (err){
                            console.error(err)
                            return res.json({msg:500,result:[],msg:"필터조회 실패 했습니다.",err: err});
                        }
                        User.populate(result,{path:"user",select:"phone provider image email name"},function(err,bikes){
                            res.json({
                                code:200,success:true,count:bikes.length,result:bikes,err:err
                            });
                        });
                    })

            })
        }else{
            var and = [];
            if(json.filter.type){
                and.push({"type":json.filter.type})
            }
            if(json.filter.height){
                and.push({"height":json.filter.height});
            }
            if(!(json.filter.smartlock === 'undefined')){
                and.push({"smartlock":json.filter.smartlock});
            }
            if(and.length == 0){
                and.push({});
            }
            Bike.aggregate(
                [{
                    $geoNear:{
                        near:[parseFloat(lon), parseFloat(lat)],
                        distanceField:"distance",
                        /*includeLocs: "dist.location",*/
                        spherical:true,
                        distanceMultiplier:6378.139266,
                        maxDistance:parseFloat("1010101010")/6378.139266
                    }
                },{
                    $skip:skip
                },{
                    $limit:limit
                },{
                    $match:{
                        /*$and:[{_id:{$in: result.map(function(u){
                         return new ObjectId(u.bike);
                         })}},{"type":json.filter.type},{"height":json.filter.height}]*/
                        $and: and

                    }
                }])
                .exec(function(err,result){
                    if (err){
                        console.error(err)
                        return res.json({msg:500,result:[],msg:"필터조회 실패 했습니다.",err: err});
                    }
                    User.populate(result,{path:"user",select:"phone provider image email name"},function(err,bikes){

                        res.json({
                            code:200,success:true,count:bikes.length,result:bikes,err:err
                        });
                    });
                })
        }
    } else {
        Bike.aggregate(
            [{
                $geoNear:{
                    near:[parseFloat(lon), parseFloat(lat)],
                    distanceField:"distance",
                    /*includeLocs: "dist.location",*/
                    spherical:true,
                    distanceMultiplier:6378.139266/*,
                    maxDistance:parseFloat("1010101010")/6378.139266*/
                }
            },{
                $skip:skip
            },{
                $limit:limit
            }])
            .exec(function(err,result){
                if (err){
                    console.error(err)
                    return res.json({code:500,result:[],msg:"필터조회 실패 했습니다.",err: err});
                }
                User.populate(result,{path:"user",select:"phone provider image email name"},function(err,bikes){

                    res.json({
                        code:200,success:true,count:bikes.length,result:bikes,err:err
                    });
                });
            })
    }


    //본인 자전거는 조회 안되게.. 이후 처리.
    /*if(req.isAuthenticated()){
        user = new ObjectId(req.user.id);
    }*/



}

exports.map = function(req,res,next){
    var lat = req.params.lat ?req.params.lat : "37.565596";
    var lon = req.params.lon ? req.params.lon : "126.978013";
    var obj = Object.getOwnPropertyNames(req.query);
    var json = {};

    if(obj.length >0){
        for(var i in obj ){
            if(typeof req.query[obj[i]] === "string"){
                json[obj[i]] =JSON.parse(req.query[obj[i]])
            }
        }
    }
    if(json.filter){
        if(json.filter.start && json.filter.end){
            var start = new Date(Date.parse(json.filter.start))
            var end = new Date(Date.parse(json.filter.end))
            Reserves.aggregate([
                {
                    $unwind:"$reserve"
                },
                {
                    $match: {
                        $or: [
                            {$and:[{'reserve.rentStart':{$lt:start}},{'reserve.rentEnd':{$gt:start}},{'reserve.rentStart':{$lt:end}},{'reserve.rentEnd':{$lt:end}}]},
                            {$and:[{'reserve.rentStart':{$gt:start}},{'reserve.rentEnd':{$gt:start}},{'reserve.rentStart':{$lt:end}},{'reserve.rentEnd':{$gt:end}}]},//없음
                            {$and:[{'reserve.rentStart':{$lt:start}},{'reserve.rentEnd':{$gt:start}},{'reserve.rentStart':{$lt:end}},{'reserve.rentEnd':{$gt:end}}]},
                            {$and:[{'reserve.rentStart':{$gt:start}},{'reserve.rentEnd':{$gt:start}},{'reserve.rentStart':{$lt:end}},{'reserve.rentEnd':{$lt:end}}]}
                        ]
                    }

                },
                {
                    $group:{
                        _id:"$bike"
                    }
                }
            ]).exec(function(err,result){

                if (err){
                    console.error(err)
                    return res.json({code:500,result:[],msg:"필터조회 실패 했습니다.",err: err.stack});
                }
                var and = [];
                and.push({_id:{$nin: result.map(function(u){
                    return new ObjectId(u._id);
                })}});
                if(json.filter.type){
                    and.push({"type":json.filter.type})
                }
                if(json.filter.height){
                    and.push({"height":json.filter.height});
                }
                if(!(json.filter.smartlock === 'undefined')){
                    and.push({"smartlock":json.filter.smartlock});
                }
                if(and.length == 0){
                    and.push({});
                }
                Bike.aggregate(
                    [{
                        $geoNear:{
                            near:[parseFloat(lon), parseFloat(lat)],
                            distanceField:"distance",
                            /*includeLocs: "dist.location",*/
                            spherical:true,
                            distanceMultiplier:6378.139266/*,
                             maxDistance:parseFloat("1010101010")/6378.139266*/
                        }
                    },{
                        $match:{
                            /*$and:[{_id:{$in: result.map(function(u){
                             return new ObjectId(u.bike);
                             })}},{"type":json.filter.type},{"height":json.filter.height}]*/
                            $and: and

                        }
                    }])
                    .exec(function(err,result){
                        if (err){
                            console.error(err)
                            return res.json({msg:500,result:[],msg:"필터조회 실패 했습니다.",err: err});
                        }
                        User.populate(result,{path:"user",select:"phone provider image email name"},function(err,bikes){
                            res.json({
                                code:200,success:true,count:bikes.length,result:bikes,err:err
                            });
                        });
                    })

            })
        }else{
            var and = [];
            if(json.filter.type){
                and.push({"type":json.filter.type})
            }
            if(json.filter.height){
                and.push({"height":json.filter.height});
            }
            if(!(json.filter.smartlock === 'undefined')){
                and.push({"smartlock":json.filter.smartlock});
            }
            if(and.length == 0){
                and.push({});
            }
            Bike.aggregate(
                [{
                    $geoNear:{
                        near:[parseFloat(lon), parseFloat(lat)],
                        distanceField:"distance",
                        /*includeLocs: "dist.location",*/
                        spherical:true,
                        distanceMultiplier:6378.139266
                        /*, maxDistance:parseFloat("1010101010")/6378.139266*/
                    }
                },{
                    $match:{
                        /*$and:[{_id:{$in: result.map(function(u){
                         return new ObjectId(u.bike);
                         })}},{"type":json.filter.type},{"height":json.filter.height}]*/
                        $and: and

                    }
                }])
                .exec(function(err,result){
                    if (err){
                        console.error(err)
                        return res.json({msg:500,result:[],msg:"필터조회 실패 했습니다.",err: err});
                    }
                    User.populate(result,{path:"user",select:"phone provider image email name"},function(err,bikes){
                        res.json({
                            code:200,success:true,count:bikes.length,result:bikes,err:err
                        });
                    });
                })
        }
    }else{
        Bike.aggregate(
            [{
                $geoNear:{
                    near:[parseFloat(lon), parseFloat(lat)],
                    distanceField:"distance",
                    /*includeLocs: "dist.location",*/
                    spherical:true,
                    distanceMultiplier:6378.139266/*,
                     maxDistance:parseFloat("1010101010")/6378.139266*/
                }
            }])
            .exec(function(err,result){
                if (err){
                    console.error(err)
                    return res.json({msg:500,result:[],msg:"전체 조회 실패 했습니다.",err: err});
                }
                User.populate(result,{path:"user",select:"phone provider image email name"},function(err,bikes){

                    res.json({
                        code:200,success:true,count:bikes.length,result:bikes,err:err
                    });
                });
            })

    }
}
/**
 *
 * 보유자전거 조회
 *
 * */
exports.myList = function(req,res){
    var options = {};
    options.criteria = {user : req.user.id}
    options.select = "title createdAt updatedAt active image price loc";
    Bike.list(options, function (err, bikes) {
        if(err) {
            console.error(err);
            res.json({code:500 , success:false,result:bikes,err:err});
        }
        res.json({code:200 , success:true,count:bikes.length,result : bikes,err:err});
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
    options.popselect = "_id email name phone provider facebook";
    Bike.list(options, function (err, bikes) {
        if(err) {
            console.error(err);
            res.json({code:500 , success:false,result:bikes,err:err});
        }
        res.json({code:200 , success:true,count:bikes.length,result : bikes,err:err});
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
 * var updates = { $set: {title:"수정된 자전거",loc :{ type: 'Point', coordinates: [parseFloat(121.958781), parseFloat(34.468383)] },updatedAt :new Date()} };
 * */
exports.edit = function(req,res,next){
    var options = {};

    var bike = req.body.bike ? req.body.bike : undefined;
    var bikeId = req.params.bikeId ? req.params.bikeId : undefined;

    if(typeof bike == "string"){
        bike = JSON.parse(bike);
    }
    var coordinates = bike.loc.coordinates ? bike.loc.coordinates : undefined;
    if(coordinates){
        if(coordinates.length>0){
            bike.loc = { type: 'Point', coordinates: [parseFloat(coordinates[0]), parseFloat(coordinates[1])] };
        }
    }
    var updates = { $set: bike ,updatedAt :new Date()} ;
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


