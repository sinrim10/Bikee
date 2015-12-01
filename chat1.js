/**
 * Created by Administrator on 2015-11-13.
 */

// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 8080;

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;
var nsp = io.of('/my-namespace');

nsp.on('connection', function (socket) {
    var addedUser = false;
     console.log('연결 되었습니다');
    /*console.log(' socket ' , socket)*/
    // when the client emits 'new message', this listens and executes
    var roomid;
    socket.on("join:room",function(room){
        roomid = room;
        console.log('roomid ' ,roomid);
        socket.join(roomid);
        console.log('ROOM LIST', socket.adapter.rooms);
        console.log('ROOM LIST2',Object.keys(socket.adapter.rooms[roomid]).length);
    })
    socket.on('new message', function (test,data) {
        // we tell the client to execute 'new message'
        console.log('data ' , data);
        console.log('roomid ' , roomid);
        socket.in(roomid).emit('new message',{
            username: roomid,
            message: data
        });
        /*socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
        });*/
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function (username) {
        // we store the username in the socket session for this client
        socket.username = username;
        console.log('socket.username ' , socket.username);
        var clinents = Object.keys(nsp.adapter.rooms[roomid]).length;
        console.log('roomid1 ' , roomid);
        io.nsps['/my-namespace'].in(roomid).emit('login', {
            numUsers: clinents
        });
        /*io.sockets.in(room_id).emit('msgAlert',data);//자신포함 전체 룸안의 유저*/
        //socket.broadcast.to(room_id).emit('msgAlert',data); //자신 제외 룸안의 유저
        //socket.in(room_id).emit('msgAlert',data);  //broadcast 동일하게 가능 자신 제외 룸안의 유저
        // echo globally (all clients) that a person has connected
        socket.broadcast.to(roomid).emit('user joined', {
            username: socket.username,
            numUsers: clinents
        });//자신 제외 룸안의 유저
        /*io.nsps['/my-namespace'].broadcast.to(roomid).emit('user joined', {
            username: socket.username,
            numUsers: clinents
        });*/
        /*socket.emit('login', {
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });*/
    });

    socket.on('send:message', function(roomid,msg) {
        socket.in(roomid).emit('send:message', msg);
    });
    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', function () {
        socket.broadcast.to(roomid).emit('typing', {
            username: socket.username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', function () {
        socket.broadcast.to(roomid).emit('stop typing', {
            username: socket.username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        // remove the username from global usernames list
        console.log('dissconnection ');
        console.log('leave ' , roomid);
        socket.leave(roomid)
        console.log(socket.adapter.rooms[roomid])
        if(roomid){
            if(socket.adapter.rooms[roomid]){
                var clinents = Object.keys(socket.adapter.rooms[roomid]).length;
                socket.broadcast.to(roomid).emit('user left', {
                    username: socket.username,
                    numUsers: clinents
                });
            }
        }
        /*var clinents = Object.keys(nsp.adapter.rooms[roomid]).length;*/
            // echo globally that this client has left


    });
});
