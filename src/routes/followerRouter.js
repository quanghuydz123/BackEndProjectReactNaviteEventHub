const express = require('express');
const followerRouter = express.Router();
const followerController = require('../controller/followerController');


followerRouter.post('/update-follower-event',followerController.updateFollowEvent)
followerRouter.get('/get-all',followerController.getAllFollow)
followerRouter.put('/update-follower-category',followerController.updateFollowCategory)
followerRouter.get('/get-byId',followerController.getFollowById)
followerRouter.put('/update-follower-userOther',followerController.updateFollowUserOther)

module.exports = followerRouter