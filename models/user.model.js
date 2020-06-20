const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    userName: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    email: { type: String, required: true, unique: true, trim: true },
    profilePic: { type: String },
    sessionToken: { type: String, required: true },
    lastLoggedIn: {type: Date },
    resetToken: { type: String},
    mobile: { type: Number, required: true }
},
{
    timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;