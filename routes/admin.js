const router = require('express').Router();
let Room = require('../models/room.model');

// get a list of all the rooms in db
router.route('/get_rooms').get((req,res) => {
    Room.find({}, 'roomId users type message')
        .then(rooms => {
            if(!rooms.length){
                res.status(204).json({"message" : "No room present"});
            }
            else{
                var response = [];
                rooms.map((room) => {
                    let messageNo = room.message.length;
                    response.push({
                        roomId: room.roomId,
                        users: room.users,
                        type: room.type,
                        messageNo: messageNo
                    });
                })
                res.json(response);
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

// delete room in db
router.route('/delete_room').post((req,res) => {
    Room.findOne({roomId: req.body.room})
        .then(room => {
            if(!room){
                res.status(204).json({"message" : "Room not present"});
            }
            else{
                Room.deleteOne({roomId: req.body.room})
                .then(() => {
                    res.json({"message" : "Room deleted"});
                })
                .catch(err => res.status(400).json('Error:' + err));
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

// clear all message in a room
router.route('/clear_message').post((req,res) => {
    Room.findOne({roomId: req.body.room})
        .then(room => {
            if(!room){
                res.status(204).json({"message" : "Room not present"});
            }
            else{
                room.message = [];
                room.save()
                    .then(() => {
                        res.json({"message" : "Messages cleared"});
                    })
                    .catch(err => res.status(400).json('Error:' + err));
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

module.exports = router;