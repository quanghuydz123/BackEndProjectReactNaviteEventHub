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

const getByIdEvent = asyncHandle(async (req, res) => {
  const {idEvent} = req.query
  if(!idEvent){
    res.status(404).json({
      status: 404,
      message: 'idEvent không tồn tại',
    })
  }
  const event = await EventModel.findById(idEvent)
  if(!event){
    res.status(404).json({
      status: 404,
      message: 'event không tồn tại',
    })
  }
  const promotions = await PromotionModel.find({event:idEvent})
  res.status(200).json({
    status: 200,
    message: 'Thêm thành công',
    data:promotions
  })
})

const createPromotion = asyncHandle(async (req, res) => {
  const {idEvent, idsTypeTicket, title, discountType, discountValue, startDate, endDate } = req.body
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
      if(discountType === 'FixedAmount'){
        if(typeTicket?.price < discountValue){
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({
            status: 404,
            message: `loại vé ${typeTicket?.name} có giá thấp hơn so với mức giảm vui lòng thử lại `,
          })
        }
      }
      if(typeTicket?.promotion?.status === 'Ongoing' || typeTicket?.promotion?.status === 'NotStarted'){
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          status: 404,
          message: `loại vé ${typeTicket?.name} đã áp dụng giảm giá rồi vui lòng thử lại`,
        })
      }
      typeTicket.promotion = promotionCreated._id
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


const updatePromotion = asyncHandle(async (req, res) => {
  const { idPromotion,idEvent, idsTypeTicket, title, discountType, discountValue, startDate, endDate } = req.body
  if(!idPromotion || !idEvent || idsTypeTicket.length === 0 || !discountType || discountValue === null || !startDate || !endDate)
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
      const promotion = await PromotionModel.findById(idPromotion)
      if (!promotion) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          status: 404,
          message: 'Giảm giá không tồn tại !!!',
        })
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (currentTime < start) {
        promotion.status = 'NotStarted';
      } else if (currentTime >= start && currentTime <= end) {
        promotion.status = 'Ongoing';
      }else {
        promotion.status = 'Ended';
      }
      const currentTypeTickets = new Set(promotion.typeTickets);
      const newTypeTickets = new Set(idsTypeTicket);
      const deletedTypeTickets = promotion.typeTickets.filter(id => !newTypeTickets.has(id));
      const addedTypeTickets = idsTypeTicket.filter(id => !currentTypeTickets.has(id));
      for(const idTypeTicket of deletedTypeTickets){
        await TypeTicketModel.findByIdAndUpdate(idTypeTicket, { $unset: { promotion: "" } }, { session });
      }
      for(const idTypeTicket of addedTypeTickets){
        const typeTicket = await TypeTicketModel.findById(idTypeTicket).populate('promotion', '_id status').session(session)
        if(typeTicket?.type === 'Free'){
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({
            status: 404,
            message: `loại vé ${typeTicket?.name} miễn phí rồi còn áp dụng mã giảm giá làm gì `,
          })
        }
        if(discountType === 'FixedAmount'){
          if(typeTicket?.price < discountValue){
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
              status: 404,
              message: `loại vé ${typeTicket?.name} có giá thấp hơn so với mức giảm vui lòng thử lại `,
            })
          }
        }
        if((typeTicket?.promotion?.status === 'Ongoing' || typeTicket?.promotion?.status === 'NotStarted') && typeTicket?.promotion?._id !== promotion._id){
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({
            status: 404,
            message: `loại vé ${typeTicket?.name} đã áp dụng giảm giá rồi vui lòng thử lại`,
          })
        }
        typeTicket.promotion = promotion._id
        await typeTicket.save({session})
      }
      promotion.title = title
      promotion.discountType = discountType
      promotion.discountValue = discountValue
      promotion.typeTickets = idsTypeTicket
      promotion.startDate = startDate
      promotion.endDate = endDate

      await promotion.save({session})
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
        message: 'Lỗi khi cập nhập promotion',
      })
      }
})

const cancelPromotion = asyncHandle(async (req, res) => {
  const {idPromotion} = req.body
  const promotion = await PromotionModel.findById(idPromotion)
  if (!promotion) {
    await session.abortTransaction();
    session.endSession();
    return res.status(404).json({
      status: 404,
      message: 'Giảm giá không tồn tại !!!',
    })
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if(promotion.status !== 'Canceled'){
      promotion.status = 'Canceled'
      await promotion.save({session})
      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({
        status: 200,
        message: 'Hủy thành công',
      })
    }else{
      const idsTypeTicket = promotion.typeTickets
      for(const idTypeTicket of idsTypeTicket){
        const typeTicket = await TypeTicketModel.findById(idTypeTicket).populate('promotion', '_id status').session(session)
        if(typeTicket.type === 'Free'){
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({
            status: 404,
            message: `loại vé ${typeTicket?.name} miễn phí rồi còn áp dụng mã giảm giá làm gì? `,
          })
        }
        if(promotion?.discountType === 'FixedAmount'){
          if(typeTicket?.price < promotion?.discountValue){
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
              status: 404,
              message: `loại vé ${typeTicket?.name} có giá thấp hơn so với mức giảm vui lòng thử lại `,
            })
          }
        }
        if((typeTicket?.promotion?.status === 'Ongoing' || typeTicket?.promotion?.status === 'NotStarted') && typeTicket?.promotion?._id !== promotion._id){
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({
            status: 404,
            message: `loại vé ${typeTicket?.name} đã áp dụng giảm giá rồi vui lòng thử lại`,
          })
        }
      }
      const currentTime = new Date();
      if (currentTime < promotion.startDate) {
        promotion.status = 'NotStarted';
      } else if (currentTime >= promotion.startDate && currentTime <= promotion.endDate) {
        promotion.status = 'Ongoing';
      }else {
        promotion.status = 'Ended';
      }
      await promotion.save({session})
      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({
        status: 200,
        message: 'Hoàn trạng thái promotion thành công',
      })
    }
  } catch (error) {
    await session.abortTransaction();
      session.endSession();
      return res.status(500).json({
        status: 500,
        message: 'Lỗi khi hủy promotion',
      })
  }
})
module.exports = {
  getAll,
  createPromotion,
  getByIdEvent,
  updatePromotion,
  cancelPromotion
}