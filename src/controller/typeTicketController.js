const asyncHandle = require('express-async-handler')
const TypeTicketModel = require("../models/TypeTicketModel")
const { mongoose } = require('mongoose');
const ShowTimeModel = require("../models/ShowTimeModel");
const EventModel = require('../models/EventModel');
const TicketModel = require('../models/TicketModel');


const getAll = asyncHandle(async (req, res) => {

  res.status(200).json({
    status: 200,
    message: 'Thêm thành công',
  })
})

const createTypeTicket = asyncHandle(async (req, res) => {
  const { name, description, type, price, startSaleTime, endSaleTime, amount, idShowTime, idEvent } = req.body
  if (!startSaleTime || !endSaleTime || !name || !amount || !idShowTime || !idEvent) {
    return res.status(404).json({
      status: 404,
      message: 'Phải nhập đầy đủ thông tin !!!',
    })
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
  if (new Date(endSaleTime) > new Date(showTime.startDate)) {
    return res.status(404).json({
      status: 404,
      message: 'Thời gian bán vé phải nhỏ hơn thời gian bắt đầu của suất diễn !!!',
    })
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  const currentTime = new Date();

  try {
    const typeTicketCreate = new TypeTicketModel(req.body)
    if (currentTime < new Date(startSaleTime)) {
      typeTicketCreate.status = 'NotStarted';
    } else if (currentTime >= new Date(startSaleTime) && currentTime <= new Date(endSaleTime)) {
      typeTicketCreate.status = 'OnSale';
    }

    const typeTicket = await typeTicketCreate.save({ session })

    await ShowTimeModel.findByIdAndUpdate(idShowTime, { $push: { typeTickets: typeTicket._id } }, { session })

    const tickets = await TypeTicketModel.find({ _id: { $in: showTime.typeTickets } });

    tickets.push(typeTicket)//thêm loại vé mới vào để kiểm tra

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
    await showTime.save({ session });

    const showTimes = await ShowTimeModel.find({ _id: { $in: event.showTimes } });
    showTimes.forEach(showtime => {//cập nhập trang thái mới nhất cho suất diễn
      if (showtime._id.toString() === idShowTime) {
        showtime.status = showTime.status;
      }
    })

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

    await event.save({ session });
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({
      status: 200,
      message: 'Thêm thành công',
      data: typeTicket
    })
  } catch (error) {
    await session.abortTransaction(); // Rollback transaction nếu có lỗi
    session.endSession();
    res.status(500).json({
      status: 500,
      message: 'Lỗi khi thêm typeTicket',
    })
  }
})

const updateStatusTypeTicket = asyncHandle(async (req, res) => {
  const typeTickets = await TypeTicketModel.find();
  const currentTime = new Date();
  await Promise.all((typeTickets.map(async (typeTicket) => {
    if (typeTicket.status !== 'Canceled') {
      if (currentTime < typeTicket.startSaleTime) {
        typeTicket.status = 'NotStarted';
      } else if (currentTime >= typeTicket.startSaleTime && currentTime <= typeTicket.endSaleTime) {
        typeTicket.status = 'OnSale';
        if (typeTicket.amount === 0) {
          typeTicket.status = 'SoldOut';
        }
      } else if (currentTime > typeTicket.endSaleTime) {
        typeTicket.status = 'Ended';
      }
      await typeTicket.save();
    }
  })))
  res.status(200).json({
    status: 200,
    message: 'Thêm thành công',
  })
})

const updateTypeTicket = asyncHandle(async (req, res) => {
  const { name, description, type, price, startSaleTime, endSaleTime, amount, idShowTime, idTypeTicket, idEvent } = req.body
  if (!startSaleTime || !endSaleTime || !name || amount === undefined || amount === null || !idShowTime || !idTypeTicket || !idEvent) {
    return res.status(404).json({
      status: 404,
      message: 'Phải nhập đầy đủ thông tin !!!',
    })
  }
  const showTime = await ShowTimeModel.findById(idShowTime)
  if (!showTime) {
    return res.status(404).json({
      status: 404,
      message: 'Suất diễn không tồn tại !!!',
    })
  }
  const typeTicket = await TypeTicketModel.findById(idTypeTicket)
  if (!typeTicket) {
    return res.status(404).json({
      status: 404,
      message: 'Loại vé không tồn tại !!!',
    })
  }
  const event = await EventModel.findById(idEvent)
  if (!event) {
    return res.status(404).json({
      status: 404,
      message: 'Sự kiện không tồn tại !!!',
    })
  }
  if (new Date(endSaleTime) > new Date(showTime.startDate)) {
    return res.status(404).json({
      status: 404,
      message: 'Thời gian bán vé phải nhỏ hơn thời gian bắt đầu của suất diễn !!!',
    })
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  const currentTime = new Date();

  try {
    if (currentTime < new Date(startSaleTime)) {
      typeTicket.status = 'NotStarted';
    } else if (currentTime >= new Date(startSaleTime) && currentTime <= new Date(endSaleTime)) {
      typeTicket.status = 'OnSale';
      if (amount === 0) {
        typeTicket.status = 'SoldOut';
      }
    } else if (currentTime > new Date(endSaleTime)) {
      typeTicket.status = 'Ended';
    }
    typeTicket.name = name
    typeTicket.price = price
    typeTicket.description = description
    typeTicket.type = type
    typeTicket.startSaleTime = startSaleTime
    typeTicket.endSaleTime = endSaleTime
    const data = await typeTicket.save({ session })
    const tickets = await TypeTicketModel.find({ _id: { $in: showTime.typeTickets } });

    tickets.forEach(ticket => {//cập nhập trang thái mới nhất cho loại vé cập nhập
      if (ticket._id.toString() === idTypeTicket) {
        ticket.status = typeTicket.status;
      }
    })

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
    await showTime.save({ session });

    const showTimes = await ShowTimeModel.find({ _id: { $in: event.showTimes } });
    showTimes.forEach(showtime => {//cập nhập trang thái mới nhất cho suất diễn
      if (showtime._id.toString() === idShowTime) {
        showtime.status = showTime.status;
      }
    })

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

    await event.save({ session });
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
      message: 'Lỗi khi thêm typeTicket',
    })
  }
})
const deleteTypeTicket = asyncHandle(async (req, res) => {
  const { idShowTime, idTypeTicket, idEvent } = req.body
  if (!idShowTime || !idTypeTicket || !idEvent) {
    return res.status(404).json({
      status: 404,
      message: 'Phải nhập đầy đủ thông tin !!!',
    })
  }
  const showTime = await ShowTimeModel.findById(idShowTime)
  if (!showTime) {
    return res.status(404).json({
      status: 404,
      message: 'Suất diễn không tồn tại !!!',
    })
  }
  const typeTicket = await TypeTicketModel.findById(idTypeTicket)
  if (!typeTicket) {
    return res.status(404).json({
      status: 404,
      message: 'Loại vé không tồn tại !!!',
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
    const ticketCount = await TicketModel.countDocuments({ typeTicket: idTypeTicket });

    // const tickets = await TicketModel.find({ typeTicket: idTypeTicket })
    if (ticketCount > 0) {
      return res.status(404).json({
        status: 404,
        message: 'Bạn không thể xóa loại vé này bởi vì đã có người mua loại vé này !!!',
      })
    } else {
      await TypeTicketModel.findByIdAndDelete(idTypeTicket, {}, { session })
      const typeTickets = await TypeTicketModel.find({ _id: { $in: showTime.typeTickets } });

      const index = typeTickets.findIndex((typeTicket) => typeTicket._id.toString() === idTypeTicket)
      if (index !== -1) {
        typeTickets.splice(index, 1)
      }

      const allNotYetOnSale = typeTickets.every(typeTicket => typeTicket.status === 'NotStarted');
      const allSoldOut = typeTickets.every(typeTicket => typeTicket.status === 'SoldOut');
      const allSaleStopped = typeTickets.every(typeTicket => typeTicket.status === 'Ended');
      const anyOnSale = typeTickets.some(typeTicket => typeTicket.status === 'OnSale');
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
      showTime.typeTickets = typeTickets
      await showTime.save({ session });

      const showTimes = await ShowTimeModel.find({ _id: { $in: event.showTimes } });
      showTimes.forEach(showtime => {//cập nhập trang thái mới nhất cho suất diễn
        if (showtime._id.toString() === idShowTime) {
          showtime.status = showTime.status;
        }
      })

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

      await event.save({ session });
    }


    await session.commitTransaction();
    session.endSession();
    res.status(200).json({
      status: 200,
      message: 'Xóa loại vé thành công',
    })
  } catch (error) {
    await session.abortTransaction(); // Rollback transaction nếu có lỗi
    session.endSession();
    res.status(500).json({
      status: 500,
      message: 'Lỗi khi thêm typeTicket',
      data:data
    })
  }
})
module.exports = {
  getAll,
  createTypeTicket,
  updateStatusTypeTicket,
  updateTypeTicket,
  deleteTypeTicket

}