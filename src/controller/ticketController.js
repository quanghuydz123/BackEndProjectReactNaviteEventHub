const asyncHandle = require('express-async-handler')
const InVoiceModel = require("../models/InVoiceModel")
const TicketModel = require("../models/TicketModel")
const TypeTicketModel = require("../models/TypeTicketModel")
const { mongoose } = require('mongoose');
const generateUniqueID = require('../utils/generateUniqueID');

const getAll = asyncHandle(async (req, res) => {

  res.status(200).json({
    status: 200,
    message: 'Đặt vé thành công',
    data: null
  });
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

      const ticketsToCreate = Array.from({ length: amount }).map((item, index) => ({
        price: typeTicketData.price,
        typeTicket: typeTicketData._id,
        qrCode: generateUniqueID(),
        showTime: showTime,
        event: event,
        current_owner: idUser,
        status: 'Reserved',
      }));

      const createdTickets = await TicketModel.insertMany(ticketsToCreate, { session });
      const ticketIds = createdTickets.map(ticket => ticket._id); // Lấy ID từ mỗi vé
      createdTicketIds.push(...ticketIds); // Thêm ID vào danh sách
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: 200,
      message: 'Đặt vé thành công',
      data: createdTicketIds
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);

    res.status(400).json({
      status: 400,
      message: error.message,
    });
  }
});



const getByIdUser = asyncHandle(async (req, res) => {
  const { idUser,typeFilter} = req.query
  let id = new mongoose.Types.ObjectId(idUser);
  const data = await TicketModel.aggregate([
    {
      $match: { current_owner: id,status:{$eq:'Sold'}},
    },
    // {
    //   $lookup: {
    //     from: "typetickets", // Tên collection invoices
    //     localField: "typeTicket", // Khóa local (trong _id)
    //     foreignField: "_id", // Khóa trong collection invoices
    //     as: "typeTicketDetails", // Tên trường chứa dữ liệu liên kết
    //     pipeline: [
    //       {
    //         '$project':
    //         {
    //           'description': 0,
    //           'amount': 0,
    //           'startSaleTime': 0,
    //           'endSaleTime': 0,
    //           'status': 0,
    //           'createdAt': 0,
    //           'updatedAt': 0,
    //           '__v': 0
    //         }
    //       }
    //     ]
    //   },
    // },
    {
      $group:
      {
        _id: {
          invoice: "$invoice",
        },

        ticketsPurchase: {
          //  "$$ROOT" lấy toàn bộ
          $push: {
            _id: "$_id",
            // price: "$price",
            // isCheckIn: "$isCheckIn",
            // qrCode: "$qrCode",
            // status: "$status",
            // createdAt: "$createdAt",
            invoice: "$invoice",
            // typeTicket: "$typeTicket",
            showTime: "$showTime",
            // current_owner: "$current_owner",
            event: "$event",
            // typeTicketDetails: { $arrayElemAt: ["$typeTicketDetails", 0] },
          }
        },
      }
    },
    {
      $lookup: {
        from: "invoices", 
        localField: "ticketsPurchase.invoice", 
        foreignField: "_id", 
        as: "invoiceDetails", 
        pipeline: [
          {
            '$project':
            {
              // 'address': 0,
              // 'updatedAt': 0,
              // '__v': 0,
              'invoiceCode':1,
              'totalTicket':1
            }
          }
        ]
      },
    },
    {
      $lookup: {
        from: "showtimes", // Tên collection invoices
        localField: "ticketsPurchase.showTime", // Khóa local (trong _id)
        foreignField: "_id", // Khóa trong collection invoices
        as: "showTimeDetails", // Tên trường chứa dữ liệu liên kết
        pipeline: [
          {
            '$project':
            {
              'typeTickets': 0,
              'createdAt': 0,
              'updatedAt': 0,
              '__v': 0,
            }
          },
          // { $match: {status:{$ne:'OnSale'}}, },
        ]
      },
    },
    {
      $lookup: {
        from: "events", // Tên collection invoices
        localField: "ticketsPurchase.event", // Khóa local (trong _id)
        foreignField: "_id", // Khóa trong collection invoices
        as: "eventDetails", // Tên trường chứa dữ liệu liên kết
        pipeline: [
          {
            '$project':
            {
              // '_id': 1,
              // 'title': 1,
              // 'Address': 1,
              // 'Location': 1,
              // 'position': 1,
              // 'statusEvent': 1, 
              // 'photoUrl':1

              'title': 1,
              'Address': 1,
              'Location': 1,

            }
          }
        ]
      },

    },
    {
      $sort: {
        "showTimeDetails.startDate": 1,
      },
    },
    {
      '$project':
      {
        '_id': 0,
        'ticketsPurchase': 1,
        'invoiceDetails': { $arrayElemAt: ["$invoiceDetails", 0] },
        'showTimeDetails': { $arrayElemAt: ["$showTimeDetails", 0] },
        'eventDetails': { $arrayElemAt: ["$eventDetails", 0] },
      }
    },
    // { $limit : 2}
   

  ]);

  let datafilter = data
  if(typeFilter === 'UpComing'){
    datafilter = datafilter.filter((ticket)=>(ticket.showTimeDetails.status !== 'Canceled' && ticket.showTimeDetails.status !== 'Ended'))
  }else if(typeFilter === 'Ended'){
    datafilter = datafilter.filter((ticket)=>ticket.showTimeDetails.status==='Ended')
  }else if(typeFilter === 'Canceled'){
    datafilter = datafilter.filter((ticket)=>ticket.showTimeDetails.status==='Canceled')
  }
  res.status(200).json({
    status: 200,
    message: 'Đặt asdsad công',
    data: datafilter
  });
})

