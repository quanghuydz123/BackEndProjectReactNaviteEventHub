// controllers/conversationController.js
const ConversationModel = require("../models/ConversationModel");
const asyncHandle = require("express-async-handler");

// Get all conversations (excluding deleted ones)
const getAllConversations = asyncHandle(async (req, res) => {
    const conversations = await ConversationModel.find({ isDeleted: false });
    res.status(200).json({
        status: 200,
        message: "Thành công",
        data: conversations,
    });
});

// Get conversation by ID (excluding deleted ones)
const getConversationById = asyncHandle(async (req, res) => {
    const { id } = req.params;
    const conversation = await ConversationModel.findOne({ _id: id, isDeleted: false });
    if (!conversation) {
        res.status(404);
        throw new Error("Cuộc trò chuyện không tồn tại");
    }
    res.status(200).json({
        status: 200,
        message: "Thành công",
        data: conversation,
    });
});

// Create a new conversation
const createConversation = asyncHandle(async (req, res) => {
    const { idConversation, receiverId, senderId, messenger } = req.body;

    const conversation = new ConversationModel({
        idConversation,
        receiverId,
        senderId,
        lastTime: new Date(),
        messenger,
        isDeleted: false,
    });

    await conversation.save();
    res.status(201).json({
        status: 201,
        message: "Cuộc trò chuyện đã được tạo",
        data: conversation,
    });
});

// Update conversation's last time and messenger
const updateConversation = asyncHandle(async (req, res) => {
    const { id } = req.params;
    const { lastTime, messenger } = req.body;

    const updatedConversation = await ConversationModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { lastTime, messenger },
        { new: true }
    );

    if (!updatedConversation) {
        res.status(404);
        throw new Error("Cuộc trò chuyện không tồn tại");
    }

    res.status(200).json({
        status: 200,
        message: "Cuộc trò chuyện đã được cập nhật",
        data: updatedConversation,
    });
});

// Soft delete a conversation
const softDeleteConversation = asyncHandle(async (req, res) => {
    const { id } = req.params;

    const updatedConversation = await ConversationModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true },
        { new: true }
    );

    if (!updatedConversation) {
        res.status(404);
        throw new Error("Cuộc trò chuyện không tồn tại");
    }

    res.status(200).json({
        status: 200,
        message: "Cuộc trò chuyện đã bị xóa mềm",
    });
});

module.exports = {
    getAllConversations,
    getConversationById,
    createConversation,
    updateConversation,
    softDeleteConversation,
};
