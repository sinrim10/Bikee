
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var User = mongoose.model('Users');
var utils = require('../../lib/utils');
var request = require('request');
var https = require('https');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var MobileDetect = require('mobile-detect')
/**
 * Load
 */

exports.load = function (req, res, next, id) {
    var options = {
        criteria: { _id : id }
    };
    options.select = "name email images phone provider";
    User.load(options, function (err, user) {
        if (err) return next(err);
        if (!user) return next(new Error('Failed to load User ' + id));
        req.profile = user;
        next();
    });
};

/**
 * Create user
 */

exports.create = function (req, res,next) {
    var files = []
    if(req.files){
         files = req.files.length > 0 ? req.files : [];
    }

    var image = [];
    var data = req.body ? req.body : undefined;
    if(typeof data === "string"){
        data = JSON.parse(data);
    }

    var user = new User(data);
    files.forEach(function(file){
        image.push("/"+file.key);
    })
    user.image = { cdnUri : 'https://sharebike.s3.amazonaws.com', files : image };
    user.provider = 'local';
    user.save(function(err,result){
        if (err) {
            console.error(err);
            next(err);
            //return res.json({code:500,success:false,msg:"회원 가입 실패",err:err, stack:utils.errors(err.errors)});
            /*utils.errors(err.errors)*/
        }
        if(result){
            sendbird(result,function(flag){
                if(flag){
                    return res.json({code:200,success:true,msg:"회원 가입 성공",result:[],err:err});
                }else{
                    return res.json({code:400,success:false,msg:"회원 가입 실패",result:[],err:err});
                }
            })
            /*if(this.sendbird(result)){
                return res.json({code:200,success:true,msg:"회원 가입 성공",result:[],err:err});
            }else{
                return res.json({code:400,success:false,msg:"회원 가입 실패",result:[],err:err});
            }*/
            /*return res.json({code:200,success:true,msg:"회원 가입 성공",result:[],err:err});*/
            /*  req.logIn(user, function(err) {
             if (err) {
             req.flash('info', 'Sorry! We are not able to log you in!');
             res.json({code:500,success:false,msg:"Sorry! We are not able to log you in!",err:utils.errors(err.errors)})
             }
             return res.json({code:200,success:true,result:[],err:null,msg:"회원 가입 완료"});
             });*/
        }
    })
};

exports.list = function(req,res,next){
    var user = User.find({});
    user.select("email provider name facebook createdAt updatedAt");
    user.exec(function(err,user){
        if(err) {
            console.error(err);
            res.json({code:500 , success:false,result:user,msg:"사용자 정보보기 실패 했습니다.",err:err});
        }
        res.json({code:200 , success:true, result:user,err:err});
    });

}

/**
 *
 * 사용자 정보수정
 *
 * */
exports.edit = function(req,res,next){
    var options = {};
    var user = req.body;
    user.updatedAt =  new Date();
    var updates = { $set: user };
    options.criteria = {_id :  req.user.id};

    User.findOneAndUpdate(options.criteria,updates,{ runValidators: false },
        function(err,data){
            if(err) {
                console.error(err);
                return res.json({code:500,success:false, result:[] ,msg:"사용자 정보 수정 실패 했습니다.",err : err});
            }
            res.json({code:200,success:true,result:[],msg:"사용자정보 수정 완료되었습니다."});
        })
}
/**
 *  Show profile
 */


exports.show = function (req, res) {
    var options  = {criteria : {
        _id : req.user.id
    },select:"provider image email name facebook"};

    User.load(options,function(err,user){
        res.json({code:200 , success:true, result:[user],err:null,msg:""});
    });
};


exports.profile = function (req, res) {
    var userId = req.params.userId ? req.params.userId : undefined;
    var user = User.findOne({_id:userId});
    user.select("email provider name facebook createdAt updatedAt");
    user.exec(function(err,user){
        if(err) {
            console.error(err);
            res.json({code:500 , success:false,result:[user],msg:"사용자 정보보기 실패 했습니다.",err:err});
        }
        res.json({code:200 , success:true, result:[user],err:err});
    })
};
exports.signin = function (req, res) {};

/**
 * Auth callback
 */

exports.authCallback = function(req,res){
       res.json({})
};
exports.emailCheck = function(req,res,next){
    var email = req.body.email ? req.body.email : "";
    User.findOne({'email':email}).exec(function(err,user){
        if(err){
            next(err);
        }
        if(user){
            return res.json({success:false,err:null});
        }else{
            return res.json({success:true,err:null});
        }
    })
}
exports.facebookCheck = function(req,res){
    User.findOne({'facebook.id': req.params.id }).exec(function(err,user){
        if(err){
            return res.json({success:null,err:err.stack});
        }
        if(user){
             return res.json({success:true,err:null});
        }else{
            return res.json({success:false,err:null});
        }

    })
}
/**
 * Show login form
 */

exports.login = function (req, res) {
    res.render('pages/index', {
        title: 'Login',
        type:"login",
        message:""
    });
};

exports.loginfail = function(req,res,next){
    var passport = require('../../config/passport/local');
    res.json({code:400,msg:"로그인 실패",success:false})
}


/**email
 * Show sign up form
 */

