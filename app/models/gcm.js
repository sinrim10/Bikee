/**
 * Created by Administrator on 2015-10-27.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var GcmsSchema = new Schema({
    user:{type : Schema.ObjectId, ref : 'Users'},//빌려주는사람,자전거주인
    devices : [{
        deviceID : {type: String,required: true},
        token : {type:String,required: true},
        status: {type:Boolean,default:true},
        os: {type:String},
        createdAt  : {type : Date, default : Date.now},//최초작성일
        updatedAt  : {type : Date, default : Date.now}//최종수정일
    }]
})

GcmsSchema.method = {
    getDevices: function (cb) {
        var self = this;
        self.findOne({user: req.user._id})
            .exec(cb);
    }
}

module.exports = mongoose.model('Gcms', GcmsSchema);