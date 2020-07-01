// const User = require("../models/user.model");

const users = [];

const addUser = ({id, name, room}) => {
    name = name.trim().toLowerCase();
    room = room.trim().toLowerCase();

    const existingUser = users.find((user) => user.room === room && user.name === name);

    if(existingUser){
        return {error: "Username is taken"};
    }

    const user = {id, name, room};

    users.push(user);

    console.log(user);

    return {user};
}

const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id);

    if(index != -1){
        return users.splice(index, 1)[0];
    }
}

const getUser = (id) => {
    console.log(id);
    console.log(users);
    return users.find((user) => user.id === id);
}

const getUsersInRoom = (room) => users.find((user) => user.room === room);

module.exports ={ addUser, removeUser, getUser, getUsersInRoom };