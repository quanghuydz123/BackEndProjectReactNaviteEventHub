const asyncHandle = require('express-async-handler')
const InVoiceModel = require("../models/InVoiceModel")
const TicketModel = require("../models/TicketModel")
const TypeTicketModel = require("../models/TypeTicketModel")
const UserModel = require("../models/UserModel")

const {mongoose } = require('mongoose');
const generateUniqueID = require('../utils/generateUniqueID')

const getAll = asyncHandle(async (req, res) => {
    res.status(200).json({
        status:200,
        message:'Thanh toán thành công',
        data:generateUniqueID()
    })
    // res.status(400)//ngăn không cho xuống dưới
    // throw new Error('Email hoặc mật khẩu không chỉnh xác!!!')
})


const createPaymentInvoiceTicket = asyncHandle(async (req, res) => {
    const {fullname,email,phoneNumber,address,totalPrice,ticketsReserve,fullAddress,idUser} = req.body
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const invoice = new InVoiceModel({
            address:address,
            email:email,
            fullname:fullname,
            phoneNumber:phoneNumber,
            totalPrice:totalPrice,
            totalTicket:ticketsReserve.length,
            invoiceCode:generateUniqueID(),
            fullAddress:fullAddress,
            user:idUser
        })
        const invoiceCreated = await invoice.save({session})
        if(invoiceCreated){
            for(const ticket of ticketsReserve){
                const checkTicket = await TicketModel.findById(ticket).session(session)
                if(checkTicket && checkTicket.status === 'Reserved'){
                    await TicketModel.findByIdAndUpdate(checkTicket._id,{invoice:invoiceCreated._id,status:'Sold'}).session(session)
                }
                else{
                    res.status(400)
                    throw new Error('Thanh toán không thành công do vé đã hết hạn thanh toán')
                }
            }
        }
        // const userUpdate = await UserModel.findByIdAndUpdate(idUser,{ $push: { historyTransaction: { id: invoiceCreated._id, type: "invoices" } } },{new:true}).session(session)

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            status:200,
            message:'Thanh toán thành công',
            data:invoiceCreated
        })
    } catch (error) {
        await session.abortTransaction(); // Rollback transaction nếu có lỗi
        session.endSession();
        console.error(error);
    
        res.status(400).json({
          status: 400,
          message: error.message,
        });
    }
    
})


const CancelInvoice = asyncHandle(async (req, res) => {
    const {ticketsReserve} = req.body
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        for (const ticket of ticketsReserve) {
            const checkTicket = await TicketModel.findById(ticket).session(session)
            if(checkTicket && checkTicket.status === 'Reserved'){
                const ticketData = await TicketModel.findByIdAndDelete(checkTicket._id).session(session)
                await TypeTicketModel.findByIdAndUpdate(ticketData.typeTicket,{$inc:{amount:1}}).session(session)
            }
            // else{
            //     res.status(400)
            //     throw new Error('Lỗi khi hủy đơn hàng')
            // }
        }
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({
            status: 200,
            message: 'Hủy thành công',
            
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
})
module.exports = {
    getAll,
    createPaymentInvoiceTicket,
    CancelInvoice
}