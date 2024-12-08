const asyncHandle = require('express-async-handler')
const TypeTicketModel = require("../models/TypeTicketModel")
const { mongoose } = require('mongoose');
const ShowTimeModel = require("../models/ShowTimeModel");
const EventModel = require('../models/EventModel');
const TicketModel = require('../models/TicketModel');

const getAll = asyncHandle(async (req, res) => {
  res.status(400)//ngăn không cho xuống dưới
  throw new Error('Email hoặc mật khẩu không chỉnh xác!!!')
})

const createShowTime = asyncHandle(async (req, res) => {
  const { startDate, endDate, idEvent } = req.body
  if (!startDate || !endDate || !idEvent) {
    return res.status(400).json({ 
      status: 400, 
      message: 'Phải nhập đầy đủ thông tin !!!' 
    });
  }
  const event = await EventModel.findById(idEvent)
  if (!event) {
    return res.status(404).json({
      status: 404,
      message: 'Sự kiện không tồn tại !!!',
    })
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const showTimeCreate = new ShowTimeModel(req.body)
    showTimeCreate.status = 'NotYetOnSale'
    const showtimeCreated = await showTimeCreate.save({session})

    await EventModel.findByIdAndUpdate(idEvent, { $push: { showTimes: showtimeCreated._id } }, { session })

    await session.commitTransaction();
    session.endSession();
    res.status(200).json({
      status: 200,
      message: 'Thêm thành công',
      data: showtimeCreated
    })
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      status: 500,
      message: 'Lỗi khi thêm showTime',
    })
  }
})

const updateShowTime = asyncHandle(async (req, res) => {
  const { startDate, endDate, idEvent,idShowTime,typeTickets,status } = req.body
  
  if (!startDate || !endDate || !idEvent  || !idShowTime) {
    return res.status(400).json({ 
      status: 400, 
      message: 'Phải nhập đầy đủ thông tin !!!' 
    });
  }
  const showTime = await ShowTimeModel.findById(idShowTime).populate('typeTickets', '_id endSaleTime')
  if (!showTime) {
    return res.status(404).json({
      status: 404,
      message: 'Suất diễn không tồn tại !!!',
    })
  }
  const event = await EventModel.findById(idEvent)
  if (!event) {
    return res.status(404).json({
      status: 404,
      message: 'Sự kiện không tồn tại !!!',
    })
  }
  
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const typeTickets = [...showTime.typeTickets]
    const checkEndSale = typeTickets.some((typeTicket)=>new Date(typeTicket.endSaleTime) > new Date(startDate))
    if(checkEndSale){
      return res.status(404).json({
        status: 404,
        message: 'Thời gian bắt đầu của suất diễn phải lớn hơn hoặc bằng thời gian kết thúc bán vé!!!',
      })
    }
    showTime.startDate = startDate
    showTime.endDate = endDate
    const data = await showTime.save({session})
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({
      status: 200,
      message: 'Cập nhập thành công',
      data: data
    })
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      status: 500,
      message: 'Lỗi khi cập nhập showTime',
    })
  }
})

const deleteShowTime = asyncHandle(async (req, res) => {
  const { idEvent,idShowTime} = req.body
  if (!idEvent  || !idShowTime) {
    return res.status(400).json({ 
      status: 400, 
      message: 'Lỗi rồi' 
    });
  }
  const showTime = await ShowTimeModel.findById(idShowTime)
  if (!showTime) {
    return res.status(404).json({
      status: 404,
      message: 'Suất diễn không tồn tại !!!',
    })
  }
  const event = await EventModel.findById(idEvent)
  if (!event) {
    return res.status(404).json({
      status: 404,
      message: 'Sự kiện không tồn tại !!!',
    })
  }
  
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const ticketCount = await TicketModel.countDocuments({ showTime: idShowTime });
    if (ticketCount > 0) {
      return res.status(404).json({
        status: 404,
        message: 'Bạn không thể xóa suất diễn này bởi vì đã có người mua vé của suất diễn này !!!',
      })
    } else {
      const showTimeDeleted = await ShowTimeModel.findByIdAndDelete(idShowTime, { session })
      if (showTimeDeleted && showTimeDeleted.typeTickets) {
        await TypeTicketModel.deleteMany({ _id: { $in: showTimeDeleted.typeTickets } }, { session });
      }
      const showTimes = await ShowTimeModel.find({ _id: { $in: event.showTimes } });
      const index = showTimes.findIndex((showTimes) => showTimes._id.toString() === idShowTime)
      if (index !== -1) {
        showTimes.splice(index, 1)
      }
      // event.showTimes = event.showTimes.filter(showTime => showTime.toString() !== idShowTime);

      const allSoldOutEvent = showTimes.every(showTime => showTime.status === 'SoldOut');
      const allSaleStoppedEvent = showTimes.every(showTime => showTime.status === 'SaleStopped');
      const allNotYetOnSaleEvent = showTimes.every(showTime => showTime.status === 'NotYetOnSale');
      const anyOnSaleEvent = showTimes.some(showTime => showTime.status === 'OnSale');
      if (allSoldOutEvent) {
        event.statusEvent = 'SoldOut';
      }
      else if (allSaleStoppedEvent) {
        event.statusEvent = 'SaleStopped'
      } else if (allNotYetOnSaleEvent) {
        event.statusEvent = 'NotYetOnSale'
      }
      else if (anyOnSaleEvent) {
        event.statusEvent = 'OnSale';
      }
      event.showTimes = showTimes
      await event.save({ session });
    }
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({
      status: 200,
      message: 'Xóa showTime thành công',
    })
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      status: 500,
      message: 'Lỗi khi xóa showTime',
    })
  }
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
      } else if (currentTime > showTime.endDate) {
        await TicketModel.updateMany({ showTime: showTime._id }, { status: 'Ended' }) //khi suất diễn kết thúc thì cập nhập trạng thái vé là kết thúc
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
    status: 200,
    message: 'Thêm thành công',
  })
})
module.exports = {
  getAll,
  createShowTime,
  updateStatusShowTime,
  updateShowTime,
  deleteShowTime

}