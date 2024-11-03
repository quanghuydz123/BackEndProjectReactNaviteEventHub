const asyncHandle = require('express-async-handler')
const TypeTicketModel = require("../models/TypeTicketModel")


const getAll = asyncHandle(async (req, res) => {
    res.status(400)//ngăn không cho xuống dưới
    throw new Error('Email hoặc mật khẩu không chỉnh xác!!!')
})

const createTypeTicket = asyncHandle(async (req, res) => {
    const {name,description,type,price,startSaleTime,endSaleTime } = req.body
    if(!startSaleTime || !endSaleTime || !name){
        res.status(400)
        throw new Error('Phải nhập đầy đủ thông tin !!!')
    }
    const typeTicketCreated = await TypeTicketModel.create(req.body)
    res.status(200).json({
        status:200,
        message:'Thêm thành công',
        data:typeTicketCreated
    })
})

const updateStatusTypeTicket = asyncHandle(async (req, res) => {
    const typeTickets = await TypeTicketModel.find();
    const currentTime = new Date();
    await Promise.all((typeTickets.map(async (typeTicket)=>{
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
    })))
    res.status(200).json({
        status:200,
        message:'Thêm thành công',
    })
})


module.exports = {
    getAll,
    createTypeTicket,
    updateStatusTypeTicket

}