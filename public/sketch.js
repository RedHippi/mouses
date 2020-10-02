//check README.md for more information

/// <reference path="TSDef/p5.global-mode.d.ts" />

//create a socket connection
var socket;
var pointer;
var pointerAlter;
var isAlter;
var isDead;
//I send updates at the same rate as the server update
var UPDATE_TIME = 1000 / 10;

//setup is called when all the assets have been loaded
function preload() {
    //load the image and store it in pointer
    pointer = loadImage('assets/pointer.png');
    pointerAlter = loadImage('assets/pointerAlt.png');
}

function setup() {
    //create a canvas
    createCanvas(800, 600);
    //paint it white
    background(255, 255, 255);

    isAlter = false;
    isDead = false;

    //I create socket but I wait to assign all the functions before opening a connection
    socket = io({
        autoConnect: false
    });

    //detects a server connection 
    socket.on('connect', onConnect);
    //handles the messages from the server, the parameter is a string
    socket.on('message', onMessage);
    //handles the user action broadcast by the server, the parameter is an object
    socket.on('state', updateState);

    socket.on('kill', doIDie);

    socket.open();

    //every x time I update the server on my position
    setInterval(function () {
        socket.emit('clientUpdate', { x: mouseX, y: mouseY, im: isAlter, dead: isDead });
    }, UPDATE_TIME);
}

//this p5 function is called continuously 60 times per second by default
//we are not using it yet, we update the canvas only when we receive new updates, see below
function draw() {
}

//called by the server every 30 fps
function updateState(state) {

    //draw a white background
    background(255, 255, 255);

    //iterate through the players
    for (var playerId in state.players) {
        if (state.players.hasOwnProperty(playerId)) {

            //in this case I don't have to draw the pointer at my own position
            if (playerId != socket.id) {
                var playerState = state.players[playerId];
                if(!playerState.dead) {
                    //draw a pointer image for each player except for myself
                    if(playerState.im) {
                        image(pointerAlter, playerState.x, playerState.y);
                    } else {
                        image(pointer, playerState.x, playerState.y);
                    }
                }
            }
        }
    }

}

function doIDie(loc) {
    if( abs(loc.x - mouseX) < 5 && abs(loc.y - mouseY) < 5 && !isDead ) {
        isDead = true;
        setTimeout(function () {
            isDead = false;
        }, 5000);
    }
}

//connected to the server
function onConnect() {
    if (socket.id) {
        console.log("Connected to the server");
        socket.emit('newPlayer', { x: mouseX, y: mouseY, im: isAlter, dead: isDead });
    }
}

//a message from the server
function onMessage(msg) {
    if (socket.id) {
        console.log("Message from server: " + msg);
    }
}

function mousePressed() {
    if(!isDead) {
        if(mouseButton == LEFT) {
            if (socket.id) {
                socket.emit('killAttempt', {x: mouseX, y: mouseY});
            }
        }
        if(mouseButton == RIGHT) {
            if (socket.id) {
                isAlter = !isAlter;
            }
        }
    }
    
    //PANIC AAAAAAH
}