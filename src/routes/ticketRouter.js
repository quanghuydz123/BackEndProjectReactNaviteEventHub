const express = require('express');
const ticketRouter = express.Router();
const ticketController = require('../controller/ticketController');


ticketRouter.get('/get-all',ticketController.getAll)
ticketRouter.post('/reserve-ticket',ticketController.reserveTicket)
ticketRouter.get('/get-byIdUser',ticketController.getByIdUser)
ticketRouter.get('/get-byIdInvoice',ticketController.getByIdInvoice)


module.exports = ticketRouter 