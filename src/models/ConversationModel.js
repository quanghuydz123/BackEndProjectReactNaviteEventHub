const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const MessengerSchema = require('./MessengerModel');


const ConversationSchema = new Schema({
    idConversation: {
        type: String,
        required: true,
        unique: true,
    },
    receiverId: {
        type: String,
        required: true,
    },
    senderId: {
        type: String,
        required: true,
    },
    lastTime: {
        type: Date,
        required: true,
    },
    messenger: {
        type: MessengerSchema,
        required: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    }
});


const ConversationModel = mongoose.model('Conversations', ConversationSchema);
module.exports = ConversationModel;
