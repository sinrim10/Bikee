/**
 * Created by Administrator on 2015-10-27.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
/*var awsUpload = require('../controllers/aws');*/
var User = require('./users');
var BikesSchema = new Schema({
    user:{type:Schema.ObjectId, ref :'Users'},//자전거주인
    type: {type:String, required: true},//종류
    components: {type:[String]},//구성품
    height :{type:String, required: true}, //권장신장
    smartlock:{type:Boolean,default:false},//스마트자물쇠연동여부
    loc: {
        type: { type: String },
        coordinates: []
    },
    title:{type:String,required: true},//제목
    intro:{type:String,default:''},//소개글
    image: { // 이미지
        cdnUri:String,
        files: []
    },
    price:{ //가격
        hour:{type:Number,default:0},
        day:{type:Number,default:0},
        month:{type:Number,default:0}
    },
   // lockdeviceId:{type:String,default:''},
    active:{type:Boolean, default:true },//삭제 여부
    createdAt  : {type : Date, default : Date.now},//최초작성일
    updatedAt  : {type : Date, default : Date.now}//최종수정일
});

BikesSchema.index({ loc: '2dsphere' });
/**
 * Validations
 */

BikesSchema.path('type').required(true, 'BikesSchema type cannot be blank');
BikesSchema.path('height').required(true, 'BikesSchema height cannot be blank');
BikesSchema.path('price.hour').required(true, 'BikesSchema price cannot be blank');
BikesSchema.path('price.day').required(true, 'BikesSchema price cannot be blank');
BikesSchema.path('price.month').required(true, 'BikesSchema price cannot be blank');
BikesSchema.path('user').required(true, 'BikesSchema user cannot be blank');
BikesSchema.path('title').required(true, 'BikesSchema title cannot be blank');


BikesSchema.statics = {
    /**
     * Find article by id

     *
     * @param {ObjectId} id
     * @param {Function} cb
     * @api private
     */

    load: function (id, cb) {
        this.findOne({ _id : id })
            .populate('user', '_id name email username')
            //.populate('comments.user')
            .exec(cb);
    },

    /**
     * List Bikes
     *
     * @param {Object} options
     * @param {Function} cb
     * @api private
     */

list: function (options, cb) {
        var criteria = options.criteria || {};
        var select = options.select || "";
        var populate = options.populate || "";
        var popselect = options.popselect || "";
        this.find(criteria)
            //.where('active').equals(false)//활성화 비활성화 여부.
            .select(select)
            .populate(populate,popselect)
            /*.sort({'_id': -1}) // sort by date*/
            .exec(cb);
    }
}
BikesSchema.methods = {
    uploadAndSave: function (images, cb) {
        if (!images || !images.length) return this.save(cb)


        var self = this;

        this.validate(function (err) {
            if (err) return cb(err);
            /*awsUpload.imageUpload(images,function(err,files,cdnUri){
                if (err) return cb(err);
                if (files.length) {
                    self.image = { cdnUri : cdnUri, files : files };
                }
                self.save(cb);
            })*/

      /*      image.upload(images, function (err, cdnUri, files) {
                console.log('cdnUril ',cdnUri);
                console.log('files ', files);
                if (err) return cb(err);
                console.log(files.length)
                if (files.length) {
                    self.image = { cdnUri : cdnUri, files : files };
                }
                console.log(' self ' , self)
                self.save(cb);
            }, 'article');*/
        });
    }
}


module.exports = mongoose.model('Bikes', BikesSchema);