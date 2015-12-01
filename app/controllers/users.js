
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var User = mongoose.model('Users');
var utils = require('../../lib/utils');
var request = require('request');
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

exports.create = function (req, res) {
    var images = req.files.image
        ? [req.files.image]
        : undefined;
    var data = req.body ? req.body : undefined;
    if(typeof data == "string"){
        data = JSON.parse(data);
    }
    var user = new User(data);
    user.provider = 'local';
    user.uploadAndSave(images,function(err){
        if (err) {
            req.flash('info', 'Sorry! We are not able to log you in!');
            console.error(err);
            return res.json({code:500,success:false,msg:"회원 가입 실패",err:err, stack:utils.errors(err.errors)});
            /*utils.errors(err.errors)*/
        }
        return res.json({code:200,success:true,result:[],err:null,msg:"회원 가입 완료"});
    });
  /*  user.save(function (err) {
        console.log('error ', err);
        if (err) {
            req.flash('info', 'Sorry! We are not able to log you in!');
            return res.json({code:500,success:false,msg:"Sorry! We are not able to log you in!",err:utils.errors(err.errors)})
        }
        // manually login the user once successfully signed up
        req.logIn(user, function(err) {
            if (err) {
                req.flash('info', 'Sorry! We are not able to log you in!');
                res.json({code:500,success:false,msg:"Sorry! We are not able to log you in!",err:utils.errors(err.errors)})
            }
            return res.json({code:200,success:true,result:[],err:null,msg:"회원 가입 완료"});
        });
    });*/
};


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
    console.log('user id ' , req.user.id);
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
    console.log('user ',req.user.id);
    var options  = {criteria : {
        _id : req.user.id
    },select:"provider image email name"};

    User.load(options,function(err,user){
        console.log('user: ',user)
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
    console.log('req session ; ' , req.session);
    /*if(req.query){
        var token = req.query.code;
        console.log('req.query ' ,token);
        req.session.token = token;
    }*/
    res.json({session : req.session})
 /*   res.render('pages/index',{
        title:'추가 인증',
        type:"authinfo"
    });*/
};

/**
 * Show login form
 */

exports.login = function (req, res) {

    console.log('로그인화면호출');
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

exports.logout = function (req, res) {


    console.log('logout ', req.user);
    if(req.user){
        if(req.user.provider =="kakao"){
            //Load the request module

            console.log('req.user.authToken ' , req.user.authToken)
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
                } else {
                    console.log(response.statusCode, body);
                    req.logout();
                    req.session.destroy();
                    res.json({code:200,success:true,result:[],msg:"로그아웃 되었습니다."})
                }
            });
        }else{
            req.logout();
            req.session.destroy();
            res.json({code:200,success:true,result:[],msg:"로그아웃 되었습니다."})
        }
    }else{
        res.json({code:500,success:false,result:[],msg:"로그아웃 실패"})
    }

};
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
    /*passport.authenticate('local', function(err, user, info) {
        if (err) {
            return next(err); // will generate a 500 error
        }
        if (! user) {
            return res.json({ success : false, result : info.message});
        }
        console.log(' 세션 로그인');
        res.json({success: true , result:"로그인 완료"})
    })(req, res, next);*/

    res.json({code:'200',success:true, msg:"로그인 완료",result:[]})
    /*var redirectTo = req.session.returnTo ? req.session.returnTo : '/';
    delete req.session.returnTo;
    console.log(' 세션 로그인');
    res.json({code:'200', result:"로그인 완료"})*/
    //res.redirect(redirectTo);
};

exports.test = function(req,res){
    res.render('pages/index', {type:"show"});
}