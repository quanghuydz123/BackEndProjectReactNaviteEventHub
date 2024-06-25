const express = require('express');
const followerRouter = express.Router();
const followerController = require('../controller/followerController');


followerRouter.post('/update-follower-event',followerController.updateFollowerEvent)
followerRouter.get('/get-all',followerController.getAllFollower)
followerRouter.put('/update-follower-category',followerController.updateFollowerCategory)
followerRouter.get('/get-byId',followerController.getAllFollower)

module.exports = followerRouter