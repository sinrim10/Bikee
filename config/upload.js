/**
 * Created by Administrator on 2016-04-27.
 */
var multer = require('multer');
var imager = require('multer-imager');
var config = require('./aws');
var upload = multer({
    storage: imager({
        dirname: 'image',
        bucket: 'sharebike',
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        region: config.region,
        acl: 'public-read',
        filename: function (req, file, cb) { // [Optional]: define filename (default: random)
            cb(null, Date.now()+".png")               // i.e. with a timestamp
        },                                   //
        gm: {
            pool: 5,             // how many graphicsmagick processes to use
            format: 'png',       // format to convert to
            scale: {
                width: 800,        // scale input to this width
                height: 600,       // scale input this height
                type: 'contain'    // scale type (either contain/cover/fixed)
            },
            crop: {
                width: 800,        // crop input to this width
                height: 600,       // crop input this height
                x: 0,              // crop using this x offset
                y: 0               // crop using this y offset
            },
            rotate: 'auto',      // auto rotate image based on exif data
                                 // or use rotate:degrees
            density: 440,        // set the image density. useful when converting pdf to images
        }
    })
});

module.exports = upload;