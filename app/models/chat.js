/**
 * Created by lsk on 15. 11. 22.
 */

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ChatSchema = new Schema({
    sender:{type : Schema.ObjectId, ref : 'Users' , required : true},//메세지 보내는 본인
    rooms : [{
        roomId : {type: String,required: true},
        receiver :{type : Schema.ObjectId, ref : 'Users', required:true},//메세지 받는 상대방
        connect: {type:Boolean,default:false},
        createdAt  : {type : Date, default : Date.now},//최초작성일
        updatedAt  : {type : Date, default : Date.now}//최종수정일
    }]
})




module.exports = mongoose.model('Chat', ChatSchema);