const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users', 
        required: true
    },
    token: {
        type: String,
        required: true
    },
    OTP: {
        type: Number,
        required: true        
    },
    createdAt: {
        type: Date,
        expires: 900
    }
});

const forgetPasswordCollection = mongoose.model('forgetPassword', passwordResetSchema);

module.exports = {
    forgetPasswordCollection
}