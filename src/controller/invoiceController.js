const asyncHandle = require('express-async-handler')
const ShowTimeModel = require("../models/ShowTimeModel")
const TypeTicketModel = require("../models/TypeTicketModel")

const getAll = asyncHandle(async (req, res) => {
    res.status(400)//ngăn không cho xuống dưới
    throw new Error('Email hoặc mật khẩu không chỉnh xác!!!')
})


const createPaymentInvoiceTicket = asyncHandle(async (req, res) => {
    const {} = req.body
    
    res.status(200).json({
        status:200,
        message:'Thêm thành công',
    })
})

module.exports = {
    getAll,
    createPaymentInvoiceTicket
}