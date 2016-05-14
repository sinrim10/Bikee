var users = require('../app/controllers/users');
var bikes = require('../app/controllers/bikes');
var reserves = require('../app/controllers/reserves');
var sms = require('../app/controllers/sms');
var inquires = require('../app/controllers/inquires');
var credits = require('../app/controllers/credits');
var comments = require('../app/controllers/comments');
var devices = require('../app/controllers/gcm');
var auth = require('./middlewares/authorization');
var sendbird = require('../app/controllers/sendbird');
var payment = require('../app/controllers/payment');
var mongoose = require('mongoose');
var validate = require('validate.js');
var upload = require('../config/upload');
/**
 * Route middlewares
 */

var bikeAuth = [auth.requiresLogin, auth.bike.hasAuthorization];
var userAuth = [auth.requiresLogin, auth.user.hasAuthorization];
var reserveAuth = [auth.requiresLogin, auth.reserve.hasAuthorization];
var reserveAuth1 = [auth.requiresLogin, auth.reserve.hasAuthorization1];
var commentAuth = [auth.requiresLogin, auth.comment.hasAuthorization];

/**
 * Expose routes
 */

module.exports = function (app, passport) {
  app.all("*",function(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', "POST, GET, DELETE, PUT,OPTIONS");
    res.header('Access-Control-Max-Age',  3600);
    res.header('Access-Control-Allow-Headers',  "Origin,Accept,X-Requested-With,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization");
    next();
  });

  /*
  * 사용자 관련
  * */
  app.get('/',function(req,res,err){
    console.log('req.user ' , req.user);
    res.render('index', { title: 'Bikee' ,user:req.user});
  })
  app.get('/login', users.login);
  app.get('/signup', users.signup);
  app.get('/loginfail',users.loginfail);
  app.get('/signin', users.signin);
  app.get('/users',users.list);
  app.get('/profile',auth.requiresLogin, users.show);
  app.post('/logout', users.logout);
  app.post('/users',upload.array("files",1), users.create);
  //app.post('/users', users.create);

  //app.post('/users/edit',auth.requiresLogin,users.edit); //아이폰에서만 사용
  app.put('/users',auth.requiresLogin,users.edit);
  app.post('/users/check',users.emailCheck)
  app.get('/users/:userId',users.profile) //사용자 정보조회
  app.post('/users/session', function(req, res, next) {
    req.session.lastSeen = 0;

    passport.authenticate('local', function(err, user, msg, statusCode) {
      if ( ! user ) {
          return res.json({code:401,success:false,result:[],msg:msg.message})
      }
      req.logIn(user, function(err) {
        if ( err ) {
          res.json({code:401,success:false,result:[],msg:'Session Write Error'})
          return;
        }
        next();
      });
    })(req);
  }, function(req, res) {

    res.json({code:'200',success:true, msg:"로그인 완료",result:[]});
  });
  app.post('/users/facebook/check/:id',users.facebookCheck);
  /*app.delete('/users/facebook/:facebookId');
  app.delete('/users/:userId');*/
  app.post('/users/facebook/session',function(req,res,next){
      req.session.lastSeen = 0;
      passport.authenticate('facebook-token', function (err, profile, msg, status) {
          if (err) {
              console.log('err ' ,err);
              return next(err);
          }
          if(msg){
              return res.json(msg);
          }
          if ( !profile ) {
              return res.json({code:401,success:false,result:[],msg:msg.message})
          }else{
              req.login(profile,function(err){
                  if ( err ) {
                      return res.json({code:401,success:false,result:[],msg:'Session Write Error'})
                  }
                  next();
              })
          }
      })(req);
  }, function(req, res) {
      return res.json({code:'200',success:true, msg:"페이스북 로그인 완료",result:[]});
  });
    //페이스북가입
  app.post('/users/facebook/token',function(req,res,next){
    var error = [];
    if(validate.isEmpty(req.body.access_token)){
      error.push({"error":"access_token empty"});
    }
    if(validate.isEmpty(req.body.phone)){
      error.push({"error":"phone empty"});
    }
    if(validate.isEmpty(req.body.email)){
      error.push({"error":"email empty"});
    }
    if(validate.isEmpty(req.body.username)){
      error.push({"error":"username empty"});
    }
    if(error.length>0){
      return res.json(error);
    } else {
      global.phone = req.body.phone;
      global.email = req.body.email;
      global.username = req.body.username;
    }
    passport.authenticate('facebook-token', function (err, profile, msg, status) {
      if (err) {
        next(err);
      }
      if(msg){
        return res.json(msg);
      }
      req.login(profile,function(err){
        if ( err ) {
          return res.json({code:401,success:false,result:[],msg:'Session Write Error'})
        }
          next();
      })
    })(req);
  }, function(req, res) {
    return res.json({code:'200',success:true, msg:"페이스북 가입 완료",result:[]});
  } );

 /*
 *  자전거 관련
 * */
  app.get('/bikes',auth.requiresLogin,bikes.myList);//보유자전거조회
  app.get('/bikes/:bikeId',bikes.detail);//자전거상세조회
  app.get('/bikes/list/:lon/:lat/:lastindex',bikes.list);//전체자전거조회
  app.get('/bikes/map/:lon/:lat',bikes.map); // 맵 조회

  app.post('/bikes', auth.requiresLogin, upload.array("files",7), bikes.create);//보유자전거등록
  //app.post('/bikes', auth.requiresLogin, bikes.create);//보유자전거등록
  app.post('/bikes/smartlock/:bikeId',bikeAuth,bikes.addLock);//본인 자전거에 자물쇠 정보 추가.
  //app.post('/bikes/edit/:bikeId',bikeAuth,bikes.edit); //보유자전거수정 아이폰사용
  //app.post('/bikes/del/:bikeId',bikeAuth,bikes.delete);//보유자전거삭제 아이폰사용
  //app.post('/bikes/:bikeId/active',bikeAuth,bikes.active); //보유자전거 활성화/비활성화 아이폰사용

  app.put('/bikes/:bikeId',bikeAuth,bikes.edit); //보유자전거수정
  app.put('/bikes/:bikeId/active',bikeAuth,bikes.active); //보유자전거 활성화/비활성화

  app.delete('/bikes/:bikeId',bikeAuth,bikes.delete);//보유자전거삭제




  //app.get('/users/:userId', users.show);
  app.get('/auth/kakao', passport.authenticate('kakao',{
    failureRedirect: '#!/login'
  }), users.signin);

  app.get('/oauth', passport.authenticate('kakao', {
    failureRedirect: '#!/login'
  }), users.authCallback);
  app.get('/auth/facebook',//페이스북 인증
    passport.authenticate('facebook', {
      scope: [ 'email', 'user_about_me','user_friends'],
      failureRedirect: '/login'
    }), users.signin);
  app.get('/auth/facebook/callback',//페이스북 인증시 호출
    passport.authenticate('facebook', {
      failureRedirect: '/login'
    }), users.authCallback);

  app.param('userId', users.load);//로그인중인 사용자 ID
  //app.param('bikeId',bikes.load);

  /*
  * 후기
  * */
  app.get('/comments',auth.requiresLogin,comments.show); //내가 작성한 평가보기..
  app.get('/comments/me',auth.requiresLogin,comments.myshow); //나에게 작성된 평가보기..
  app.get('/comments/:bikeId',comments.bike);//자전거후기보기
  app.get('/authfail',comments.fail); //후기작성 실패
  app.post('/comments/:bikeId',commentAuth,comments.create);//자전거후기작성


  /*
  * 고객문의
  * */
  app.post('/inquiry',auth.requiresLogin,inquires.create); //고객문의등록

  /*
  * 예약
  * */
  app.get('/reserves/lister',auth.requiresLogin, reserves.show);//lister 예약한목록보기
  /*app.get('/reserves/:reserveId',auth.requiresLogin,reserves.show);//예약상세조회*/
  app.get('/reserves/renter',auth.requiresLogin, reserves.showrent);//renter 예약목록보기
  app.get('/reserves/bike/:bikeId',reserves.index );//자전거 예약조회
  app.post('/reserves/bike/:bikeId',auth.requiresLogin,reserves.create);//예약요청
  app.put('/reserves/:reserveId/bike/:bikeId',auth.requiresLogin,reserves.status);//예약상태변경

  //app.post('/reserves/:bikeId/:reserveId',reserveAuth,reserves.status);//예약상태변경 아이폰만

  /*
  * gcm
  * */
  app.post('/devices',auth.requiresLogin,devices.registerDevice);
  //app.put('/devices/:deviceId',auth.requiresLogin,devices.editStatus);
  /*
  * sms
  * */
  app.post('/sms/auth',sms.authsms);
  app.post('/sms/check/:authid',sms.authcheck);

  /*app.get('/sendbird/:channel_url',auth.requiresLogin,sendbird.channel);*/
  app.get('/api/sendbird/:channel_url',auth.requiresLogin, sendbird.channel);
  app.post('/api/sendbird',auth.requiresLogin,sendbird.create);
  app.post('/api/sendbird/reserves',auth.requiresLogin, reserves.channel)
  app.get('/api',function(req,res){
      return res.status(200).json({});
  });

  app.get('/api/credits/customers',auth.requiresLogin,credits.index);
  app.get('/api/credits/token',auth.requiresLogin,credits.token);
  app.post('/api/credits/customers',auth.requiresLogin,credits.insert);

  app.post('/api/credits/cancel',auth.requiresLogin,credits.cancel);//결제 취소
  app.post('/api/credits/customers/:creditid',auth.requiresLogin,credits.payment);
  app.delete('/api/credits/customers/:creditid',auth.requiresLogin,credits.delete);

  app.get('/api/payment/lister',auth.requiresLogin,payment.lister);
  app.get('/api/payment/refund',auth.requiresLogin,payment.refund);
  app.get('/api/payment/renter',auth.requiresLogin,payment.renter);
  app.post('/api/payment/refund',auth.requiresLogin,payment.refund_state);

  app.post('/forgot',users.forgot);
  app.get('/forgot',function(req,res,next){
    res.render('forgot');
  });
  app.get('/reset/:token',users.resetGet);
  app.post('/reset/:token',users.resetPost);
  /*app.delete('/api/credits/customers/:creditid',auth.requiresLogin,credits.delete);*/

  /**
   * Error handling
   */

  app.use(function (err, req, res, next) {
    // treat as 404
    if (err.message
      && (~err.message.indexOf('not found')
      || (~err.message.indexOf('Cast to ObjectId failed')))) {
      return next();//http://egloos.zum.com/opensea/v/5814426
    }
    console.error(err.stack);
    // error page
      return res.status(500).json({"code":500 , error:err.stack});
    /*res.status(500).render('500', { error: err.stack });*/
  });

  // assume 404 since no middleware responded
  app.use(function (req, res, next) {
    res.status(404).json({
      url: req.originalUrl,
      error: 'Not found'
    });
  });
}
