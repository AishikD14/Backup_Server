const router = require('express').Router();
const Room = require("../models/room.model");

router.route('/get_message_history').post((req,res) => {
    const room = req.body.room;
    Room.findOne({ roomId: room }, 'message')
        .then(chat => {
            // console.log(chat);
            if(!chat){
                res.status(204).json({'message': 'Empty'});
            }
            else{
                res.json({
                    "message": chat.message
                })
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

module.exports = router;