const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessengerSchema = new Schema({
    idConversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversations',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    isReaded: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });


const MessengerModel = mongoose.model('Messenger', MessengerSchema);
module.exports = MessengerModel;
