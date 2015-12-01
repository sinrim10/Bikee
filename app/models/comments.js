/**
 * Created by lsk on 15. 10. 31.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommentsSchema = new Schema({
    bike:{type:Schema.ObjectId, ref :'Bikes'},
    lister:{type: Schema.ObjectId, ref: 'Users'},
    comments: [{//후기
        point: {type: Number, required:true},
        body: {type: String, default: ''},
        writer: {type: Schema.ObjectId, ref: 'Users'},//후기작성자
        createdAt: {type: Date, default: Date.now}
    }]
});


module.exports = mongoose.model("Comments",CommentsSchema);

