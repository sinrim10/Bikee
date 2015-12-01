/**
 * Created by lsk on 15. 11. 22.
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Chat = mongoose.model('Chat');
var async = require('async');
exports.create = function(req,res,next){
    console.log(req.body);
    var sender = req.body.sender;
    var receiver = req.body.receiver;
    var roomId = sender+receiver;

    var room1 = {
        roomId:roomId,
        receiver:receiver
    }
    var room2 = {
        roomId:roomId,
        receiver:sender
    }
    async.waterfall([function(callback){
        Chat.findOne({sender:sender},function(err,chat){
            var flag = true;
            if(err){
                console.error('err ' , err);
                next(err);
            }
            console.log('chat ' , chat);
            if(chat){
                if(chat.rooms.length>0){
                    for(var i=0; i<chat.rooms.length;i++){
                        if(chat.rooms[i].receiver == receiver){
                            console.log('같다');
                            flag = false;
                        }
                    }

                }
                if(flag){
                    chat.update({$push:{"rooms":room1}},function(err,result){
                        if(err){
                            console.error('err ' ,err);
                            next(err);
                        }
                        console.log('result ' , result)
                        /*res.json({success:true,result:[]});*/
                        callback()
                    })
                }
                callback()
            }else{
                Chat.create({sender:sender,rooms:room1},function(err,result){
                    if(err){
                        console.error('err ' ,err);
                        next(err);
                    }
                    console.log('result ' , result);
                    /*res.json({success:true,result:[]})*/
                    callback()
                })
            }
        })
    },function(callback){
        Chat.findOne({sender:receiver},function(err,chat){
            var flag = true;
            if(err){
                console.error('err ' , err);
                next(err);
            }
            if(chat){
                if(chat.rooms.length>0){
                    for(var i=0; i<chat.rooms.length;i++){
                        if(chat.rooms[i].receiver == sender){
                            console.log('같다');
                            flag = false;
                        }
                    }
                }
                if(flag){
                    chat.update({$push:{"rooms":room2}},function(err,result){
                        if(err){
                            console.error('err ' ,err);
                            next(err);
                        }
                        console.log('result ' , result)
                        callback()
                    })
                }
                callback();
            }else{
                Chat.create({sender:receiver,rooms:room2},function(err,result){
                    if(err){
                        console.error('err ' ,err);
                        next(err);
                    }
                    console.log('result ' , result);
                    /*res.json({success:true,result:[]})*/
                    callback()
                })
            }
        })
    }],function(err,results){
        res.json({success:true,result:"대화방입장."});
    })
}

exports.index = function(req,res){
    var userId = "563996f1e0ae79af0c093b8c";
    Chat.findOne({'sender':new ObjectId(userId)})
        .populate("sender","name email image")
        .populate("rooms.receiver","name email image")
        .exec(function(err,result){
            console.log('result ' ,result);
            res.json(result);
        });

}