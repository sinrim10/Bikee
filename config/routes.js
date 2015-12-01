
/*!
 * Module dependencies.
 */

// Note: We can require users, articles and other cotrollers because we have
// set the NODE_PATH to be ./app/controllers (package.json # scripts # start)

var users = require('../app/controllers/users');
var bikes = require('../app/controllers/bikes');
var reserves = require('../app/controllers/reserves');
var sms = require('../app/controllers/sms');
var inquires = require('../app/controllers/inquires');
var credits = require('../app/controllers/credits');
var comments = require('../app/controllers/comments');
var devices = require('../app/controllers/gcm');
var auth = require('./middlewares/authorization');
var pays = require('../app/controllers/pay');
var chat = require("../app/controllers/chat");
var fileSystem = require('fs');

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
  app.use(function(req,res,next){

    console.log('헤더 정보 출력',req.headers);
    console.log('req.session ', req.session);
    res.header("Access-Control-Allow-Origin", "");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    if(!req.session.first){
      req.session.lastSeen = 0;
    }
    req.session.first = true;
    next();
  });
  // user routes
  app.get('/chat',function(req,res){
    res.render('chat');
  })
  app.get('/first',function(req,res){
    console.log('req.session.lastSeen' ,req.session)
      res.json({code:200,success:true,msg:"처리 완료",result:[]});
  })
  app.get('/kakao',function(req,res){
    console.log('test ' ,req.user);
    res.render('kakao')
  })
  app.get('/import',function(req,res){
    res.render('index');
  })
  app.get('/pay',function(req,res){
    var readStream = fileSystem.createReadStream(__dirname+"/index.html");
    readStream.pipe(res);
  })
  app.post('/paynext',pays.pay);
  app.get('/paynoti',function(req,res){
    console.log(req);
    res.render('paynoti')
  })

  app.post('/paynoti',function(req,res){//아임포트 결제시 호출이 아님...
    console.log(req);
    res.render('paynoti')
  })
  app.get('/profile',auth.requiresLogin, users.show);
  app.get('/login', users.login);
  app.get('/signup', users.signup);
  app.get('/loginfail',users.loginfail);
  app.get('/signin', users.signin);
  app.get('/logout', users.logout);
  app.post('/test',bikes.test);
  app.get('/users/:userId',users.profile) //사용자 정보조회
  app.post('/users', users.create);
  app.put('/users',auth.requiresLogin,users.edit);
  app.post('/bikes/users',auth.requiresLogin,bikes.create);//보유자전거등록
  app.post('/bikes/smartlock/:bikeId',bikeAuth,bikes.addLock);//본인 자전거에 자물쇠 정보 추가.
  app.get('/bikes/users',auth.requiresLogin,bikes.myList);//보유자전거조회
  app.put('/bikes/users/:bikeId',bikeAuth,bikes.edit); //보유자전거수정
  app.put('/bikes/active/:bikeId',bikeAuth,bikes.active); //보유자전거 활성화/비활성화
  app.delete('/bikes/users/:bikeId',bikeAuth,bikes.delete);//보유자전거삭제
  app.get('/bikes/list/:lon/:lat/:lastindex',bikes.index);//전체자전거조회
  app.get('/bikes/all/:lon/:lat',bikes.all)
  app.get('/bikes/:bikeId/detail',bikes.detail);//자전거상세조회

  app.post('/users/session', function(req, res, next) {
    req.session.lastSeen = 0;
    passport.authenticate('local', function(err, user, msg, statusCode) {
      if ( ! user ) {
        console.log('msg:msg.message ', msg.message);
        res.status(401).json({code:401,success:false,result:[],msg:msg.message})
        return;
      }
      req.logIn(user, function(err) {
        if ( err ) {
          res.status(401).json({code:401,success:false,result:[],msg:'Session Write Error'})
          return;
        }
        next();
      });
    })(req);
  }, function(req, res) {
    res.json({code:'200',success:true, msg:"로그인 완료",result:[]});
  });

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


  app.get('/comments',auth.requiresLogin,comments.show); //내가 작성한 평가보기..
  app.get('/comments/me',auth.requiresLogin,comments.myshow); //나에게 작성된 평가보기..
  app.get('/authfail',comments.fail); //후기작성 실패
  app.post('/comments/:bikeId',commentAuth,comments.create);//자전거후기작성
  app.get('/comments/:bikeId',comments.bike);//자전거후기보기
  app.post('/inquiry',auth.requiresLogin,inquires.create); //고객문의등록
  app.get('/reserves/me',auth.requiresLogin,reserves.showrent);
  app.post('/reserves/:bikeId',reserveAuth1,reserves.create);//예약요청
  app.get('/reserves/:bikeId',reserves.index);//예약요청
  app.get('/reserves',auth.requiresLogin,reserves.show);//예약목록보기

  app.put('/reserves/:bikeId/:reserveId',reserveAuth,reserves.status);//예약상태변경
  app.post('/devices',auth.requiresLogin,devices.registerDevice);
  app.put('/devices/:deviceId',auth.requiresLogin,devices.editStatus);

  app.post('/sms/auth',sms.authsms);
  app.post('/sms/check/:authid',sms.authcheck);

  app.post('/chat/room',chat.create);
  app.get('/chat/room',chat.index);
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
    res.status(500).render('500', { error: err.stack });
  });

  // assume 404 since no middleware responded
  app.use(function (req, res, next) {
    res.status(404).json({
      url: req.originalUrl,
      error: 'Not found'
    });
  });
}