const getByIdInvoice = asyncHandle(async (req, res) => {
  const { idInvoice } = req.query
  let id = new mongoose.Types.ObjectId(idInvoice);
  const data = await TicketModel.aggregate([
    {
      $match: { invoice: id},
    },
    {
      $lookup: {
        from: "typetickets", // Tên collection invoices
        localField: "typeTicket", // Khóa local (trong _id)
        foreignField: "_id", // Khóa trong collection invoices
        as: "typeTicketDetails", // Tên trường chứa dữ liệu liên kết
        pipeline: [
          {
            '$project':
            {
              'description': 0,
              'amount': 0,
              'startSaleTime': 0,
              'endSaleTime': 0,
              'status': 0,
              'createdAt': 0,
              'updatedAt': 0,
              '__v': 0
            }
          }
        ]
      },
    },
    {
      $group:
      {
        _id: {
          invoice: "$invoice",
        },

        ticketsPurchase: {
          //  "$$ROOT" lấy toàn bộ
          $push: {
            _id: "$_id",
            price: "$price",
            isCheckIn: "$isCheckIn",
            qrCode: "$qrCode",
            status: "$status",
            createdAt: "$createdAt",
            invoice: "$invoice",
            typeTicket: "$typeTicket",
            showTime: "$showTime",
            current_owner: "$current_owner",
            event: "$event",
            typeTicketDetails: { $arrayElemAt: ["$typeTicketDetails", 0] },
          }
        },
      }
    },
    {
      $lookup: {
        from: "invoices", 
        localField: "ticketsPurchase.invoice", 
        foreignField: "_id", 
        as: "invoiceDetails", 
        pipeline: [
          {
            '$project':
            {
              'address': 0,
              'updatedAt': 0,
              '__v': 0,
            }
          }
        ]
      },
    },
    {
      $lookup: {
        from: "showtimes", // Tên collection invoices
        localField: "ticketsPurchase.showTime", // Khóa local (trong _id)
        foreignField: "_id", // Khóa trong collection invoices
        as: "showTimeDetails", // Tên trường chứa dữ liệu liên kết
        pipeline: [
          {
            '$project':
            {
              'typeTickets': 0,
              'createdAt': 0,
              'updatedAt': 0,
              '__v': 0,
            }
          }
        ]
      },
    },
    {
      $lookup: {
        from: "events", // Tên collection invoices
        localField: "ticketsPurchase.event", // Khóa local (trong _id)
        foreignField: "_id", // Khóa trong collection invoices
        as: "eventDetails", // Tên trường chứa dữ liệu liên kết
        pipeline: [
          {
            '$project':
            {
              '_id': 1,
              'title': 1,
              'Address': 1,
              'Location': 1,
              'position': 1,
              'statusEvent': 1,
              'photoUrl':1

            }
          }
        ]
      },

    },
    {
      $sort: {
        "showTimeDetails.startDate": 1,
      },
    },
    {
      '$project':
      {
        '_id': 0,
        'ticketsPurchase': 1,
        'invoiceDetails': { $arrayElemAt: ["$invoiceDetails", 0] },
        'showTimeDetails': { $arrayElemAt: ["$showTimeDetails", 0] },
        'eventDetails': { $arrayElemAt: ["$eventDetails", 0] },
      }
    },
   

  ]);



  res.status(200).json({
    status: 200,
    message: 'Đặt asdsad công',
    data: data
  });
})
module.exports = {
  getAll,
  reserveTicket,
  getByIdUser,
  getByIdInvoice
}