exports.signup = function (req, res) {

    res.render('pages/index', {
        title: 'Sign up',
        type: 'signup',
        user: new User()
    });
};

/**
 * Logout
 */

exports.logout = function (req, res,next) {
    if(req.user){
        if(req.user.provider =="kakao"){
            //Load the request module
            //Lets configure and request
            request({
                url: 'https://kapi.kakao.com/v1/user/logout', //URL to hit
                method: 'POST',
                    headers: { //We can define headers too
                'Authorization': 'Bearer '+ req.user.authToken
            }
            }, function(error, response, body){
                if(error) {
                    console.log(error);
                    next(error);
                } else {
                    req.logout();
                    if(req.session){
                        req.session.destroy();
                    }
                    res.json({code:200,success:true,result:[],msg:"KAKAO 로그아웃 되었습니다."})
                }
            });
        }else{
            req.logout();
            if(req.session){
                req.session.destroy();
            }
            res.json({code:200,success:true,result:[],msg:"Local 로그아웃 되었습니다."})
        }
    }else{
        res.json({code:500,success:false,result:[],msg:"로그아웃 실패"})
    }

};
exports.forgot = function(req,res,next){
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            User.findOne({ email: req.body.email , provider:"local" }, function(err, user) {
                if (!user) {
                    /*req.flash('error', 'No account with that email address exists.');
                    return res.redirect('/forgot');*/
                    md = new MobileDetect(req.headers['user-agent']);
                    if(md.mobile()){
                        return res.json({code:200,success:true,msg:"No account with that email address exists."});
                    }else{
                        req.flash('error', 'No account with that email address exists.');
                        return res.redirect('/forgot')
                    }

                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function(err) {
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {
            //var smtpTransport = nodemailer.createTransport('smtps://bikeeserver%40gmail.com:@dltjdrb1@smtp.gmail.com');
            //var smtpTransport = nodemailer.createTransport('smtps://bikeeserver%40gmail.com:@dltjdrb1@smtp.gmail.com');
            var transport = nodemailer.createTransport(
                smtpTransport('smtps://sinrim10%40gmail.com:@dltjdrb12@smtp.gmail.com')
            );

            var mailOptions = {
                from: 'Fred Foo <foo@blurdybloop.com>',
                to: user.email,
                subject: 'Node.js Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'https://' + req.headers.host + '/reset/' + token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            transport.sendMail(mailOptions, function(err) {
                //req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                done(err, user);
            });
        }
    ], function(err,user) {
        if (err) return next(err);
        //res.redirect('/forgot');
        md = new MobileDetect(req.headers['user-agent']);
        if(md.mobile()){
            return res.json({code:200,success:true,msg:'An e-mail has been sent to ' + user.email + ' with further instructions.'});
        }else{
            req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
            res.redirect('/forgot');
        }

    });

}
exports.resetGet = function(req,res,next){
    User.findOne({provider:"local", resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if(err){
            return next(err);
        }
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            /*res.json({code:403,success:true,msg:"Password reset token is invalid or has expired."})*/
            return res.redirect('/');
        }
        res.render('reset', {
            user: req.user
        });
    });
}
exports.resetPost = function(req,res,next){
    async.waterfall([
        function(done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
                if (!user) {
                    req.flash('error', 'Password reset token is invalid or has expired.');
                    return res.redirect('back');
                }

                user.password = req.body.password;
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                user.save(function(err) {
                    req.logIn(user, function(err) {
                        done(err, user);
                    });
                });
            });
        },
        function(user, done) {

            var transport = nodemailer.createTransport(
                smtpTransport('smtps://sinrim10%40gmail.com:@dltjdrb12@smtp.gmail.com')
            );

            var mailOptions = {
                from: 'Fred Foo <foo@blurdybloop.com>',
                to: user.email,
                subject: 'Your password has been changed',
                text: 'Hello,\n\n' +
                'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
            };
            transport.sendMail(mailOptions, function(err) {
                req.flash('success', 'Success! Your password has been changed.');
                done(err);
            });
        }
    ], function(err) {
        res.redirect('/');
    });

}

exports.lastSeen = function (req,res){
    req.session.lastSeen = 0 ;
}


/**
 * Session
 */

exports.session = login;

/**
 * Login
 */


function login (req, res,next) {
    res.json({code:'200',success:true, msg:"로그인 완료",result:[]})
};
function sendbird (result,cb){
    var image = ""
    if(result.image.files.length ==0){
        image = "http://restapi.fs.ncloud.com/bikee-image/KakaoTalk_20160404_165333958.png";
    }else{
        image = result.image.cdnUri + result.image.files[0];
    }
    request({
        url: 'https://api.sendbird.com/user/create', //URL to hit
        method: 'POST',
        //Lets post the following key/values as form
        json: {
            "auth": "7acd8e4ef7d9fb462877c37223c9f4c0f1b9ee27",
            "id": result._id,
            "nickname": result.name,
            "image_url": image
        }
    }, function(error, response, body){
        if(error) {
            console.log(error);
            cb(false);
        } else {
            /*return res.json({code:200,success:true,result:[],err:null,msg:"회원 가입 완료"});*/
            cb(true)
        }
    });
};


exports.sendbird = sendbird;