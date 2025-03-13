const asyncHandle = require('express-async-handler')
const { mongoose } = require('mongoose');
const PromotionModel = require("../models/PromotionModel");
const KeyWordModel = require("../models/KeyWordModel");
const EventModel = require("../models/EventModel");


const getAll = asyncHandle(async (req, res) => {
  try {
    const data = await KeyWordModel.find().select("_id name popularity")
    res.status(200).json({
      status: 200,
      message: `Thành công`,
      data
    })
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: `Lỗi rồi ${error}`,
    })
  }
  
})

const addKeyWords = asyncHandle(async (req, res) => {
  const {keywords} = req.body
  try {
   
    const data = await KeyWordModel.insertMany(keywords)
    res.status(200).json({
      status: 200,
      message: 'Thêm thành công',
      // data
    })
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: `Lỗi rồi ${error}`,
    })
  }
  
})


module.exports = {
  getAll,
  addKeyWords
}