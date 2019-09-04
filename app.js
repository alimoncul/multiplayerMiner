var express = require("express");
var app = express();
var AppServer = require("http").Server(app);

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/client/index.html");
});

app.use("/client", express.static(__dirname + "/client"));
AppServer.listen(2000);

var gameInstance = {
    map: generateMap(),
    updated: false
};

function convert2D(arr) {
    arrRet = [];
    let range = 0;
    for (let b = 0; b < 20; b++) {
        arrRet.push(arr.slice(range, range + 20));
        range += 20;
    }
    return arrRet;
}

function updateMap(currentMap) {
    tempArr = [];
    for (let i = 0; i < currentMap.length; i++) {
        for (let k = 0; k < currentMap[i].length; k++) {
            tempArr.push(currentMap[i][k]);
        }
    }
    while (tempArr.filter(x => x == 1).length <= 20) {
        tempArr[Math.floor(Math.random() * 400)] = 1;
    }
    return convert2D(tempArr);
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
var playerNames = [
    "Rhiven",
    "Brurin",
    "Larani",
    "Gwiviel",
    "Mirutha",
    "Uliaviel",
    "Ethaewyn",
    "Deania",
    "Briwyn",
    "Laron"
];
var playerList = {};
var socketList = {};
var Player = function(id) {
    var self = {
        x: 400,
        y: 400,
        id: id,
        point: 0,
        name: playerNames[Math.floor(10 * Math.random())],
        skin: 1,
        number: "" + Math.floor(10 * Math.random()),
        right: false,
        left: false,
        up: false,
        down: false,
        speed: 5
    };

    self.movement = function() {
        if (self.right && self.x < 760) {
            self.x += self.speed;
        }
        if (self.left && self.x > 0) {
            self.x -= self.speed;
        }
        if (self.up && self.y > 0) {
            self.y -= self.speed;
        }
        if (self.down && self.y < 760) {
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
        var socket = socketList[i];
        player.movement();
        if (
            gameInstance.map[Math.floor(player.y / 40)][
                Math.floor(player.x / 40)
            ] == 1 ||
            gameInstance.map[Math.ceil(player.y / 40)][
                Math.ceil(player.x / 40)
            ] == 1 ||
            gameInstance.map[Math.floor(player.y / 40)][
                Math.ceil(player.x / 40)
            ] == 1 ||
            gameInstance.map[Math.ceil(player.y / 40)][
                Math.floor(player.x / 40)
            ] == 1
        ) {
            gameInstance.map[Math.floor(player.y / 40)][
                Math.floor(player.x / 40)
            ] = 0;
            gameInstance.map[Math.ceil(player.y / 40)][
                Math.ceil(player.x / 40)
            ] = 0;
            gameInstance.map[Math.floor(player.y / 40)][
                Math.ceil(player.x / 40)
            ] = 0;
            gameInstance.map[Math.ceil(player.y / 40)][
                Math.floor(player.x / 40)
            ] = 0;
            player.point += 1;
            gameInstance.map = updateMap(gameInstance.map);
            socket.emit("updated", gameInstance.map);
        }
        package.push({
            x: player.x,
            y: player.y,
            number: player.number,
            name: player.name,
            skin: player.skin,
            point: player.point
        });
    }
    for (var i in socketList) {
        var socket = socketList[i];
        socket.emit("newPositions", package);
        socket.emit("map", gameInstance.map);
    }
}, 1000 / 25);
