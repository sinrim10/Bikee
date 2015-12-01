/**
 * Created by Administrator on 2015-10-27.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ReservesSchema = new Schema({
    bike:{type:Schema.ObjectId,ref:'Bikes'}, //자전거아이디
    lister:{type : Schema.ObjectId, ref : 'Users'},//빌려주는사람,자전거주인
    reserve : [{
        rentStart: {type: Date, required: true },//대여시작일
        rentEnd: {type: Date, required: true },//대여종료일
        renter:{ type : Schema.ObjectId, ref : 'Users'},//빌리는사람
        status:{type:String,default:"RR"},//예약승인:RS,예약취소:RC,예약요청:RR
        createdAt  : {type : Date, default : Date.now},//최초작성일
        updatedAt  : {type : Date, default : Date.now}//최종수정일
    }],
    createdAt  : {type : Date, default : Date.now},//최초작성일
})



module.exports = mongoose.model('Reserves', ReservesSchema);