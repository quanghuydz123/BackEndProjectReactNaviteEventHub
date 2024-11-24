const asyncHandle = require('express-async-handler')
const InVoiceModel = require("../models/InVoiceModel")
const TicketModel = require("../models/TicketModel")
const TypeTicketModel = require("../models/TypeTicketModel")
const EventModel = require("../models/EventModel")

const { mongoose } = require('mongoose');
const generateUniqueID = require('../utils/generateUniqueID')
const { removeVietnameseTones, cleanString } = require('../utils/handleString')

const getAll = asyncHandle(async (req, res) => {
    const invoices = await InVoiceModel.find()
        .select('-address -fullname -email -paymentMethod -phoneNumber -fullAddress -updatedAt -__v')
        .sort({ createdAt: -1 })
    const groupedInvoices = {};

    await Promise.all(
        invoices.map(async (invoice) => {
            const ticket = await TicketModel.findOne({ invoice: invoice._id }).populate('event', '_id title');

            const monthYear = 'Tháng ' + new Date(invoice.createdAt).toLocaleString('en-US', { month: '2-digit', year: 'numeric' });

            const invoiceData = {
                ...invoice.toObject(), // Chuyển đổi sang plain object
                titleEvent: ticket?.event?.title || null
            };
            //gom nhóm
            if (!groupedInvoices[monthYear]) {
                groupedInvoices[monthYear] = [];
            }
            groupedInvoices[monthYear].push(invoiceData);
        })
    );
    res.status(200).json({
        status: 200,
        message: 'Thanh toán thành công',
        data: groupedInvoices
    })
})


const createPaymentInvoiceTicket = asyncHandle(async (req, res) => {
    const { fullname, email, phoneNumber, address, totalPrice, ticketsReserve, fullAddress, idUser } = req.body
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const invoice = new InVoiceModel({
            address: address,
            email: email,
            fullname: fullname,
            phoneNumber: phoneNumber,
            totalPrice: totalPrice,
            totalTicket: ticketsReserve.length,
            invoiceCode: generateUniqueID(),
            fullAddress: fullAddress,
            user: idUser,
        })
        const invoiceCreated = await invoice.save({ session })
        if (invoiceCreated) {
            for (const ticket of ticketsReserve) {
                const checkTicket = await TicketModel.findById(ticket).session(session)
                if (checkTicket && checkTicket.status === 'Reserved') {
                    await TicketModel.findByIdAndUpdate(checkTicket._id, { invoice: invoiceCreated._id, status: 'Sold' }).session(session)
                }
                else {
                    res.status(400)
                    throw new Error('Thanh toán không thành công do vé đã hết hạn thanh toán')
                }
            }
        }
        // const userUpdate = await UserModel.findByIdAndUpdate(idUser,{ $push: { historyTransaction: { id: invoiceCreated._id, type: "invoices" } } },{new:true}).session(session)

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            status: 200,
            message: 'Thanh toán thành công',
            data: invoiceCreated
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
    const { ticketsReserve } = req.body
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        for (const ticket of ticketsReserve) {
            const checkTicket = await TicketModel.findById(ticket).session(session)
            if (checkTicket && checkTicket.status === 'Reserved') {
                const ticketData = await TicketModel.findByIdAndDelete(checkTicket._id).session(session)
                await TypeTicketModel.findByIdAndUpdate(ticketData.typeTicket, { $inc: { amount: 1 } }).session(session)
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

const getByIdUser = asyncHandle(async (req, res) => {
    const { idUser, searchValue } = req.query;

    const regex = new RegExp(removeVietnameseTones(searchValue ?? '').replace(/\s+/g, ' '), 'i');

    const invoices = await InVoiceModel.find({ user: idUser })
        .select('-address -fullname -email -paymentMethod -phoneNumber -fullAddress -updatedAt -__v')
        .sort({ createdAt: -1 });

    const groupedInvoices = {};

    for (const invoice of invoices) {
        const ticket = await TicketModel.findOne({ invoice: invoice._id }).populate({
            path: 'event',
            select: '_id title',
        });

        const monthYear =
            'Tháng ' +
            new Date(invoice.createdAt).toLocaleString('en-US', { month: '2-digit', year: 'numeric' });

        const titleEvent = 'Mua vé ' + (ticket?.event?.title || '');
        const titleEventCopy = cleanString(titleEvent);
        if (!regex.test(titleEventCopy)) return; // Bỏ qua nếu không khớp

        const invoiceData = {
            ...invoice.toObject(),
            titleEvent,
        };

        if (!groupedInvoices[monthYear]) {
            groupedInvoices[monthYear] = [];
        }
        groupedInvoices[monthYear].push(invoiceData);
    }

    const result = Object.values(groupedInvoices);

    res.status(200).json({
        status: 200,
        message: 'Thanh toán thành công',
        data: result,
    });
});


module.exports = {
    getAll,
    createPaymentInvoiceTicket,
    CancelInvoice,
    getByIdUser
}