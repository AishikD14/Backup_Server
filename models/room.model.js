const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const roomSchema = new Schema({
    roomId: { type: String, required: true, unique: true },
    users: { type: String, required: true },
    type: { type: String, required: true },
    message: [{
        user: { type: String, required: true },
        text: { type: String, required: true }
    }]
},
{
    timestamps: true
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;