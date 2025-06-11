const asyncHandle = require('express-async-handler');
const InVoiceModel = require('../models/InVoiceModel');
const TicketModel = require('../models/TicketModel');
const TypeTicketModel = require('../models/TypeTicketModel');

const { mongoose } = require('mongoose');
const generateUniqueID = require('../utils/generateUniqueID');
const ShowTimeModel = require('../models/ShowTimeModel');

const getAll = asyncHandle(async (req, res) => {
  res.status(200).json({
    status: 200,
    message: 'Đặt vé thành công',
    data: null,
  });
});

const reserveTicket = asyncHandle(async (req, res) => {
  const { ticketChose, showTime, event, idUser } = req.body;
  for (const ticketC of ticketChose) {
    const { ticket, amount } = ticketC;

    const typeTicketData = await TypeTicketModel.findById(ticket);
    if (!typeTicketData || typeTicketData.amount < amount) {
      return res.status(400).json({
        status: 400,
        message: `Không đủ số lượng vé cho loại ${typeTicketData?.name}`,
      });
    }
  }
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const createdTicketIds = [];
    for (const ticketC of ticketChose) {
      const { ticket, amount } = ticketC;

      const typeTicketData = await TypeTicketModel.findById(ticket)
        .populate('promotion')
        .session(session);
      // if (!typeTicketData || typeTicketData.amount < amount) {
      //   return res.status(400).json({
      //     status: 400,
      //     message: `Không đủ số lượng vé cho loại ${typeTicketData?.name}`,
      //   });
      // }

      typeTicketData.amount -= amount;
      await typeTicketData.save({ session });

      const hasValidPromotion =
        typeTicketData?.promotion?.status === 'Ongoing' ||
        typeTicketData?.promotion?.status === 'NotStarted';

      const ticketsToCreate = Array.from({ length: amount }, () => ({
        price: typeTicketData.type === 'Paid' ? typeTicketData.price : 0,
        typeTicket: typeTicketData._id,
        qrCode: generateUniqueID(),
        showTime,
        event,
        current_owner: idUser,
        status: 'Reserved',
        ...(hasValidPromotion && {
          promotion: typeTicketData.promotion._id,
          discountType: typeTicketData.promotion.discountType,
          discountValue: typeTicketData.promotion.discountValue,
        }),
      }));

      const createdTickets = await TicketModel.insertMany(ticketsToCreate, {
        session,
      });
      const ticketIds = createdTickets.map((ticket) => ticket._id); // Lấy ID từ mỗi vé
      createdTicketIds.push(...ticketIds); // Thêm ID vào danh sách
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: 200,
      message: 'Đặt vé thành công',
      data: createdTicketIds,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);

    res.status(400).json({
      status: 400,
      message: `abc ${error.message}`,
    });
  }
});

