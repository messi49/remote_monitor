var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/template/index.html');
});

app.get('/vehicle', function (req, res) {
  res.sendFile(__dirname + '/template/vehicle_window.html');
});

app.get('/operator', function (req, res) {
  res.sendFile(__dirname + '/template/operator_window.html');
});

io.on('connection', function (socket) {
  console.log('a user connected');
});

http.listen(9000, function () {
  console.log('listening on *:9000');
});


io.on('connection', function (socket) {
  socket.on('disconnect', function () {
    socket.broadcast.to(socket.roomName).send('leave remotePeer');
    delete socket.roomName;
  });

  socket.on('join room', function (roomName) {
    console.log('ROOM NAME');
    console.log(roomName);
    if (roomName != null) {
      socket.join(roomName);
      socket.roomName = roomName;
      socket.send('{"roomName": "' + roomName + '"}');
      var roomMemberCount = Object.keys(io.nsps['/'].adapter.rooms[roomName]).length;
      console.log("roomMemberCount = " + Object.keys(io.nsps['/'].adapter.rooms[roomName]));
      if (roomMemberCount === 2) {
        process.nextTick(function () {
          io.sockets.in(roomName).send('ready');
        });
      } else if (roomMemberCount > 2) {
        socket.send('over');
      }
    } else {
      socket.send('roomName error');
      return;
    }
  });

  socket.on('message', function (message) {
    if (socket.roomName) {
      socket.broadcast.to(socket.roomName).send(message);
    }
  });
});
