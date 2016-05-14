
var fs = require('fs');
var join = require('path').join;
var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var config = require('./config/config');
var app = express();
var path = require('path');
var port = process.env.PORT || 8080;
var server = require('http').Server(app);
/*var io = require('socket.io')(server);
global.io = io;*/
global.appRoot = path.resolve(__dirname);
// Connect to mongodb
var connect = function () {
  var options = { server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } } };
  mongoose.connect(config.db, options);
};
connect();

mongoose.connection.on('error', console.log);
mongoose.connection.on('disconnected', connect);
app.use(express.static(path.join(__dirname, 'public')));
// Bootstrap models
fs.readdirSync(join(__dirname, 'app/models')).forEach(function (file) {
  if (~file.indexOf('.js')) require(join(__dirname, 'app/models', file));
});

// Bootstrap passport config
require('./config/passport')(passport);

// Bootstrap application settings
require('./config/express')(app, passport);

// Bootstrap routes
require('./config/routes')(app, passport);
/*io.sockets.on('connection', require('./config/socket'));*/
server.listen(port,function(){
  console.log('Express app started on port ' + port);
});

/**
 * Exposez
 */

module.exports = app;
