const router = require('express').Router();
const Room = require("../models/room.model");

router.route('/get_message_history').post((req,res) => {
    const room = req.body.room;
    Room.findOne({ roomId: room }, 'type message')
        .then(chat => {
            if(!chat){
                res.status(206).json({'message': 'Room not present'});
            }
            else{
                if(chat.message.length===0){
                    res.status(204).json({
                        "message": "Empty"
                    });
                }
                else{
                    res.json({
                        "type": chat.type,
                        "message": chat.message
                    })
                }
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

module.exports = router;