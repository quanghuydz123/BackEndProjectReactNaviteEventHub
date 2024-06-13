const express = require('express');
const categoryRouter = express.Router();
const categoryController = require('../controller/categoryController');

categoryRouter.post('/add-category',categoryController.addCategory)


module.exports = categoryRouter