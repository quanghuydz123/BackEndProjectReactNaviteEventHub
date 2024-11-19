const asyncHandle = require('express-async-handler')
const InVoiceModel = require("../models/InVoiceModel")
const TicketModel = require("../models/TicketModel")
const TypeTicketModel = require("../models/TypeTicketModel")
const {mongoose } = require('mongoose');
const generateUniqueID = require('../utils/generateUniqueID');

const getAll = asyncHandle(async (req, res) => {
    res.status(400)//ngăn không cho xuống dưới
    throw new Error('Email hoặc mật khẩu không chỉnh xác!!!')
})


const reserveTicket = asyncHandle(async (req, res) => {
    const { ticketChose, showTime, event, idUser } = req.body;
    // console.log("ticketChose, showTime, event, idUser ",idUser )
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {   
        const createdTicketIds = []; // Danh sách lưu ID các ticket được tạo
      for (const ticketC of ticketChose) {
        const { ticket, amount } = ticketC;
  
        const typeTicketData = await TypeTicketModel.findById(ticket).session(session);
        if (!typeTicketData || typeTicketData.amount < amount) {
          res.status(400); // Ngăn không cho xuống dưới
          throw new Error(`Không đủ số lượng vé cho loại ${typeTicketData?.name}`);
        }
  
        typeTicketData.amount -= amount;
        await typeTicketData.save({ session });
  
        const ticketsToCreate = Array.from({ length: amount }).map((item,index) => ({
          price: typeTicketData.price,
          typeTicket: typeTicketData._id,
          qrCode:generateUniqueID(),
          showTime: showTime,
          event: event,
          current_owner: idUser,
          status: 'Reserved',
        }));
  
        // Lưu tất cả các vé
        const createdTickets = await TicketModel.insertMany(ticketsToCreate, { session });
        const ticketIds = createdTickets.map(ticket => ticket._id); // Lấy ID từ mỗi vé
        createdTicketIds.push(...ticketIds); // Thêm ID vào danh sách
      }
  
      // Commit transaction nếu tất cả thành công
      await session.commitTransaction();
      session.endSession();
  
      res.status(200).json({
        status: 200,
        message: 'Đặt vé thành công',
        data:createdTicketIds
      });
    } catch (error) {
      await session.abortTransaction(); // Rollback transaction nếu có lỗi
      session.endSession();
      console.error(error);
  
      res.status(400).json({
        status: 400,
        message: error.message,
      });
    }
  });
  



module.exports = {
    getAll,
    reserveTicket
}