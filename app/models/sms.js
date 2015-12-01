/**
 * Created by Administrator on 2015-11-19.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var SmsSchema = new Schema({
    mobile : {type:String,required:true
            , validate: { //폰번호
                validator: function(mobile) {
                    return (/^\d{3}-\d{3,4}-\d{4}$/).test(mobile);
                },
                message: '{VALUE} is not a valid phone number!'
            }},
        auth_number : {type:Number,required:true},
        accepted:{type:Boolean,default:false}
})

module.exports = mongoose.model('Sms', SmsSchema);