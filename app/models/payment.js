/**
 * Created by Administrator on 2016-04-18.
 */

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var PaymentSchema = new Schema({
    bike:{type:Schema.ObjectId, ref:'Bikes',required:true}, //자전거아이디
    lister:{type : Schema.ObjectId, ref:'Users' ,required:true},//빌려주는사람,자전거주인
    payment : [{
        renter: {type : Schema.ObjectId, ref : 'Users',required:true},
        refund:{type :Boolean , default:false},
        "iamport":{
                "imp_uid": {type: String,required: true},
                "merchant_uid": {type: String,required: true},
                "pay_method": {type: String},
                "pg_provider": {type: String},
                "pg_tid": {type: String},
                "apply_num": {type: String},
                "card_name": {type: String},
                "card_quota": {type: Number},
                "vbank_name": {type: String},
                "vbank_num": {type: String},
                "vbank_holder": {type: String},
                "vbank_date": {type: Number},
                "name": {type: String},
                "amount": {type: Number},
                "cancel_amount": {type: Number},
                "buyer_name": {type: String},
                "buyer_email": {type: String},
                "buyer_tel": {type: String},
                "buyer_addr": {type: String},
                "buyer_postcode": {type: String},
                "custom_data": {type: String},
                "user_agent": {type: String},
                "status": {type: String},
                "paid_at": {type: Number},
                "failed_at": {type: Number},
                "cancelled_at": {type: Number},
                "fail_reason": {type: String},
                "cancel_reason": {type: String},
                "receipt_url": {type: String}
        }
    }]
})



module.exports = mongoose.model('Payments', PaymentSchema);