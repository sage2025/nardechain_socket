const express = require('express'); //no important statements since we are in the node and we import it via require
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const passport = require("passport");
const users = require("./routes/api/users");
const socketio = require('socket.io');
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

const PORT = process.env.PORT || 8000;  //5000 is for local to try it out
// const router = require('./router'); //since we created our router and router, we can require router
// const app = require('express')();
// const http = require('http').Server(app);
// const io = require('socket.io')(http);

const app = express();

// app.use(router);
var corsOptions = {
    origin: "http://localhost:3000",
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
const io = socketio(server);  //this is an instance of the socketio

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
    socket.on('join', ({name, room}, callback) => {
        const { user, error } = addUser({ id: socket.id, name, room}); //add user function can only return 2 things a user with error property or user property
        
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

        User.findOne({ account: account })
            .then(user => {
            })
            .catch(error => {
                const user = new User({
                    name: "a@a.a",
                    email: "a@a.a",
                    account: account
                });
                user.save();
            })
        // io.to('nardechain').emit('create_game', products);
        callback();
    })

    socket.on('create_game_room', (products, callback) => {
        Gameroom.find({}).then(rooms => {
            rooms.push(products);
            io.to('nardechain').emit('create_game', rooms);
            // Gameroom.close();
        })

        const newGameroom = new Gameroom({
            playerA: products.playerA,
            playerB: products.playerB,
            ratingA: products.ratingA,
            ratingB: products.ratingB,
            length: products.length,
            clock: products.clock,
            stake: products.stake,
            view: products.view,
            roomID: products.roomID
        })
        newGameroom.save()
            .then(user => console.log(user))
            .catch(err => console.log(err));
        callback();
    })

    socket.on('join_game_room', (roomID, callback) => {
        Gameroom.findOne({ roomID : roomID }).then((product) => {
            product.playerB = 'drcyber';
            product.ratingB = 1;
            product.view = 'view';
            product.save();
        })
        Gameroom.find({}).then(rooms => {
            rooms[roomID].playerB = 'drcyber';
            rooms[roomID].ratingB = 1;
            rooms[roomID].view = 'view';
            io.to('nardechain').emit('create_game', rooms);
        })
    })

    //gets an event from the front end, frontend emits the msg, backends receives it
    socket.on('sendMessage', (message, callback) =>{
        const user = getUser(socket.id); //we havve access to socket from above
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

    /* gameplay */ 

})

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
