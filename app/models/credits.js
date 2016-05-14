/**
 * Created by Administrator on 2015-10-27.
 */
var mongoose = require('mongoose');
var config = require('../../config/config');
var crypto = require('crypto');
var node_cryptojs = require('node-cryptojs-aes');
var CryptoJS = node_cryptojs.CryptoJS;
var JsonFormatter = node_cryptojs.JsonFormatter;
var Schema = mongoose.Schema;


var CreditSchema = new Schema({
    user:{type:Schema.ObjectId, ref :'Users'}, //카드사용자
    card_name:{type:String,required: true}, //카드종류
    card_nick:{type:String,required: true},
    k:{type:String,required:true},
    r:{type:String,required:true},
    f:{type:Object,required:true},
    inserted: {type : Date, default : Date.now},//최초작성일
    updated: {type : Date, default : Date.now}//수적일
});

/**
 * Methods
 */

/*CreditSchema.path('customer_uid').validate(function (customer_uid) {
    return customer_uid.length;
}, '카드 빌키를 입력하지 않았습니다.');*/

CreditSchema
    .virtual('password')
    .set(function(password) {
        var p = this.makePass();
        this._password = password;
        this.r = p.r
        this.k = p.k
        this.f = this.encryptMerchant(password);
    })
    .get(function() { return this.f});

CreditSchema.methods = {

    encryptMerchant: function(password){
        if (!password) return null;
        try {
            var encrypted = CryptoJS.AES.encrypt(password, this.combinePass(this.r,this.k), { format: JsonFormatter });
            return encrypted.toString();
        } catch (err) {
            return '';

        }},
    combinePass: function(rp,kp){
        var p = "";
        var r = rp;
        for(var i = config.pass.start; i< config.pass.end;i*=config.pass.enc){
            p = r.replace(i,kp.charAt(i));
            r = p;
            p = r
        }
        return p;
    },makePass:function(){
        var r = crypto.randomBytes(256);
        var k = crypto.randomBytes(40);
        return {r : r.toString("base64") , k :k.toString("base64") }
    }
}
CreditSchema.statics = {
    /**
     * 디크립트
     *
     * @param {Object} options
     * @param {Function} cb
     * @api private
     */
    decryptMerchant: function(criteria,cb) {
        this.findOne(criteria)
            .exec(function (err, result) {
                var decrypted = CryptoJS.AES.decrypt(result.f, CreditSchema.methods.combinePass(result.r,result.k), {format: JsonFormatter});
                cb(err,CryptoJS.enc.Utf8.stringify(decrypted));
            })
    }
}

module.exports =  mongoose.model('Credits', CreditSchema);