const getByIdUser = asyncHandle(async (req, res) => {
  const { idUser, typeFilter } = req.query;
  let id = new mongoose.Types.ObjectId(idUser);
  const data = await TicketModel.aggregate([
    {
      $match: { current_owner: id, status: { $ne: 'Reserved' } },
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
      $group: {
        _id: {
          invoice: '$invoice',
        },

        ticketsPurchase: {
          //  "$$ROOT" lấy toàn bộ
          $push: {
            _id: '$_id',
            // price: "$price",
            // isCheckIn: "$isCheckIn",
            // qrCode: "$qrCode",
            // status: "$status",
            // createdAt: "$createdAt",
            invoice: '$invoice',
            // typeTicket: "$typeTicket",
            showTime: '$showTime',
            // current_owner: "$current_owner",
            event: '$event',
            // typeTicketDetails: { $arrayElemAt: ["$typeTicketDetails", 0] },
          },
        },
      },
    },
    {
      $lookup: {
        from: 'invoices',
        localField: 'ticketsPurchase.invoice',
        foreignField: '_id',
        as: 'invoiceDetails',
        pipeline: [
          {
            $project: {
              // 'address': 0,
              // 'updatedAt': 0,
              // '__v': 0,
              invoiceCode: 1,
              totalTicket: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: 'showtimes', // Tên collection invoices
        localField: 'ticketsPurchase.showTime', // Khóa local (trong _id)
        foreignField: '_id', // Khóa trong collection invoices
        as: 'showTimeDetails', // Tên trường chứa dữ liệu liên kết
        pipeline: [
          {
            $project: {
              typeTickets: 0,
              createdAt: 0,
              updatedAt: 0,
              __v: 0,
            },
          },
          // { $match: {status:{$ne:'OnSale'}}, },
        ],
      },
    },
    {
      $lookup: {
        from: 'events', // Tên collection invoices
        localField: 'ticketsPurchase.event', // Khóa local (trong _id)
        foreignField: '_id', // Khóa trong collection invoices
        as: 'eventDetails', // Tên trường chứa dữ liệu liên kết
        pipeline: [
          {
            $project: {
              // '_id': 1,
              // 'title': 1,
              // 'Address': 1,
              // 'Location': 1,
              // 'position': 1,
              // 'statusEvent': 1,
              // 'photoUrl':1

              title: 1,
              Address: 1,
              Location: 1,
            },
          },
        ],
      },
    },
    {
      $sort: {
        'showTimeDetails.startDate': 1,
      },
    },
    {
      $project: {
        _id: 0,
        ticketsPurchase: 1,
        invoiceDetails: { $arrayElemAt: ['$invoiceDetails', 0] },
        showTimeDetails: { $arrayElemAt: ['$showTimeDetails', 0] },
        eventDetails: { $arrayElemAt: ['$eventDetails', 0] },
      },
    },
    // { $limit : 2}
  ]);

  let datafilter = data;
  if (typeFilter === 'UpComing') {
    datafilter = datafilter.filter(
      (ticket) =>
        ticket.showTimeDetails.status !== 'Canceled' &&
        ticket.showTimeDetails.status !== 'Ended'
    );
  } else if (typeFilter === 'Ended') {
    datafilter = datafilter.filter(
      (ticket) => ticket.showTimeDetails.status === 'Ended'
    );
  } else if (typeFilter === 'Canceled') {
    datafilter = datafilter.filter(
      (ticket) => ticket.showTimeDetails.status === 'Canceled'
    );
  }
  res.status(200).json({
    status: 200,
    message: 'Đặt asdsad công',
    data: datafilter,
  });
});

const getByIdInvoice = asyncHandle(async (req, res) => {
  const { idInvoice } = req.query;
  let id = new mongoose.Types.ObjectId(idInvoice);
  const data = await TicketModel.aggregate([
    {
      $match: { invoice: id, status: { $ne: 'Reserved' } },
    },
    {
      $lookup: {
        from: 'typetickets', // Tên collection invoices
        localField: 'typeTicket', // Khóa local (trong _id)
        foreignField: '_id', // Khóa trong collection invoices
        as: 'typeTicketDetails', // Tên trường chứa dữ liệu liên kết
        pipeline: [
          {
            $project: {
              description: 0,
              amount: 0,
              startSaleTime: 0,
              endSaleTime: 0,
              createdAt: 0,
              updatedAt: 0,
              __v: 0,
            },
          },
        ],
      },
    },
    {
      $group: {
        _id: {
          invoice: '$invoice',
        },

        ticketsPurchase: {
          //  "$$ROOT" lấy toàn bộ
          $push: {
            _id: '$_id',
            price: '$price',
            isCheckIn: '$isCheckIn',
            qrCode: '$qrCode',
            status: '$status',
            createdAt: '$createdAt',
            invoice: '$invoice',
            typeTicket: '$typeTicket',
            showTime: '$showTime',
            current_owner: '$current_owner',
            event: '$event',
            discountType: '$discountType',
            discountValue: '$discountValue',
            promotion: '$promotion',
            typeTicketDetails: { $arrayElemAt: ['$typeTicketDetails', 0] },
          },
        },
      },
    },
    {
      $lookup: {
        from: 'invoices',
        localField: 'ticketsPurchase.invoice',
        foreignField: '_id',
        as: 'invoiceDetails',
        pipeline: [
          {
            $project: {
              address: 0,
              updatedAt: 0,
              __v: 0,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: 'showtimes', // Tên collection invoices
        localField: 'ticketsPurchase.showTime', // Khóa local (trong _id)
        foreignField: '_id', // Khóa trong collection invoices
        as: 'showTimeDetails', // Tên trường chứa dữ liệu liên kết
        pipeline: [
          {
            $project: {
              typeTickets: 0,
              createdAt: 0,
              updatedAt: 0,
              __v: 0,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: 'events', // Tên collection invoices
        localField: 'ticketsPurchase.event', // Khóa local (trong _id)
        foreignField: '_id', // Khóa trong collection invoices
        as: 'eventDetails', // Tên trường chứa dữ liệu liên kết
        pipeline: [
          {
            $project: {
              _id: 1,
              title: 1,
              Address: 1,
              Location: 1,
              position: 1,
              statusEvent: 1,
              photoUrl: 1,
            },
          },
        ],
      },
    },
    {
      $sort: {
        'showTimeDetails.startDate': 1,
      },
    },
    {
      $project: {
        _id: 0,
        ticketsPurchase: 1,
        invoiceDetails: { $arrayElemAt: ['$invoiceDetails', 0] },
        showTimeDetails: { $arrayElemAt: ['$showTimeDetails', 0] },
        eventDetails: { $arrayElemAt: ['$eventDetails', 0] },
      },
    },
  ]);

  res.status(200).json({
    status: 200,
    message: 'Đặt asdsad công',
    data: data,
  });
});

const getSalesSumaryByIdShowTime = asyncHandle(async (req, res) => {
  const { idShowTime } = req.query;
  if (!idShowTime) {
    return res.status(404).json({
      status: 404,
      message: 'Hẫy truyền idShowTime',
    });
  }
  const showTime = await ShowTimeModel.findById(idShowTime)
    .populate({
      path: 'typeTickets',
      select: 'amount price promotion',
      populate: {
        path: 'promotion',
        select: 'discountType discountValue status',
      },
    })
    .select('typeTickets');
  if (!showTime) {
    return res.status(404).json({
      status: 404,
      message: 'Suất diễn không tồn tại',
    });
  }
  const totalAmount = showTime.typeTickets.reduce(
    (sum, ticket) => sum + ticket.amount,
    0
  );
  const renderPrice = (ticket) => {
    if (ticket?.promotion) {
      const promotion = ticket.promotion;
      if (promotion.status === 'Ongoing') {
        if (promotion.discountType === 'Percentage') {
          return (ticket.price * (100 - promotion.discountValue)) / 100;
        } else {
          if (ticket.price - promotion.discountValue < 0) {
            return 0;
          }
          return ticket.price - promotion.discountValue;
        }
      }
    }
    return ticket.price;
  };
  const totalRevenue = showTime.typeTickets.reduce(
    (sum, ticket) => sum + renderPrice(ticket) * ticket.amount,
    0
  );

  try {
    let id = new mongoose.Types.ObjectId(idShowTime);
    const totalTicketSoldAndtotalRevenue = await TicketModel.aggregate([
      {
        $match: { showTime: id, status: { $ne: 'Reserved' } },
      },
      {
        $addFields: {
          finalPrice: {
            $cond: [
              { $eq: ['$discountType', 'FixedAmount'] },
              { $subtract: ['$price', '$discountValue'] },
              {
                $cond: [
                  { $eq: ['$discountType', 'Percentage'] },
                  {
                    $subtract: [
                      '$price',
                      {
                        $multiply: [
                          '$price',
                          { $divide: ['$discountValue', 100] },
                        ],
                      },
                    ],
                  },
                  '$price',
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalTicketsSold: { $sum: 1 },
          totalRevenueSold: { $sum: '$finalPrice' },
          totalTicketsCheckedIn: {
            $sum: {
              $cond: [{ $eq: ['$isCheckIn', true] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalRevenueSold: 1,
          totalTicketsSold: 1,
          totalTicketsCheckedIn: 1,
        },
      },
    ]);

    const typeTicketSoldAndtotalRevenue = await ShowTimeModel.aggregate([
      {
        $match: { _id: id },
      },
      {
        $project: {
          typeTickets: 1,
        },
      },
      {
        $lookup: {
          from: 'tickets',
          localField: 'typeTickets',
          foreignField: 'typeTicket',
          as: 'ticketDetails',
        },
      },
      {
        $unwind: {
          path: '$typeTickets', // Tách từng loại vé trong `typeTickets`
          preserveNullAndEmptyArrays: true, // Đảm bảo các loại vé không bị loại bỏ
        },
      },
      {
        $lookup: {
          from: 'tickets',
          localField: 'typeTickets',
          foreignField: 'typeTicket',
          as: 'soldTickets',
        },
      },
      {
        $addFields: {
          soldTickets: {
            $filter: {
              input: '$soldTickets',
              as: 'ticket',
              cond: { $eq: ['$$ticket.status', 'Sold'] }, // chỉ lấy những thẻ đã bán
            },
          },
        },
        $addFields: {
          soldTicketsIsCheckedIn: {
            $filter: {
              input: '$soldTickets',
              as: 'ticket',
              cond: { $eq: ['$$ticket.isCheckIn', true] }, // chỉ lấy những thẻ đã bán
            },
          },
        },
      },
      {
        $group: {
          _id: '$typeTickets',
          priceSold: {
            $push: '$soldTickets.price',
          },
          typeTicket: { $push: '$typeTickets' },
          totalSold: { $sum: { $size: '$soldTickets' } },
          totalCheckIn: { $sum: { $size: '$soldTicketsIsCheckedIn' } },
        },
      },
      {
        $project: {
          _id: 0,
          totalSold: 1,
          totalCheckIn: 1,
          priceSold: 1,
          typeTicket: { $arrayElemAt: ['$typeTicket', 0] },
        },
      },
      {
        $lookup: {
          from: 'typetickets',
          localField: 'typeTicket',
          foreignField: '_id',
          as: 'ticketDetails',
          pipeline: [
            {
              $project: {
                name: 1,
                amount: 1,
                price: 1,
                promotion: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'promotions',
          localField: 'ticketDetails.promotion',
          foreignField: '_id',
          as: 'promotionDetails',
          pipeline: [
            {
              $project: {
                discountType: 1,
                discountValue: 1,
                status: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          _id: 0,
          totalSold: 1,
          totalCheckIn: 1,
          priceSold: { $arrayElemAt: ['$priceSold', 0] },
          typeTicket: { $arrayElemAt: ['$ticketDetails', 0] },
          promotion: { $arrayElemAt: ['$promotionDetails', 0] },
        },
      },
    ]);
    if (totalTicketSoldAndtotalRevenue[0] === undefined) {
      totalTicketSoldAndtotalRevenue[0] = {
        totalRevenueSold: 0,
        totalTicketsSold: 0,
        totalTicketsCheckedIn: 0,
      };
    }
    return res.status(200).json({
      status: 200,
      message: 'Đặt asdsad công',
      data: {
        totalTicketSoldAndtotalRevenue: {
          ...totalTicketSoldAndtotalRevenue[0],
          totalAmount:
            totalAmount +
            (totalTicketSoldAndtotalRevenue[0]?.totalTicketsSold
              ? totalTicketSoldAndtotalRevenue[0]?.totalTicketsSold
              : 0),
          totalRevenue:
            totalRevenue + totalTicketSoldAndtotalRevenue[0].totalRevenueSold,
        },

        typeTicketSoldAndtotalRevenue,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error,
    });
  }
});

const statisticalCheckinByIdShowTime = asyncHandle(async (req, res) => {
  const { idShowTime } = req.query;
  let id = new mongoose.Types.ObjectId(idShowTime);
  try {
    const data = await TicketModel.aggregate([
      {
        $match: { showTime: id, status: { $ne: 'Reserved' } },
      },
    ]);
    return res.status(200).json({
      status: 200,
      message: 'Thành công thành công',
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error,
    });
  }
});

const getByIdShowTime = asyncHandle(async (req, res) => {
  const { idShowTime, page = 1, limit = 3 } = req.query;
  let id = new mongoose.Types.ObjectId(idShowTime);
  const data = await TicketModel.aggregate([
    {
      $match: { showTime: id, status: { $ne: 'Reserved' } },
    },
    {
      $lookup: {
        from: 'typetickets', // Tên collection invoices
        localField: 'typeTicket', // Khóa local (trong _id)
        foreignField: '_id', // Khóa trong collection invoices
        as: 'typeTicketDetails', // Tên trường chứa dữ liệu liên kết
        pipeline: [
          {
            $project: {
              description: 0,
              amount: 0,
              startSaleTime: 0,
              endSaleTime: 0,
              status: 0,
              createdAt: 0,
              updatedAt: 0,
              __v: 0,
            },
          },
        ],
      },
    },
    {
      $group: {
        _id: {
          invoice: '$invoice',
        },

        ticketsPurchase: {
          //  "$$ROOT" lấy toàn bộ
          $push: {
            _id: '$_id',
            price: '$price',
            isCheckIn: '$isCheckIn',
            qrCode: '$qrCode',
            status: '$status',
            createdAt: '$createdAt',
            invoice: '$invoice',
            typeTicket: '$typeTicket',
            showTime: '$showTime',
            current_owner: '$current_owner',
            event: '$event',
            typeTicketDetails: { $arrayElemAt: ['$typeTicketDetails', 0] },
          },
        },
      },
    },
    {
      $lookup: {
        from: 'invoices',
        localField: 'ticketsPurchase.invoice',
        foreignField: '_id',
        as: 'invoiceDetails',
        pipeline: [
          {
            $project: {
              address: 0,
              updatedAt: 0,
              __v: 0,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: 'showtimes', // Tên collection invoices
        localField: 'ticketsPurchase.showTime', // Khóa local (trong _id)
        foreignField: '_id', // Khóa trong collection invoices
        as: 'showTimeDetails', // Tên trường chứa dữ liệu liên kết
        pipeline: [
          {
            $project: {
              typeTickets: 0,
              createdAt: 0,
              updatedAt: 0,
              __v: 0,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: 'events', // Tên collection invoices
        localField: 'ticketsPurchase.event', // Khóa local (trong _id)
        foreignField: '_id', // Khóa trong collection invoices
        as: 'eventDetails', // Tên trường chứa dữ liệu liên kết
        pipeline: [
          {
            $project: {
              _id: 1,
              title: 1,
              Address: 1,
              Location: 1,
              position: 1,
              statusEvent: 1,
              photoUrl: 1,
            },
          },
        ],
      },
    },
    {
      $sort: {
        'invoiceDetails.createdAt': 1,
      },
    },
    {
      $project: {
        _id: 0,
        ticketsPurchase: 1,
        invoiceDetails: { $arrayElemAt: ['$invoiceDetails', 0] },
        showTimeDetails: { $arrayElemAt: ['$showTimeDetails', 0] },
        eventDetails: { $arrayElemAt: ['$eventDetails', 0] },
      },
    },
  ]);

  const totalInvoice = data.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedInvoice = data.slice(startIndex, endIndex);

  res.status(200).json({
    status: 200,
    message: 'Đặt asdsad công',
    data: paginatedInvoice,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalInvoice / limit),
      totalItems: totalInvoice,
      limit: parseInt(limit),
    },
  });
});

const getSalesCharts = asyncHandle(async (req, res) => {
  const { idShowTime } = req.query;

  if (!mongoose.Types.ObjectId.isValid(idShowTime)) {
    return res.status(400).json({
      status: 400,
      message: 'idShowTime không hợp lệ',
    });
  }

  try {
    const showTimeId = new mongoose.Types.ObjectId(idShowTime);

    const result = await TicketModel.aggregate([
      // 1. Lọc theo showTime và status
      {
        $match: {
          showTime: showTimeId,
          status: { $ne: 'Reserved' },
        },
      },

      // 2. Tính giá sau giảm
      {
        $addFields: {
          discountedPrice: {
            $cond: [
              { $eq: ['$discountType', 'FixedAmount'] },
              { $subtract: ['$price', '$discountValue'] },
              {
                $cond: [
                  { $eq: ['$discountType', 'Percentage'] },
                  {
                    $subtract: [
                      '$price',
                      {
                        $multiply: [
                          '$price',
                          { $divide: ['$discountValue', 100] },
                        ],
                      },
                    ],
                  },
                  '$price',
                ],
              },
            ],
          },
        },
      },

      // 3. Tạo field tháng từ createdAt
      {
        $addFields: {
          month: {
            $dateToString: { format: '%m-%Y', date: '$createdAt' },
          },
        },
      },

      // 4. Nhóm theo tháng
      {
        $group: {
          _id: '$month',
          revenue: { $sum: '$discountedPrice' },
          ticketSold: { $sum: 1 },
        },
      },

      // 5. Định dạng kết quả
      {
        $project: {
          _id: 0,
          month: '$_id',
          revenue: 1,
          ticketSold: 1,
        },
      },

      // 6. Sắp xếp tăng dần theo tháng
      {
        $sort: {
          month: 1,
        },
      },
    ]);

    return res.status(200).json({
      status: 200,
      message: 'Thành công',
      data: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: 'Lỗi server',
      error: error.message,
    });
  }
});

module.exports = {
  getAll,
  reserveTicket,
  getByIdUser,
  getByIdInvoice,
  getSalesSumaryByIdShowTime,
  statisticalCheckinByIdShowTime,
  getByIdShowTime,
  getSalesCharts,
};
