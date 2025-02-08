const asyncHandle = require('express-async-handler')
const { mongoose } = require('mongoose');
const PromotionModel = require("../models/PromotionModel");
const TypeTicketModel = require("../models/TypeTicketModel");
const EventModel = require("../models/EventModel");


const getAll = asyncHandle(async (req, res) => {

  res.status(200).json({
    status: 200,
    message: 'Thêm thành công',
  })
})

const createPromotion = asyncHandle(async (req, res) => {
  const { idEvent, idsTypeTicket, title, discountType, discountValue, startDate, endDate } = req.body
  if(!idEvent || idsTypeTicket.length === 0 || !discountType || discountValue === null || !startDate || !endDate)
  {
    return res.status(404).json({
      status: 404,
      message: 'Hãy nhập đầy đủ thông tin',
    })
  }
  const currentTime = new Date();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const event = await EventModel.findById(idEvent)
    if (!event) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        status: 404,
        message: 'Sự kiện không tồn tại !!!',
      })
    }
    const promotionCreate = new PromotionModel({
      title,
      discountType,
      discountValue,
      startDate,
      endDate,
      event: idEvent,
      typeTickets:idsTypeTicket
    })
    if (currentTime < promotionCreate.startDate) {
      promotionCreate.status = 'NotStarted';
    } else if (currentTime >= promotionCreate.startDate && currentTime <= promotionCreate.endDate) {
      promotionCreate.status = 'Ongoing';
    }else {
      promotionCreate.status = 'Ended';
    }
    const promotionCreated = await promotionCreate.save({session})
    for (const idTypeTicket of idsTypeTicket){
      const typeTicket = await TypeTicketModel.findById(idTypeTicket).populate('promotion', 'status').session(session)
      if(!typeTicket){
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
          status: 500,
          message: 'Lỗi khi thêm promotion',
        })
      }
      if(typeTicket.type === 'Free'){
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          status: 404,
          message: `loại vé ${typeTicket?.name} miễn phí rồi còn áp dụng mã giảm giá làm gì `,
        })
      }
      if(typeTicket?.promotion[0]?.status === 'Ongoing' || typeTicket?.promotion[0]?.status === 'NotStarted'){
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          status: 404,
          message: `loại vé ${typeTicket?.name} đã áp dụng giảm giá rồi vui lòng thử lại`,
        })
      }
      typeTicket.promotion.unshift(promotionCreated._id)
      await typeTicket.save({session})
    }
    await session.commitTransaction();
    session.endSession();
    return res.status(200).json({
      status: 200,
      message: 'Thêm thành công',
    })
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      status: 500,
      message: 'Lỗi khi thêm promotion',
    })
  }


})

module.exports = {
  getAll,
  createPromotion
}