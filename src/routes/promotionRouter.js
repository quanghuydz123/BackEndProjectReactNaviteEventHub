const express = require('express');
const promotionRouter = express.Router();
const promotionController = require('../controller/promotionController');


promotionRouter.get('/get-all',promotionController.getAll)

promotionRouter.post('/create-promotion',promotionController.createPromotion)

module.exports = promotionRouter 