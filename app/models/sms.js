/**
 * Created by Administrator on 2015-11-19.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var SmsSchema = new Schema({
    mobile : {
        type: String,
        validate: {
            validator: function(v) {
                return /\d{3}-\d{3,4}-\d{4}/.test(v);
            },
            message: '{VALUE} is not a valid mobile number!'
        },
        required: [true, 'User mobile number required']
    },
        auth_number : {type:Number,required:true},
        accepted:{type:Boolean,default:false}
})

module.exports = mongoose.model('Sms', SmsSchema);