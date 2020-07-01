const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const basicAuth = require('express-basic-auth');
var fileUpload = require('express-fileupload');
const socketio = require('socket.io');
const http = require('http');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./routes/chat');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const startTime = new Date();

app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(express.json());
app.use(morgan('dev'));
app.use(basicAuth({
    users: { 'admin': 'admin' }
}));
app.use(fileUpload({
    useTempFiles: true
}));

const uri = process.env.ATLAS_URI;
mongoose.connect(uri, {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true})
    .then()
    .catch(err => console.log('Error:' + err));
const connection = mongoose.connection;
connection.once('open', () => {
    console.log('MongoDB connection established successfully');
})

const usersRouter = require('./routes/user');

app.use('/user',usersRouter);

app.route('/').get((req,res) => {
    res.json("Server started successfully on " + startTime);
})

const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {
    console.log("New connection = ",socket.id);

    socket.on('join', ({ name, room }, callback) => {
        console.log(name, room);
        const { error, user } = addUser({ id: socket.id, name, room });

        console.log(user);

        if(error) return callback(error);

        socket.emit('message', {user: 'admin', text: `${user.name}, welcome to the room ${user.room}`});
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name}, has joined the room!`});

        socket.join(user.room);

        io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});

        callback("Success"); 

        // if(true){
        //     callback({error: 'error'});
        // }
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        console.log(user);

        io.to(user.room).emit('message', { user:user.name, text: message});

        callback();
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