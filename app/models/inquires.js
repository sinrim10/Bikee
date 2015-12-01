/**
 * Created by Administrator on 2015-10-27.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;


var InquiresSchema = new Schema({
    writer:{type:Schema.ObjectId, ref :'Users'},
    title:{type:String,default:''},
    body:{type:String,default:''},
    createdAt  : {type : Date, default : Date.now}
});


mongoose.model('Inquires', InquiresSchema);