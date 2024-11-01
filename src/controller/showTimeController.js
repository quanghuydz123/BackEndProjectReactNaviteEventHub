const asyncHandle = require('express-async-handler')
const ShowTimeModel = require("../models/ShowTimeModel")
const TypeTicketModel = require("../models/TypeTicketModel")

const getAll = asyncHandle(async (req, res) => {
    res.status(400)//ngăn không cho xuống dưới
    throw new Error('Email hoặc mật khẩu không chỉnh xác!!!')
})

const createShowTime = asyncHandle(async (req, res) => {
    const {startDate, endDate, typeTickets } = req.body
    if(!startDate || !endDate || !typeTickets){
        res.status(400)
        throw new Error('Phải nhập đầy đủ thông tin !!!')
    }
    const showTimeCreated = await ShowTimeModel.create(req.body)
    res.status(200).json({
        status:200,
        message:'Thêm thành công',
        data:showTimeCreated
    })
})

const updateStatusShowTime = asyncHandle(async (req, res) => {
    const showTimes = await ShowTimeModel.find();
    const currentTime = new Date();
    await Promise.all((showTimes.map(async (showTime)=>{
        if (currentTime < showTime.startDate) {
            showTime.status = 'NotStarted';
          } else if (currentTime >= showTime.startDate && currentTime <= showTime.endDate) {
            showTime.status = 'Ongoing';
          } else if (currentTime > showTime.endDate) {
            showTime.status = 'Ended';
          }
          if (showTime.status === 'Ongoing' || showTime.status === 'NotStarted') {
            // Tải trạng thái của tất cả typeTickets liên kết với suất diễn này
            const tickets = await TypeTicketModel.find({ _id: { $in: showTime.typeTickets } });
            console.log("tickets",tickets)
            // Kiểm tra trạng thái của các vé
            const allSoldOut = tickets.every(ticket => ticket.status === 'SoldOut');
            const anyOnSale = tickets.some(ticket => ticket.status === 'OnSale');
        
            if (allSoldOut) {
              showTime.status = 'SoldOut';
            } else if (anyOnSale) {
              showTime.status = 'OnSale';
            }
          }
          await showTime.save();
    })))
    res.status(200).json({
        status:200,
        message:'Thêm thành công',
    })
})
module.exports = {
    getAll,
    createShowTime,
    updateStatusShowTime

}