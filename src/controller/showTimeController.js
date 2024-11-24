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
    await Promise.all((showTimes.map(async (showTime) => {
      if (showTime.status !== 'Canceled') {
        if (currentTime < showTime.startDate) {
          showTime.status = 'NotStarted';
        } else if (currentTime >= showTime.startDate && currentTime <= showTime.endDate) {
          showTime.status = 'Ongoing';
        } else if (currentTime > showTime.endDate){
          await TicketModel.updateMany({showTime:showTime._id},{status:'Ended'}) //khi suất diễn kết thúc thì cập nhập trạng thái vé là kết thúc
          showTime.status = 'Ended';
        }
        if (showTime.status === 'Ongoing' || showTime.status === 'NotStarted') {
          // Tải trạng thái của tất cả typeTickets liên kết với suất diễn này
          const tickets = await TypeTicketModel.find({ _id: { $in: showTime.typeTickets } });
  
          const allNotYetOnSale = tickets.every(ticket => ticket.status === 'NotStarted');
          const allSoldOut = tickets.every(ticket => ticket.status === 'SoldOut');
          const allSaleStopped = tickets.every(ticket => ticket.status === 'Ended');
          const anyOnSale = tickets.some(ticket => ticket.status === 'OnSale');
  
          if (allNotYetOnSale) {
            showTime.status = 'NotYetOnSale';
          }
          else if (allSoldOut) {
            showTime.status = 'SoldOut';
          }
          else if (allSaleStopped) {
            showTime.status = 'SaleStopped';
          }
          else if (anyOnSale) {
            showTime.status = 'OnSale';
          }
        }
        await showTime.save();
      }
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