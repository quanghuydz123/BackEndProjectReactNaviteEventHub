const express = require('express');
const followerRouter = express.Router();
const followerController = require('../controller/followerController');


followerRouter.post('/update-follower-event',followerController.updateFollowerEvent)
followerRouter.get('/get-all',followerController.getAllFollower)

module.exports = followerRouter