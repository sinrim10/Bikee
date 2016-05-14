/**
 * Created by Administrator on 2016-01-25.
 */
var fs = require('fs');
var pathUtil = require('path');
var easyimg = require('easyimage');
var AWS = require('aws-sdk');
var async = require('async');
var config = require('../../config/aws');
AWS.config.region = config.region;
AWS.config.accessKeyId = config.accessKeyId;
AWS.config.secretAccessKey = config.secretAccessKey;

var s3 = new AWS.S3();


// s3 - Upload
exports.imageUpload = function(images,cb){
    var bucketName = 'sbikee';
    var imageList = [];
    var keyList = [];
    console.log('images ' , images);
    if(typeof cb != "function"){
        cb = function () {};
    }
    if(images != "undefined" && images != null){
        if(typeof images =="object"){
            if(images.length>0){
                async.forEach(Object.keys(images), function (item, callback){
                    var imageFile = images[item].path;
                    var thumbnail = pathUtil.dirname(imageFile)+"/thum_"+images[item].name;
                    var extname = images[item].extension;
                    var now = new Date(); // 날짜를 이용한 파일 이름 생성
                    var filename = ""+now.getHours() + now.getMinutes() + now.getSeconds() + Math.floor(Math.random()*1000) +"."+extname;
                    var contentType = images[item].mimetype // TODO : 파일에 따라서 컨텐츠 타입 설정
                    keyList.push(filename);
                    easyimg.thumbnail({
                        src:imageFile,
                        dst:thumbnail,
                        width:200
                    }).then(function(image){
                        /*console.log('thumbnail created : ', image);*/
                        var detail_readStream = fs.createReadStream(imageFile);
                        var mini_readStream = fs.createReadStream(image.path);
                        var detail_itemKey = 'bikes/detail_' +filename;
                        var mini_itemKey = 'bikes/mini_' + filename;
                        var params = [{
                            Bucket: bucketName,  // 필수
                            Key: detail_itemKey,			// 필수
                            ACL: 'public-read',
                            Body: detail_readStream,
                            ContentType: contentType
                        },{
                            Bucket: bucketName,  // 필수
                            Key: mini_itemKey,			// 필수
                            ACL: 'public-read',
                            Body: mini_readStream,
                            ContentType: contentType
                        }];
                        /*console.log('params ' , params);*/
                        imageList.push(params);
                        callback(); // tell async that the iterator has completed
                        /**/
                    }, function(err) {
                        console.error('Thumbanil Create Error', err);
                        cb(err);
                    });
                }, function(err) {
                    console.log('iterating done');
                    if(err){
                        cb(err);
                    }
                    for(var i=0;i<imageList.length;i++){
                        console.log(imageList[i].length);
                        for(var j=0;j<imageList[i].length;j++){
                            console.log('imageList['+i+"]"+"["+j+"]")
                            var Key = imageList[i][j].Key;
                            s3.putObject(imageList[i][j], function (err, data) {
                                if (err) {
                                    console.error('S3 PutObject Error', err);
                                    cb(err);
                                }
                            });
                        }
                    }
                    cb(null,keyList,s3.endpoint.href);
                });
            }
        }
    }
}