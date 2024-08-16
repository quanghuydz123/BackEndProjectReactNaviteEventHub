const ConversationModel = require("../models/ConversationModel");
const asyncHandle = require("express-async-handler");

// Get all messages in a conversation, excluding deleted messages
const getMessagesByConversationId = asyncHandle(async (req, res) => {
    const { idConversation } = req.params;
    const conversation = await ConversationModel.findOne({ idConversation });

    if (!conversation) {
        res.status(404);
        throw new Error("Cuộc trò chuyện không tồn tại");
    }

    // Filter out messages that are marked as deleted
    const activeMessages = conversation.messenger.filter(message => !message.isDeleted);

    res.status(200).json({
        status: 200,
        message: "Thành công",
        data: activeMessages,
    });
});

// Add a new message to a conversation
const addMessageToConversation = asyncHandle(async (req, res) => {
    const { idConversation } = req.params;
    const { idMessenger, content, timestamp, senderId } = req.body;

    const conversation = await ConversationModel.findOne({ idConversation });

    if (!conversation) {
        res.status(404);
        throw new Error("Cuộc trò chuyện không tồn tại");
    }

    const newMessage = { idMessenger, content, timestamp, senderId, isDeleted: false };
    conversation.messenger.push(newMessage);
    conversation.lastTime = new Date();

    await conversation.save();

    res.status(201).json({
        status: 201,
        message: "Tin nhắn đã được thêm",
        data: newMessage,
    });
});

// Soft delete a message from a conversation
const softDeleteMessageFromConversation = asyncHandle(async (req, res) => {
    const { idConversation, idMessenger } = req.params;

    const conversation = await ConversationModel.findOne({ idConversation });

    if (!conversation) {
        res.status(404);
        throw new Error("Cuộc trò chuyện không tồn tại");
    }

    // Find the message and set isDeleted to true
    const message = conversation.messenger.find(msg => msg.idMessenger === idMessenger);

    if (!message) {
        res.status(404);
        throw new Error("Tin nhắn không tồn tại");
    }

    message.isDeleted = true;
    conversation.lastTime = new Date();

    await conversation.save();

    res.status(200).json({
        status: 200,
        message: "Tin nhắn đã bị xóa mềm",
    });
});

module.exports = {
    getMessagesByConversationId,
    addMessageToConversation,
    softDeleteMessageFromConversation,
};
