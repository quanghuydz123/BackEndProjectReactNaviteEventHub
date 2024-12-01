const express = require('express');
const showTimeRouter = express.Router();
const showTimeController = require('../controller/showTimeController');


showTimeRouter.get('/get-all',showTimeController.getAll)
showTimeRouter.post('/create-showTime',showTimeController.createShowTime)
showTimeRouter.put('/update-showTime',showTimeController.updateShowTime)
showTimeRouter.delete('/delete-showTime',showTimeController.deleteShowTime)

showTimeRouter.put('/update-statusShowTime',showTimeController.updateStatusShowTime)

module.exports = showTimeRouter 