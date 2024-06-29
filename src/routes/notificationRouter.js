const express = require('express');
const notificationRouter = express.Router();
const notificationController = require('../controller/notificationController');


notificationRouter.post('/invite-users-to-event',notificationController.handleSendNotificationInviteUserToEvent)


module.exports = notificationRouter