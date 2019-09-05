let express = require("express");
let randomGen = require("random-name");
let app = express();
let AppServer = require("http").Server(app);

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/client/index.html");
});

app.use("/client", express.static(__dirname + "/client"));
AppServer.listen(2000, "0.0.0.0");

var gameInstance = {
    map: generateMap()
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

let playerList = {};
let socketList = {};
let Player = function(id) {
    var self = {
        x: 400,
        y: 400,
        id: id,
        point: 0,
        name: randomGen.first(),
        skin: 0,
        right: false,
        left: false,
        up: false,
        down: false,
        speed: 8
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

let io = require("socket.io")(AppServer, {});
io.sockets.on("connection", function(socket) {
    socket.id = Math.random();
    socketList[socket.id] = socket;
    let player = Player(socket.id);
    playerList[socket.id] = player;

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

    socket.on("skinChange", function(data) {
        player.skin = data;
    });
});

setInterval(function() {
    let package = [];
    for (var i in playerList) {
        let player = playerList[i];
        let socket = socketList[i];
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
            name: player.name,
            skin: player.skin,
            point: player.point
        });
    }
    for (var i in socketList) {
        let socket = socketList[i];
        socket.emit("newPositions", package);
        socket.emit("map", gameInstance.map);
    }
}, 1000 / 25);
