const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessengerSchema = new Schema({
    idMessenger: {
        type: String,
        required: true,
        unique: true,
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        required: true,
        default: Date.now,
    },
    senderId: {
        type: String,
        required: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });


const MessengerModel = mongoose.model('Messenger', MessengerSchema);
module.exports = MessengerModel;
