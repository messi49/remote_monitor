var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mqtt = require('mqtt')
var mqtt_client  = mqtt.connect('mqtt://localhost:1883')

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

mqtt_client.on('connect', function () {
  mqtt_client.subscribe('vehicle/#')
});

io.on('connection', function (socket) {
  socket.on('disconnect', function () {
    socket.broadcast.to(socket.roomName).send('leave remotePeer');
    delete socket.roomName;
  });

  socket.on('join room', function (roomName) {
    if (roomName != null) {
      socket.join(roomName);
      socket.roomName = roomName;
      socket.send('{"roomName": "' + roomName + '"}');
      console.log("roomName: "  + roomName);
      var roomMemberCount = io.sockets.adapter.rooms[roomName].length;
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
    try{
      // ROOM
      if (socket.roomName) {
        socket.broadcast.to(socket.roomName).send(message);
      }
      // REMOTE CMD
      var remote_cmd = JSON.parse(message)["remote_cmd"];
      if(remote_cmd != null) {
        console.log(remote_cmd);
        mqtt_client.publish('vehicle/' + remote_cmd["vehicle_id"] + "/remote_cmd", "TEST");
      }
    }
    catch (e) {
    }
  });

  mqtt_client.on('message', function (topic, message) {
    try {
      var split_topic = topic.split("/");
      if (socket.roomName != null && socket.roomName == split_topic[1]) {
        console.log(topic + ": " + message.toString())
        var send_topic_name = "";
        for (var i = 2; i < split_topic.length; i++) {
          send_topic_name += "/";
          send_topic_name += split_topic[i];
        }
        var msg = {};
        msg.vehicle_info = {};
        msg.vehicle_info.topic = send_topic_name;
        msg.vehicle_info.message = message.toString();
        socket.send(JSON.stringify(msg));
      }
      else {
        console.log("[NULL] " + topic + ": " + message.toString());
        console.log("roomName: " + socket.roomName);
      }
    }
    catch (e) {
      console.error("mqtt_pubscriber", e.message);
    }
  })
});
