
/**
 * Express 관련 설정.
 */

var express = require('express');
var session = require('express-session');
var compression = require('compression'); //압축모듈
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var csrf = require('csurf'); //csrf 토큰 모듈
var multer = require('multer');
var swig = require('swig');

var MongoStore  = require('connect-mongo')(session);
var flash = require('connect-flash');
var winston = require('winston');
var helpers = require('view-helpers');
var config = require('./config');
var pkg = require('../package.json');

var env = process.env.NODE_ENV || 'development';

/**
 * Expose
 */

module.exports = function (app, passport) {

  //압축모듈사용
  app.use(compression({
    threshold: 512
  }));

  app.use(express.static(appRoot + '/public'));

  //winston use
  var log;
  if (env !== 'development') {
    log = {
      stream: {
        write: function (message, encoding) {
          winston.info(message);
        }
      }
    };
  } else {
    log = 'dev';
  }

  app.use(morgan(log));


  /*app.engine('html', swig.renderFile);*/
  app.set('view engine', 'ejs');
  app.set('views', appRoot + '/app/views');

  // expose package.json to views
  app.use(function (req, res, next) {
    res.locals.pkg = pkg;
    res.locals.env = env;
    next();
  });

  // bodyParser should be above methodOverride
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(multer());
  app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      var method = req.body._method;
      delete req.body._method;
      console.log('methodOverride : ' , method)
      return method;
    }
  }));

  // 쿠키파서, 세션 사용
  /*app.use(cookieParser());
  app.use(cookieSession({ secret: pkg.name }));*/
  app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: pkg.name,
    store: new MongoStore({
      url: config.db
    })
  }));


  //passport session

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash()); //flash 사용
  app.use(helpers(pkg.name));
/*
  app.use(csrf()); // csrf 사용..
  //app.use(express.csrf())
  app.use(function (req, res, next) {
    res.cookie('XSRF-TOKEN', req.csrfToken());
    res.locals.csrftoken = req.csrfToken();
    next();
   });*/

};
