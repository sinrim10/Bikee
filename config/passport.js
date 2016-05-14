
/**
 * Passport [ local , facebook ]
 */

var mongoose = require('mongoose');
var User = mongoose.model('Users');

var local = require('./passport/local');
var facebook = require('./passport/facebook');
var kakao = require('./passport/kakao');

/**
 * Exports
 */

module.exports = function (passport, config) {
  // 로그인 할경우 passport 인증
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  })
  // passport 인증후 페이지 이동시 호출.
  passport.deserializeUser(function(id, done) {
    User.load({ criteria: { _id: id } }, function (err, user) {
      done(err, user)
    })

  })

  // use these strategies
  passport.use(local);
  passport.use('facebook-token',facebook.Strategy);
  /*passport.use(kakao);*/
};
