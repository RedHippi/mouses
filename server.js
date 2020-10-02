

//create a web application that uses the express frameworks and socket.io to communicate via http (the web protocol)
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

//the rate the server updates all the clients, 10fps
//setInterval works in milliseconds
var UPDATE_TIME = 1000 / 10;

//We want the server to keep track of the whole game state and the clients just to send updates
//in this case the game state are the coordinates of each player
var gameState = {
    players: {}
}

//when a client connects serve the static files in the public directory ie public/index.html
app.use(express.static('public'));

//when a client connects 
io.on('connection', function (socket) {
    //this appears in the terminal
    console.log('A user connected');

    //this is sent to the client upon connection
    socket.emit('message', 'Hello welcome!');

    /*
    wait for the client to send me the initial coordinates 
    and create a player object. Each socket has a unique id 
    which I use to keep track of the players
    eg. gameState.players.FT7fYM_bwVZgqXkgAAAB 
    is an object containing the x and y coordinates 
    */
    socket.on('newPlayer', function (obj) {
        console.log(obj);

        //object creation in javascript
        gameState.players[socket.id] = {
            x: 0,
            y: obj.y,
            im: obj.im,
            dead: obj.dead
        }

        //gameState.players is an object, not an array or list
        //to get the number of players we have to count the number of property names
        //Object.keys
        console.log("Creating player " + socket.id + " there are now " + Object.keys(gameState.players).length + " players");
    });

    //when a client disconnects I have to delete its player object
    //or I would end up with ghost players
    socket.on('disconnect', function () {
        console.log("User disconnected - destroying player " + socket.id);

        //delete the player object
        delete gameState.players[socket.id];

        console.log("There are now " + Object.keys(gameState.players).length + " players");

    });

    //when I receive an update from a client, update the game state
    socket.on('clientUpdate', function (obj) {
        if(socket.id != null && gameState.players[socket.id] != null) {
            gameState.players[socket.id].x = obj.x;
            gameState.players[socket.id].y = obj.y;
            gameState.players[socket.id].im = obj.im;
            gameState.players[socket.id].dead = obj.dead;
        }
    });

    socket.on('killAttempt', function (obj) {
        socket.broadcast.emit('kill', obj);
    });

    //setInterval calls the function at the given interval in time
    //the server sends the whole game state to all players
    setInterval(function () {
        io.sockets.emit('state', gameState);
    }, UPDATE_TIME);


});


//listen to the port 3000
http.listen(3000, function () {
    console.log('listening on *:3000');
});



