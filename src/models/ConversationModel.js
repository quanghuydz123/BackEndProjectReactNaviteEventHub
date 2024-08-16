const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const ConversationSchema = new Schema({
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    idLastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Messenger',
    },
    isDeleted: {
        type: Boolean,
        default: false,
    }
});


const ConversationModel = mongoose.model('Conversations', ConversationSchema);
module.exports = ConversationModel;
