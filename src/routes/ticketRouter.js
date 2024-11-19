const express = require('express');
const ticketRouter = express.Router();
const ticketController = require('../controller/ticketController');


ticketRouter.get('/get-all',ticketController.getAll)
ticketRouter.post('/reserve-ticket',ticketController.reserveTicket)


module.exports = ticketRouter 