// Module Imports
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const basicAuth = require('express-basic-auth');
var fileUpload = require('express-fileupload');
const socketio = require('socket.io');
const http = require('http');
const { removeUser, getUser, getUsersInRoom, createRoom } = require('./routes/chat');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const startTime = new Date();

app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(express.json());
app.use(morgan('dev'));
app.use(fileUpload({
    useTempFiles: true
}));

//MongoDB Connection
const uri = process.env.ATLAS_URI;
mongoose.connect(uri, {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true})
    .then()
    .catch(err => console.log('Error:' + err));
const connection = mongoose.connection;
connection.once('open', () => {
    console.log('MongoDB connection established successfully');
})

// Server Status
app.route('/').get((req,res) => {
    res.json("Server started successfully on " + startTime);
})

// Route Authentication
app.use(basicAuth({
    users: { 'admin': 'admin' }
}));

// User router
const usersRouter = require('./routes/user');

app.use('/user',usersRouter);

// Socket IO Connection
const server = http.createServer(app);
const io = socketio(server, { origins: ["http://localhost:3000", "https://relaxed-lamarr-bc6151.netlify.app"]});

io.on('connection', (socket) => {
    console.log("New connection = ",socket.id);

    socket.on('join', ({ name, chatName, room }, callback) => {
        // Create room for new connection
        createRoom({id: socket.id, name, chatName, room});

        socket.emit('message', {user: 'admin', text: `${name}, welcome to the room ${room}`});
        socket.broadcast.to(room).emit('message', { user: 'admin', text: `${name}, has joined the room!`});

        socket.join(room);

        io.to(room).emit('roomData', {room: room, users: getUsersInRoom(room)});

        callback("Success"); 
    })

    socket.on('sendMessage', ({ name, text, room }, callback) => {
        console.log(text);

        // const user = getUser(socket.id);

        io.to(room).emit('message', { user:name, text});

        callback("Message Sent");
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if(user){
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left!!`});
            io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
        }
        console.log("User has left");
    })
})

server.listen(port, () => {
    console.log('Server is running on port:', port);
})

// module.exports = io;