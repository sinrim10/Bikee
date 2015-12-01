
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var KakaoStrategy = require('passport-kakao').Strategy;
var User = mongoose.model('Users');

/**
 * Expose
 */

module.exports = new KakaoStrategy({
      clientID: "",
      callbackURL: ""
    }, function(accessToken, refreshToken, profile, done){

      console.log('kakao1234 ' , profile);
      console.log('accessToken ' , accessToken);
      var options = {
        criteria: { 'kakao.id': profile.id }
      };
      User.load(options, function (err, user) {
        if (err) return done(err);
        if (!user) {
          user = new User({
            name: profile.username,
            email: profile.id+"@kakao.com",
            username: profile.username,
            provider: profile.provider,
            kakao: profile._json
          });
          user.save(function (err) {
            if (err) console.log(err);
            users.authToken = accessToken;
            console.log('accessToken ' ,accessToken);
            console.log('user1 ' , user)
            return done(err, user);
          });
        } else {
          user.authToken = accessToken;
          console.log('accessToken ' ,accessToken);
          console.log('user2 ' , user)
          return done(err, user);
        }
      });
    }
)