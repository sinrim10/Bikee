/**
 * Created by Administrator on 2015-10-27.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;


var CreditsSchema = new Schema({
    type:{type:String,required: true}, //별칭
    number:{type:Number,required: true},//번호
    expire:{type:Date,required: true},//유효기간
    user:{type:Schema.ObjectId, ref :'Users'}, //카드사용자
    createdAt  : {type : Date, default : Date.now}//최초작성일
});

mongoose.model('Credits', CreditsSchema);