const { isObject } = require('util');

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var users = []; //Names of the connected users
var ids = []; //Ids of the connected users

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  io.emit('New user connected');

  //When a user disconnects, it is removed from the list and an information message is displayed in the screen
  socket.on('disconnect', function(){
    users.splice(users.indexOf(socket.username), 1);
    ids.splice(ids.indexOf(socket.id), 1);
    io.emit('user disconnected', socket.username, users);
    socket.broadcast.emit('user not writing');
  });
  
  //Shows messages in the screen
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    socket.broadcast.emit('chat message', socket.username + ': ' + msg);
    socket.broadcast.emit('user not writing');
  });
  
  //When a new user connects, its name and id are added to the corresponding array and calls the corresponding method in index.html
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
  
  //Shows private messages in the screen
  socket.on('private', function(data){
    var index = users.indexOf(data.to);
    var receiver = ids[index];
    socket.broadcast.to(receiver).emit('private',{from: socket.username, to: data.to, msg: data.msg});
  })
  
  //Updates the label when a user is typing
  socket.on('typing', function(){
    msg = socket.username + ' is typing...';
    socket.broadcast.emit('user writing', msg);
  });

  //Updates the label when a user is not typing
  socket.on('not typing', function(){
    socket.broadcast.emit('user not writing');
  })
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
