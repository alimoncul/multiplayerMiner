var express = require("express");
var app = express();
var AppServer = require("http").Server(app);

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/client/index.html");
});

app.use("/client", express.static(__dirname + "/client"));
AppServer.listen(2000);

function generateMap() {
    let gameMap = [];
    for (let i = 0; i < 400; i++) {
        gameMap.push(0);
    }
    console.log(gameMap);
    while (gameMap.filter(x => x == 1).length < 20) {
        gameMap[Math.floor(Math.random() * 400)] = 1;
    }
    console.log(gameMap);
    return gameMap;
}
var playerList = {};
var socketList = {};
var Player = function(id) {
    var self = {
        x: 400,
        y: 400,
        id: id,
        number: "" + Math.floor(10 * Math.random()),
        right: false,
        left: false,
        up: false,
        down: false,
        speed: 10
    };
    self.movement = function() {
        if (self.right) {
            self.x += self.speed;
        }
        if (self.left) {
            self.x -= self.speed;
        }
        if (self.up) {
            self.y -= self.speed;
        }
        if (self.down) {
            self.y += self.speed;
        }
    };
    return self;
};

var io = require("socket.io")(AppServer, {});
io.sockets.on("connection", function(socket) {
    socket.id = Math.random();
    socketList[socket.id] = socket;
    var player = Player(socket.id);
    playerList[socket.id] = player;

    //If a player disconnects we need to delete player from game canvas
    socket.on("disconnect", function() {
        delete socketList[socket.id];
        delete playerList[socket.id];
    });

    socket.on("mapUpdate", function() {
        var gameMap = generateMap();
    });

    socket.on("keyPressed", function(data) {
        if (data.inputId === "up") {
            player.up = data.state;
        } else if (data.inputId === "down") {
            player.down = data.state;
        } else if (data.inputId === "right") {
            player.right = data.state;
        } else if (data.inputId === "left") {
            player.left = data.state;
        }
    });
});

setInterval(function() {
    var package = [];
    for (var i in playerList) {
        var player = playerList[i];
        player.movement();
        package.push({ x: player.x, y: player.y, number: player.number });
    }
    for (var i in socketList) {
        var socket = socketList[i];
        socket.emit("newPositions", package);
    }
}, 1000 / 25);
