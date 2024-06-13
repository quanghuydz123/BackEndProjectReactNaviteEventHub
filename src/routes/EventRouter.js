const express = require('express');
const EventRouter = express.Router();
const eventController = require('../controller/eventController');
const VerifyMiddleware = require('../middlewares/VerifyMiddleware');

EventRouter.post('/add-event',eventController.addEvent)


module.exports = EventRouter