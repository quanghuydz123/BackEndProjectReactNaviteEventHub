const express = require('express');
const keyWordRouter = express.Router();
const keyWordController = require('../controller/KeyWordController');


keyWordRouter.get('/get-all',keyWordController.getAll)

keyWordRouter.post('/add-keyWords',keyWordController.addKeyWords)

module.exports = keyWordRouter 