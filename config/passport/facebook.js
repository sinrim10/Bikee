
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
/*var FacebookStrategy = require('passport-facebook').Strategy;*/
var FacebookTokenStrategy = require('passport-facebook-token');
var sendbird = require("../../app/controllers/users");
var User = mongoose.model('Users');
var config = require('../config');

/**
 * Expose
 */

module.exports.Strategy = new FacebookTokenStrategy({
      profileFields: ['id', 'displayName', 'photos', 'emails','link','name'],
      clientID: config.facebook.clientID,
      clientSecret: config.facebook.clientSecret
  },
  function(accessToken, refreshToken, profile, done) {
    var options = {
      criteria: { 'facebook.id': profile.id }
    };
      User.load(options, function (err, user) {
        if (err) return done(err);
        if (!user) {
          user = new User({
            name: global.username,
            email: global.email,
            phone: global.phone,
            provider: profile.provider,
            facebook: profile
          });
          user.save(function (err,result) {
            if (err) console.log(err);
              sendbird.sendbird(result,function(flag){
                  if(flag){
                      return done(err, result);
                  }else{
                      return res.json({code:400,success:false,msg:"회원 가입 실패",result:[],err:err});
                  }
              });
          });
        } else {
          return done(err, user);
        }
      });
  }
);
