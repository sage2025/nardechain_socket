const express = require('express'); //no important statements since we are in the node and we import it via require
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const passport = require("passport");
const users = require("./routes/api/users");
const socketio = require('socket.io');
const fs = require('fs');
const https = require('https');
const http = require('http');
const cors = require('cors'); //we used cors since heroku is used for backend, netlify is used for frontend, we need to connect them
const session = require('express-session');
const key = require("./config/keys");
const Gameroom = require("./models/Gameroom");
const User = require("./models/User");

//we need cors in this file or else some of our requests(sockets) will be ignored and or  not accepted
//when we deploy the website sometimes it restricts the resources that are being sent

const { addUser, removeUser, getUser, getProducts, getUsersInRoom } = require ('./socket.js');
const { Mongoose } = require('mongoose');

const PORT = process.env.PORT || 80;  //5000 is for local to try it out
// const router = require('./router'); //since we created our router and router, we can require router
// const app = require('express')();
// const http = require('http').Server(app);
// const io = require('socket.io')(http);
const app = express();

// const privateKey = fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem', 'utf8');
// const certificate = fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/cert.pem', 'utf8');
// const ca = fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/chain.pem', 'utf8');

// const credentials = {
// 	key: privateKey,
// 	cert: certificate,
// 	ca: ca
// };
// app.use(router);
var corsOptions = {
    // origin: "http://localhost:3000",
    origin: "http://nardechain.io",
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
const server = http.createServer(app);
// const httpsServer = https.createServer(credentials, app);
const io = socketio(server);  //this is an instance of the socketio

// httpsServer.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
// var io = require('socket.io').listen(httpsServer);
// io.set('origins', "https://williamwehby.com.br");
// io.set('transports', ['websocket',
//     'flashsocket',
//     'htmlfile',
//     'xhr-polling',
//     'jsonp-polling',
//     'polling']);

//This part is for socket.io

/*The socket will be connected as a client side socket
    and we manage this socket that is just connected in here as well hence why we also have the disconnection in here.
    It is an instance of a socket that we use. 
  On Join
    When the socket reads the string join, it calls a call back function.
    The call back function's parameters is an object with name and room.
    We are access on the backend here for name& room
    Theres a callback in the socket.on event that triggers a response whenver the socket.on event is emmitted
 ERROR HANDELING
    user joined- passes data- do somelogic on backend- pass in a call back that socket.io has gave us 
    if there is an error we handle it with an alert on the front end
MESSAGES
    Admin generated ones are 'message'
    USer generated are 'sendMessage'
    
*/

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
        //emit to the room that the user belongs too, hence why we pass in user.room to get the users in that room
        io.to(room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
        callback();
    });

    socket.on('nardechain', ({room: room, account: account}, callback) => {
        socket.join(room);
        Gameroom.find({}).then(rooms => {
            io.to('nardechain').emit('create_game', rooms);
        })
        var username;
        User.findOne({ account: account })
            .then(user => {
                if(!user) {
                    const user = new User({
                        name: "a@a.a",
                        email: "a@a.a",
                        username: account.substring(2, 7),
                        account: account
                    });
                    user.save();
                } else {
                    username = user.username;
                }
            })
        User.find({}).then(users => {
            io.to('nardechain').emit('ranking', users);
        })
        callback('');
            // io.to('nardechain').emit('create_game', products);
    })

    socket.on('create_game_room', (products, callback) => {
        Gameroom.find({}).then(rooms => {
            rooms.push(products);
            io.to('nardechain').emit('create_game', rooms);
            // Gameroom.close();
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
        console.log(roomID)
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
        const user = getUser(socket.id); //we havve access to socket from above
        console.log(message, user)
        //when the user leaves we send a new message to roomData
        //we also send users since we need to know the new state of the users in the room
        io.to(user.room).emit('message', { user: user.name, text: message });
        callback();
    })

    //does not take any parameters since we are just unmounting here
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

    socket.on('finish_game_room', ({roomID : roomID, winner: winner, loser: loser, storeData : storeData}, callback) => {
        // socket.join(name);
        console.log(roomID)
        socket.join('nardechain');
        Gameroom.findOne({ roomID : roomID }).then(room => {
            room.finish = 'finished';
            room.winner = winner;
            room.loser = loser;
            room.storeData = storeData;
            room.save();
        })

        Gameroom.find({}).then( rooms=> {
            rooms[roomID].finish = 'finished';  
            rooms[roomID].winner = winner;
            rooms[roomID].loser = loser;
            rooms[roomID].storeData = storeData;
            io.to('nardechain').emit('create_game', rooms);
        })
    } )

    socket.on('rolldice', (states, callback) => {
        socket.broadcast.to('sage').emit('rolldice_fe', states);
        callback();
    })

    socket.on('dicemove', (states, callback) => {
        socket.broadcast.to('sage').emit('dicemove_fe', states);
        callback();
    })

    socket.on('undo', (states, callback) => {
        socket.broadcast.to('sage').emit('undo_fe', states);
        callback();
    })

    socket.on('ogamonista', ({room: room}, callback) => {
        socket.join(room);
        callback('');
    })
    
    socket.on('setstore', (states, callback) => {
        io.to('game').emit('getstore', states);
        console.log(states)
        callback();
    })

    /* gameplay */ 

})

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
