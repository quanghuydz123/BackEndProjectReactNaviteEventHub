const express = require('express');
const invoiceRouter = express.Router();
const invoiceController = require('../controller/invoiceController');


invoiceRouter.get('/get-all',invoiceController.getAll)
invoiceRouter.post('/create-paymentInvoiceTicket',invoiceController.createPaymentInvoiceTicket)


module.exports = invoiceRouter 