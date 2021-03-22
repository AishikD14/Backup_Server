// const User = require("../models/user.model");
const Room = require("../models/room.model");

const userArray = [];

const createRoom = ({id, name, chatName, room}) => {
    //check if room already made in cache
    const existingUser = userArray.find((user) => user.room === room);
    if(existingUser){
        console.log("Room already exists in cache");
        return 
    }

    const user = {id, room};
    userArray.push(user);

    const roomId = room;
    const message = [];
    const users = name + "|" + chatName;
    const type = "personal";
    const newRoom = new Room({roomId, users, type, message});

    //check if room already made in database
    Room.findOne({ roomId: roomId })
        .then(room => {
            if(!room){
                newRoom.save()
                    .then(() => console.log("Room added to database"))
                    .catch(err => console.log("Error: ", err));
            }
            else{
                console.log("Room already exists in database");
            }
        })
        .catch(err => console.log("Error: ", err));
    
}

const removeUser = (id) => {
    const index = userArray.findIndex((user) => user.id === id);

    if(index != -1){
        return userArray.splice(index, 1)[0];
    }
}

const getUser = (id) => {
    console.log(id);
    console.log(userArray);
    return userArray.find((user) => user.id === id);
}

const getUsersInRoom = (room) => userArray.find((user) => user.room === room);

module.exports ={ removeUser, getUser, getUsersInRoom, createRoom };