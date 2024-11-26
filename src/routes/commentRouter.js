const express = require('express');
const commentRouter = express.Router();
const commentController = require('../controller/CommentController');

commentRouter.get('/get-byIdEvent',commentController.getByIdEvent)

commentRouter.post('/comment-event',commentController.commentEvent)
commentRouter.post('/replyComment-event',commentController.replyCommentEvent)
commentRouter.put('/delete-comment',commentController.deleteComment)


module.exports = commentRouter