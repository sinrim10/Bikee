/**
 * Created by Administrator on 2016-04-14.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var SendBirdSchema = new Schema({
    channel_url:{type :String, required : true },//채팅방 url
    renter:{type : Schema.ObjectId, ref : 'Users' , required : true},//랜터
    lister:{type : Schema.ObjectId, ref : 'Users' , required : true},//리스터
    bike:{type : Schema.ObjectId, ref : 'Bikes' , required : true}//자전거
});

module.exports = mongoose.model('SendBird', SendBirdSchema);