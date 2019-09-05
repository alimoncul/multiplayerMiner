$("input[type=radio][name=playerRadio]").change(function() {
    selectSkin(this.value);
});
let socket = io();
let playerList = document.getElementById("players");
let dirt = new Image();
let diamond = new Image();
let playerHeads = [];
playerHeads[0] = new Image();
playerHeads[0].src = "client/img/players/head1.png";
playerHeads[1] = new Image();
playerHeads[1].src = "client/img/players/head2.png";
playerHeads[2] = new Image();
playerHeads[2].src = "client/img/players/head3.png";
playerHeads[3] = new Image();
playerHeads[3].src = "client/img/players/head4.png";
playerHeads[4] = new Image();
playerHeads[4].src = "client/img/players/head5.png";
dirt.src = "client/img/dirt.jpeg";
diamond.src = "client/img/diamond.jpg";
let game = document.getElementById("game").getContext("2d");
let gameBackground = document.getElementById("gameBackground").getContext("2d");

function selectSkin(selectedSkin) {
    socket.emit("skinChange", parseInt(selectedSkin, 10));
}

function draw(gameBackground, data) {
    let xPos = 0;
    let yPos = 0;
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
            if (data[i][j] == 0) {
                gameBackground.drawImage(dirt, xPos, yPos);
            } else {
                gameBackground.drawImage(diamond, xPos, yPos);
            }
            xPos += 40;
        }
        xPos = 0;
        yPos += 40;
    }
}

socket.on("newPositions", function(data) {
    game.clearRect(0, 0, 800, 800);
    game.font = "18pt Calibri";
    game.textAlign = "center";
    game.fillStyle = "#ffffff";
    playerList.value = "";
    for (let i = 0; i < data.length; i++) {
        playerList.value += data[i].name + " : " + data[i].point + "\n";
        game.drawImage(playerHeads[data[i].skin], data[i].x, data[i].y);
        game.fillText(data[i].name, data[i].x + 20, data[i].y + 55);
    }
});
socket.on("map", function(data) {
    draw(gameBackground, data);
});
socket.on("updated", function(data) {
    gameBackground.clearRect(0, 0, 800, 800);
    draw(gameBackground, data);
});
document.onkeydown = function(event) {
    //UpArrow
    if (event.keyCode === 38) {
        socket.emit("keyPressed", { inputId: "up", state: true });
    }
    //DownArrow
    else if (event.keyCode === 40) {
        socket.emit("keyPressed", { inputId: "down", state: true });
    }
    //RightArrow
    else if (event.keyCode === 39) {
        socket.emit("keyPressed", { inputId: "right", state: true });
    }
    //LeftArrow
    else if (event.keyCode === 37) {
        socket.emit("keyPressed", { inputId: "left", state: true });
    }
};

document.onkeyup = function(event) {
    //UpArrow
    if (event.keyCode === 38) {
        socket.emit("keyPressed", { inputId: "up", state: false });
    }
    //DownArrow
    else if (event.keyCode === 40) {
        socket.emit("keyPressed", { inputId: "down", state: false });
    }
    //RightArrow
    else if (event.keyCode === 39) {
        socket.emit("keyPressed", { inputId: "right", state: false });
    }
    //LeftArrow
    else if (event.keyCode === 37) {
        socket.emit("keyPressed", { inputId: "left", state: false });
    }
};
