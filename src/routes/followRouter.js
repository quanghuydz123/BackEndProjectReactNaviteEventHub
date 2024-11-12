const express = require('express');
const followerRouter = express.Router();
const followController = require('../controller/followController');


// followerRouter.post('/update-follower-event',followController.updateFollowEvent)
followerRouter.get('/get-all',followController.getAllFollow)
followerRouter.put('/update-follower-category',followController.updateFollowCategory)
followerRouter.get('/get-byId',followController.getFollowById)
followerRouter.put('/update-follower-userOther',followController.updateFollowUserOther)
followerRouter.get('/get-number-follow',followController.getNumberFollow)

module.exports = followerRouter