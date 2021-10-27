const { isObject } = require('util');

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var users = [];
var ids = [];

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  io.emit('New user connected');
  socket.on('disconnect', function(){
    users.splice(users.indexOf(socket.username), 1);
    io.emit('user disconnected', socket.username, users);
    socket.broadcast.emit('user not writing');
  });
  
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    socket.broadcast.emit('chat message', socket.username + ': ' + msg);
    socket.broadcast.emit('user not writing');
  });
  
  socket.on('username validation', function(name){
    if(!users.includes(name)){
      users.push(name);
      ids.push(socket.id);
      socket.broadcast.emit('user connect', name);
      io.emit('new user entered', name, users);
      socket.username = name;
      socket.emit('user connect local', 'You have entered the chat');
      io.emit('User list', users);
    }
  });
  
  socket.on('private', function(data){
    var index = users.indexOf(data.to);
    var receiver = ids[index];
    socket.broadcast.to(receiver).emit('private',{from: socket.username, to: data.to, msg: data.msg});
  })
  
  socket.on('typing', function(){
    msg = socket.username + ' is typing...';
    socket.broadcast.emit('user writing', msg);
  });

  socket.on('not typing', function(){
    socket.broadcast.emit('user not writing');
  })
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
