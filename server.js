const express = require('express'); 
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const passport = require("passport");
const users = require("./routes/api/users");
const socketio = require('socket.io');
const http = require('http');
const fs = require('fs');
const https = require('https');
const cors = require('cors'); // cors since heroku is used for backend, netlify is used for frontend, need to connect them
const session = require('express-session');
const key = require("./config/keys");
const Gameroom = require("./models/Gameroom");
const User = require("./models/User");

const { addUser, removeUser, getUser, getUsersInRoom } = require ('./socket.js');

const PORT = process.env.PORT || 443;  
// const router = require('./router'); 
// const app = require('express')();
// const http = require('http').Server(app);

const privateKey = fs.readFileSync('/etc/letsencrypt/live/gammonist.com/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/gammonist.com/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/gammonist.com/chain.pem', 'utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};

const app = express();

const server = http.createServer(app);
const httpsServer = https.createServer(credentials, app);
const io = socketio(httpsServer);  //this is an instance of the socketio

// app.use(router);
var corsOptions = {
    // origin: "http://nardechain.io",
    origin: "https://williamwehby.com.br",
    methods: "POST, GET, PUT, DELETE",
};
app.use(cors(corsOptions));
app.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true}));
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
      extended: true
    })
);
const db = key.mongoURI;

mongoose.connect(db, { useNewUrlParser: true })
    .then(() => { console.log("Mongo has been successfully connected") })
    .catch((err) => { console.log(err) });

app.use(passport.initialize());
require("./config/passport");

app.use("/api/users", users);

//usually its server.on('request(event name)', requestListener( a function))
io.on('connection', (socket) => {
    socket.on('join', ({nameA, nameB, room}, callback) => {
        const { user, error } = addUser({ id: socket.id, nameA, room}); //add user function can only return 2 things a user with error property or user property
        
        if(error) return callback(error); //error handeling
        //no errors
        //emit an event from the backend to the front end with a payload in {} part
        socket.emit('message', { user: 'admin', text: `${user.name}, welcome to the the room ${user.room}` }); // welcomes user to chat
        //broadcast sends a message to everyone besides that specific user
        socket.broadcast.to(room).emit('message', { user: 'admin', text: `${user.name}, has joined!`});//lets everyone know except user that they joined 
        // socket.emit('craete_game', "products");

        socket.join(room);
        //emit to the room that the user belongs too, hence why pass in user.room to get the users in that room
        io.to(room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
        callback();
    });

    socket.on('ogamonista', ({room: room}, callback) => {
        socket.join(room);
        callback('');
    })

    socket.on('create_game_room', (products, callback) => {
        Gameroom.find({}).then(rooms => {
            rooms.push(products);
            io.to('nardechain').emit('create_game', rooms);
        })

        const newGameroom = new Gameroom({
            player: products.player,
            account: products.account,
            stake: products.stake,
            length: products.length,
            clock: products.clock,
            join: products.join,
            roomID: products.roomID
        })
        newGameroom.save()
            .then(user => console.log(user))
            .catch(err => console.log(err));
        callback();
    })

    socket.on('join_game_room', ({ roomID: roomID,  account : account }, callback) => {
        Gameroom.findOne({ roomID : roomID }).then((product) => {
            product.join = 'joined';
            product.accountopp = account;
            product.save();
        })
        Gameroom.find({}).then(rooms => {
            rooms[roomID].join = 'joined';
            rooms[roomID].accountopp = account;
            io.to('nardechain').emit('create_game', rooms);
        })
        callback();
    })

    //gets an event from the front end, frontend emits the msg, backends receives it
    socket.on('sendMessage', (message, callback) =>{
        const user = getUser(socket.id); 
        console.log(message, user)
        //when the user leaves new message to roomData
        //send users since need to know the new state of the users in the room
        io.to(user.room).emit('message', { user: user.name, text: message });
        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id); //remove user when they disconnect
        //admin sends a message to users in the room that _ user has left
        if(user) {
            io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
            io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
        }
    })

    /* gameplay */ 
    //joinroom: when two players join each other and then start new game
    socket.on('start_game_room', (name, callback) => {
        socket.join(name);

        callback();
    } )

    socket.on('finish_game_room', ({roomID : roomID, winner: winner, loser: loser}, callback) => {
        // socket.join(name);
        socket.join('nardechain');
        Gameroom.findOne({ roomID : roomID }).then(room => {
            room.finish = 'finished';
            room.winner = winner;
            room.loser = loser;
            room.save();
        })

        Gameroom.find({}).then( rooms=> {
            rooms[roomID].finish = 'finished';  
            rooms[roomID].winner = winner;
            rooms[roomID].loser = loser;
            io.to('nardechain').emit('create_game', rooms);
        })
    } )

    socket.on('rolldice', (states, callback) => {
        io.to('sage').emit('rolldice_fe', states);
        callback();
    })

    socket.on('dicemove', (states, callback) => {
        io.to('sage').emit('dicemove_fe', states);
        callback();
    })

    socket.on('undo', (states, callback) => {
        io.to('sage').emit('undo_fe', states);
        callback();
    })

    socket.on('setstore', (states, callback) => {
        io.to('game').emit('getstore', states);
        console.log(states)
        callback();
    })

    socket.on('getstore', (states, callback) => {
        // io.to('sage').emit('undo_fe', states);
        callback();
    })

    /* gameplay */ 

})

httpsServer.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
