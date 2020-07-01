const io = require('../server');

io.on('connection', (socket) => {
    console.log("New connection");

    socket.on('join', ({ name, room }, callback) => {
        console.log(name, room);

        // if(true){
        //     callback({error: 'error'});
        // }
    })

    socket.on('disconnect', () => {
        console.log("User has left");
    })
})