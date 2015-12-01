
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var FacebookStrategy = require('passport-facebook').Strategy;
var User = mongoose.model('Users');

/**
 * Expose
 */

module.exports = new FacebookStrategy({
       profileFields: ['id', 'displayName', 'photos', 'email'],

    clientID:"",
    clientSecret: "",
    callbackURL: ""
  },
  function(accessToken, refreshToken, profile, done) {
    //console.log('facebook passport :', profile);
    console.log('facebook accessToken :', accessToken);
    var options = {
      criteria: { 'facebook.id': profile.id }
    };
    User.load(options, function (err, user) {
      if (err) return done(err);
      if (!user) {
        user = new User({
          name: profile.displayName,
          email: profile.emails[0].value,
          username: profile.username,
          provider: 'facebook',
          facebook: profile._json
        });
        user.save(function (err) {
          if (err) console.log(err);
          return done(err, user);
        });
      } else {
        return done(err, user);
      }
    });
  }
);
