const express = require('express');
const EventRouter = express.Router();
const eventController = require('../controller/eventController');
const VerifyMiddleware = require('../middlewares/VerifyMiddleware');

EventRouter.post('/add-event',eventController.addEvent)
EventRouter.get('/get-all',eventController.getAllEvent)


module.exports = EventRouter