const express = require('express');
const organizerRouter = express.Router();
const organizerController = require('../controller/organizerController');


organizerRouter.get('/get-all',organizerController.getAll)
organizerRouter.post('/create-organizer',organizerController.createOrganizer)
organizerRouter.get('/get-eventCreatedOrganizerById',organizerController.getEventCreatedOrganizerById)


module.exports = organizerRouter 