
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var LocalStrategy = require('passport-local').Strategy;
var User = mongoose.model('Users');

/**
 * Expose
 */

module.exports = new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  function(email, password, done) {
    var options = {
      criteria: { email: email },
      select: 'name email hashed_password salt'
    };
      User.load(options, function (err, user) {
      if (err) return done(err)
      if (!user) {
        return done(null, false, { message: 'Email을 잘못 입력 하셨습니다.' });
      }
      if (!user.authenticate(password)) {
        return done(null, false, { message: 'Password를 잘못 입력 하셨습니다.' });
      }

      return done(null, user);
    });
  }
);
