const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: Number,
        required: true        
    },
    password: {
        type: String,
        required: true,        
    },
    email: {
        type: String,
        required: true,
        unique: true
    }

}, {timestamp: true});

const userCollection = mongoose.model('users', userSchema);

module.exports = {
    userCollection
}