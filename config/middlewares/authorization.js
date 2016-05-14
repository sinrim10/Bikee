var mongoose = require('mongoose');
var Bike = mongoose.model('Bikes');
var Reserve = mongoose.model('Reserves');
/**
 *  로그인 라우팅 미들웨어
 */

exports.requiresLogin = function (req, res, next) {
  console.log('req.user ',req.user);
  if (req.isAuthenticated()) {
    console.log('로그인 권한 획득')
    return next()
  } else{
    console.log('권한 실패');
    return res.json({code:"500",success:false,msg:"로그인 권한 실패",result:[]});
  }
  /*if (req.method == 'GET') req.session.returnTo = req.originalUrl
  res.redirect('/login')*/
}

/**
 *  사용자 관련 권한 체크
 */

exports.user = {
  hasAuthorization: function (req, res, next) {
    var userId = req.user.id;
    console.log('사용자 관련 권한 체크 ',req.user.id);
    if (userId != req.user.id) {
      req.flash('info', 'You are not authorized')
      //return res.redirect('/users/' + userId)
      return res.json({code:500,success:false,result:[],msg:"사용자 권한 체크에 실패 하였습니다"});
    }
    next()
  }
}

exports.reserve = {
  hasAuthorization: function(req,res,next){
    var bikeId = req.params.bikeId ? req.params.bikeId:undefined;

    Reserve.findOne({bike:bikeId })
        .select("lister")
        .exec(function(err,lister){
          if(err) {
            console.error(err);
            return res.json({code:500 , success:false,result:[],msg:"예약 정보 조회에 실패 하였습니다.",err:err});
          }
          if(lister){
            if(req.user.id == lister.lister){
              next();
            } else {
              console.log('변경 권한 없음.')
              return res.json({code:401,success:false,result:[],msg:"변경 할 수 있는 권한이 없습니다", err : err});
            }
          } else{
            return res.json({code:500 , success:false,result:[],msg:"예약 정보가 없습니다.",err:err});
          }

        })
  },
  hasAuthorization1: function(req,res,next){
    var bikeId = req.params.bikeId ? req.params.bikeId:undefined;

    Bike.findOne({_id:bikeId })
        .select("user")
        .exec(function(err,bike){
          if(err) {
            console.error("has1 error",err);
            return res.json({code:500 , success:false,result:[],msg:"자전거 정보 조회에 실패 하였습니다.",err:err});
          }
          if(bike){
            if(req.user.id == bike.user){
              return res.json({code:401,success:false,result:[],msg:"본인 자전거에 예약요청을 할 수 없습니다.", err : err});
            } else {
              next();
            }
          } else{
            return res.json({code:500 , success:false,result:[],msg:"자전거 정보가 없습니다.",err:err});
          }

        })
  }
}
/**
 *  자전거 수정 삭제 본인 권한 체크
 */

exports.bike = {
  hasAuthorization: function (req, res, next) {
    //현재 로그인중인 사용자와 자전거를 삭제/수정 할려는 사용자 체크.
    var bikeId = req.params.bikeId ? req.params.bikeId : undefined;
    Bike.load( bikeId ,function(err,data){
      if(err){
        console.error(err);
        return res.json({code: "500",success:false, result:[],msg: "자전거 조회 실패",err:err});
      }
      if(data) {
        if (data.user._id != req.user.id) {
          req.flash('info', 'You are not authorized')
          //return res.redirect('/bikes/' + req.bike.id)
          return res.json({code: "500",success:false,result:[], msg: "본인 자전거가 아닙니다.",err:err});
        } else {
          console.log('본인 자전거 인증 완료');
          return next();
        }
      }else{
        return res.json({code: "500",success:false,result:[], msg: "자전거 정보가 없습니다..",err:err});
      }
    });

  }
}
/**
 * 후기 작성 관련 권한 체크
 */

exports.comment = {
  hasAuthorization: function (req, res, next) {
    //작성중인 사람과 작성할려는 자전거 주인이 같으면 안된다.
    var bikeId = req.params.bikeId;
    Bike.findOne({_id:bikeId},function(err,data){
      if(err) next(err);
      if (req.user.id != data.user) {
        req.body.lister = data.user;
        next()
      } else {
        console.log('권한 획득 안됨..');
        req.flash('info', 'You are not authorized')
        return res.json({code:405,success:false ,result:[], msg :"본인자전거에 후기를 작성 할 수 없습니다.",err:err})
      }
    })
  }
}