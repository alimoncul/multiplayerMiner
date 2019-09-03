var express = require("express");
var app = express();
var AppServer = require("http").Server(app);

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/client/index.html");
});

app.use("/client", express.static(__dirname + "/client"));
AppServer.listen(2000);

var gameInstance = {
    map: generateMap()
};

function updateMap(currentMap) {
    tempArr = [];
    for (let i = 0; i < currentMap.length; i++) {
        tempArr.push(currentMap[i]);
    }
    while (tempArr.filter(x => x == 1).length <= 20) {
        tempArr[Math.floor(Math.random() * 400)] = 1;
    }
    return currentMap;
}

function generateMap() {
    let gameMap = [];
    let arrRet = [];
    let range = 0;
    for (let i = 0; i < 400; i++) {
        gameMap.push(0);
    }
    while (gameMap.filter(x => x == 1).length <= 20) {
        gameMap[Math.floor(Math.random() * 400)] = 1;
    }
    for (let b = 0; b < 20; b++) {
        arrRet.push(gameMap.slice(range, range + 20));
        range += 20;
    }
    return arrRet;
}
var playerList = {};
var socketList = {};
var Player = function(id) {
    var self = {
        x: 400,
        y: 400,
        id: id,
        points: 0,
        number: "" + Math.floor(10 * Math.random()),
        right: false,
        left: false,
        up: false,
        down: false,
        speed: 5
    };
    self.mining = function(CurrentMap) {
        if (CurrentMap[Math.floor(self.x / 40)][Math.floor(self.y / 40)] == 1) {
            self.points += 1;
            CurrentMap[self.x / 40][self.y / 40] = 0;
            let updatedMap = updateMap(CurrentMap);
        }
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
        socket.emit("map", gameInstance.map);
    }
}, 1000 / 25);
