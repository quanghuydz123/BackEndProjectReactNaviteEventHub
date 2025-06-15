const asyncHandle = require('express-async-handler');
const TypeTicketModel = require('../models/TypeTicketModel');
const { mongoose } = require('mongoose');
const ShowTimeModel = require('../models/ShowTimeModel');
const EventModel = require('../models/EventModel');
const TicketModel = require('../models/TicketModel');
const EmailService = require('../service/EmailService');
const notificationController = require('./notificationController');
const UserModel = require('../models/UserModel');
const NotificationModel = require('../models/NotificationModel');
const OrganizerModel = require('../models/OrganizerModel');
const { GetTime, GetDateShortNew } = require('../utils/dateTime');

const getAll = asyncHandle(async (req, res) => {
  res.status(200).json({
    status: 200,
    message: 'Thêm thành công',
  });
});

const createTypeTicket = asyncHandle(async (req, res) => {
  const {
    name,
    description,
    type,
    price,
    startSaleTime,
    endSaleTime,
    amount,
    idShowTime,
    idEvent,
  } = req.body;
  if (!startSaleTime || !endSaleTime || !name || !idShowTime || !idEvent) {
    return res.status(404).json({
      status: 404,
      message: 'Phải nhập đầy đủ thông tin !!!',
    });
  }
  const showTime = await ShowTimeModel.findById(idShowTime);
  if (!showTime) {
    return res.status(404).json({
      status: 404,
      message: 'Suất diễn không tồn tại !!!',
    });
  }
  const event = await EventModel.findById(idEvent);
  if (!event) {
    return res.status(404).json({
      status: 404,
      message: 'Sự kiện không tồn tại !!!',
    });
  }
  if (new Date(endSaleTime) > new Date(showTime.startDate)) {
    return res.status(404).json({
      status: 404,
      message:
        'Thời gian bán vé phải nhỏ hơn thời gian bắt đầu của suất diễn !!!',
    });
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  const currentTime = new Date();

  try {
    const typeTicketCreate = new TypeTicketModel(req.body);
    if (currentTime < new Date(startSaleTime)) {
      typeTicketCreate.status = 'NotStarted';
    } else if (
      currentTime >= new Date(startSaleTime) &&
      currentTime <= new Date(endSaleTime)
    ) {
      typeTicketCreate.status = 'OnSale';
    }

    const typeTicket = await typeTicketCreate.save({ session });

    await ShowTimeModel.findByIdAndUpdate(
      idShowTime,
      { $push: { typeTickets: typeTicket._id } },
      { session }
    );

    const tickets = await TypeTicketModel.find({
      _id: { $in: showTime.typeTickets },
    });

    tickets.push(typeTicket); //thêm loại vé mới vào để kiểm tra

    const allNotYetOnSale = tickets.every(
      (ticket) => ticket.status === 'NotStarted'
    );
    const allSoldOut = tickets.every((ticket) => ticket.status === 'SoldOut');
    const allSaleStopped = tickets.every((ticket) => ticket.status === 'Ended');
    const anyOnSale = tickets.some((ticket) => ticket.status === 'OnSale');
    if (allNotYetOnSale) {
      showTime.status = 'NotYetOnSale';
    } else if (allSoldOut) {
      showTime.status = 'SoldOut';
    } else if (allSaleStopped) {
      showTime.status = 'SaleStopped';
    } else if (anyOnSale) {
      showTime.status = 'OnSale';
    }
    await showTime.save({ session });

    const showTimes = await ShowTimeModel.find({
      _id: { $in: event.showTimes },
    });
    showTimes.forEach((showtime) => {
      //cập nhập trang thái mới nhất cho suất diễn
      if (showtime._id.toString() === idShowTime) {
        showtime.status = showTime.status;
      }
    });

    const allSoldOutEvent = showTimes.every(
      (showTime) => showTime.status === 'SoldOut'
    );
    const allSaleStoppedEvent = showTimes.every(
      (showTime) => showTime.status === 'SaleStopped'
    );
    const allNotYetOnSaleEvent = showTimes.every(
      (showTime) => showTime.status === 'NotYetOnSale'
    );
    const anyOnSaleEvent = showTimes.some(
      (showTime) => showTime.status === 'OnSale'
    );
    if (allSoldOutEvent) {
      event.statusEvent = 'SoldOut';
    } else if (allSaleStoppedEvent) {
      event.statusEvent = 'SaleStopped';
    } else if (allNotYetOnSaleEvent) {
      event.statusEvent = 'NotYetOnSale';
    } else if (anyOnSaleEvent) {
      event.statusEvent = 'OnSale';
    }

    await event.save({ session });
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({
      status: 200,
      message: 'Thêm thành công',
      data: typeTicket,
    });
  } catch (error) {
    await session.abortTransaction(); // Rollback transaction nếu có lỗi
    session.endSession();
    res.status(500).json({
      status: 500,
      message: 'Lỗi khi thêm typeTicket',
    });
  }
});

const updateStatusTypeTicket = asyncHandle(async (req, res) => {
  const typeTickets = await TypeTicketModel.find();
  const currentTime = new Date();
  await Promise.all(
    typeTickets.map(async (typeTicket) => {
      if (typeTicket.status !== 'Canceled') {
        if (currentTime < typeTicket.startSaleTime) {
          typeTicket.status = 'NotStarted';
        } else if (
          currentTime >= typeTicket.startSaleTime &&
          currentTime <= typeTicket.endSaleTime
        ) {
          typeTicket.status = 'OnSale';
          if (typeTicket.amount === 0) {
            typeTicket.status = 'SoldOut';
          }
        } else if (currentTime > typeTicket.endSaleTime) {
          typeTicket.status = 'Ended';
        }
        await typeTicket.save();
      }
    })
  );
  res.status(200).json({
    status: 200,
    message: 'Thêm thành công',
  });
});

const updateTypeTicket = asyncHandle(async (req, res) => {
  const {
    name,
    description,
    type,
    price,
    startSaleTime,
    endSaleTime,
    amount,
    idShowTime,
    idTypeTicket,
    idEvent,
  } = req.body;
  if (
    !startSaleTime ||
    !endSaleTime ||
    !name ||
    amount === undefined ||
    amount === null ||
    !idShowTime ||
    !idTypeTicket ||
    !idEvent
  ) {
    return res.status(404).json({
      status: 404,
      message: 'Phải nhập đầy đủ thông tin !!!',
    });
  }
  const showTime = await ShowTimeModel.findById(idShowTime);
  if (!showTime) {
    return res.status(404).json({
      status: 404,
      message: 'Suất diễn không tồn tại !!!',
    });
  }
  const typeTicket = await TypeTicketModel.findById(idTypeTicket);
  if (!typeTicket) {
    return res.status(404).json({
      status: 404,
      message: 'Loại vé không tồn tại !!!',
    });
  }
  const event = await EventModel.findById(idEvent);
  if (!event) {
    return res.status(404).json({
      status: 404,
      message: 'Sự kiện không tồn tại !!!',
    });
  }
  if (new Date(endSaleTime) > new Date(showTime.startDate)) {
    return res.status(404).json({
      status: 404,
      message:
        'Thời gian bán vé phải nhỏ hơn thời gian bắt đầu của suất diễn !!!',
    });
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  const currentTime = new Date();

  try {
    if (currentTime < new Date(startSaleTime)) {
      typeTicket.status = 'NotStarted';
    } else if (
      currentTime >= new Date(startSaleTime) &&
      currentTime <= new Date(endSaleTime)
    ) {
      typeTicket.status = 'OnSale';
      if (amount === 0) {
        typeTicket.status = 'SoldOut';
      }
    } else if (currentTime > new Date(endSaleTime)) {
      typeTicket.status = 'Ended';
    }
    typeTicket.name = name;
    typeTicket.price = price;
    typeTicket.description = description;
    typeTicket.type = type;
    typeTicket.startSaleTime = startSaleTime;
    typeTicket.endSaleTime = endSaleTime;
    typeTicket.amount = amount;
    const data = await typeTicket.save({ session });
    const tickets = await TypeTicketModel.find({
      _id: { $in: showTime.typeTickets },
    });

    tickets.forEach((ticket) => {
      //cập nhập trang thái mới nhất cho loại vé cập nhập
      if (ticket._id.toString() === idTypeTicket) {
        ticket.status = typeTicket.status;
      }
    });

    const allNotYetOnSale = tickets.every(
      (ticket) => ticket.status === 'NotStarted'
    );
    const allSoldOut = tickets.every((ticket) => ticket.status === 'SoldOut');
    const allSaleStopped = tickets.every((ticket) => ticket.status === 'Ended');
    const anyOnSale = tickets.some((ticket) => ticket.status === 'OnSale');
    if (allNotYetOnSale) {
      showTime.status = 'NotYetOnSale';
    } else if (allSoldOut) {
      showTime.status = 'SoldOut';
    } else if (allSaleStopped) {
      showTime.status = 'SaleStopped';
    } else if (anyOnSale) {
      showTime.status = 'OnSale';
    }
    await showTime.save({ session });

    const showTimes = await ShowTimeModel.find({
      _id: { $in: event.showTimes },
    });
    showTimes.forEach((showtime) => {
      //cập nhập trang thái mới nhất cho suất diễn
      if (showtime._id.toString() === idShowTime) {
        showtime.status = showTime.status;
      }
    });

    const allSoldOutEvent = showTimes.every(
      (showTime) => showTime.status === 'SoldOut'
    );
    const allSaleStoppedEvent = showTimes.every(
      (showTime) => showTime.status === 'SaleStopped'
    );
    const allNotYetOnSaleEvent = showTimes.every(
      (showTime) => showTime.status === 'NotYetOnSale'
    );
    const anyOnSaleEvent = showTimes.some(
      (showTime) => showTime.status === 'OnSale'
    );
    if (allSoldOutEvent) {
      event.statusEvent = 'SoldOut';
    } else if (allSaleStoppedEvent) {
      event.statusEvent = 'SaleStopped';
    } else if (allNotYetOnSaleEvent) {
      event.statusEvent = 'NotYetOnSale';
    } else if (anyOnSaleEvent) {
      event.statusEvent = 'OnSale';
    }

    await event.save({ session });
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({
      status: 200,
      message: 'Cập nhập thành công',
      data: data,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      status: 500,
      message: 'Lỗi khi thêm typeTicket',
    });
  }
});
const deleteTypeTicket = asyncHandle(async (req, res) => {
  const { idShowTime, idTypeTicket, idEvent } = req.body;
  if (!idShowTime || !idTypeTicket || !idEvent) {
    return res
      .status(404)
      .json({ status: 404, message: 'Thiếu dữ liệu, vui lòng thử lại.' });
  }

  const [showTime, typeTicket, event] = await Promise.all([
    ShowTimeModel.findById(idShowTime),
    TypeTicketModel.findById(idTypeTicket),
    EventModel.findById(idEvent),
  ]);
  if (!showTime || !typeTicket || !event) {
    return res
      .status(404)
      .json({ status: 404, message: 'Dữ liệu không tồn tại.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const ticketCount = await TicketModel.countDocuments({
      typeTicket: idTypeTicket,
    });

    if (ticketCount > 0) {
      const invoices = await TicketModel.aggregate([
        {
          $match: {
            typeTicket: new mongoose.Types.ObjectId(idTypeTicket),
            invoice: { $ne: null },
            status: { $nin: ['Reserved', 'Canceled'] },
          },
        },
        {
          $lookup: {
            from: 'invoices',
            localField: 'invoice',
            foreignField: '_id',
            as: 'invoiceInfo',
          },
        },
        { $unwind: '$invoiceInfo' },
        {
          $lookup: {
            from: 'typetickets',
            localField: 'typeTicket',
            foreignField: '_id',
            as: 'typeTicketInfo',
            pipeline: [{ $project: { name: 1 } }],
          },
        },
        { $unwind: '$typeTicketInfo' },
        {
          $lookup: {
            from: 'users',
            localField: 'current_owner',
            foreignField: '_id',
            as: 'userInfo',
            pipeline: [{ $project: { fcmTokens: 1 } }],
          },
        },
        { $unwind: '$userInfo' },
        {
          $lookup: {
            from: 'showtimes',
            localField: 'showTime',
            foreignField: '_id',
            as: 'showTimeInfo',
            pipeline: [{ $project: { startDate: 1, endDate: 1 } }],
          },
        },
        { $unwind: '$showTimeInfo' },
        {
          $lookup: {
            from: 'events',
            localField: 'event',
            foreignField: '_id',
            as: 'eventInfo',
            pipeline: [{ $project: { title: 1, photoUrl: 1, authorId: 1 } }],
          },
        },
        { $unwind: '$eventInfo' },
        {
          $group: {
            _id: '$invoice',
            tickets: {
              $push: {
                price: '$price',
                discountType: '$discountType',
                discountValue: '$discountValue',
              },
            },
            invoiceInfo: { $first: '$invoiceInfo' },
            typeTicketInfo: { $first: '$typeTicketInfo' },
            showTimeInfo: { $first: '$showTimeInfo' },
            eventInfo: { $first: '$eventInfo' },
            userInfo: { $first: '$userInfo' },
          },
        },
      ]);
      let fcmTokens = [];
      let usersPurchased = [];
      for (const invoice of invoices) {
        const totalBeforeDiscount =
          invoice.invoiceInfo.totalPrice +
          invoice.invoiceInfo.totalDiscountByCoin;
        let totalRefundTicketPrice = 0;
        for (const ticket of invoice.tickets) {
          if (ticket.discountType === 'Percentage') {
            totalRefundTicketPrice +=
              ticket.price * (1 - ticket.discountValue / 100);
          } else if (ticket.discountType) {
            totalRefundTicketPrice += ticket.price - ticket.discountValue;
          } else {
            totalRefundTicketPrice += ticket.price;
          }
          await TicketModel.findByIdAndUpdate(
            ticket._id,
            {
              status: 'Canceled',
            },
            { session }
          );
        }
        const refundRate = totalRefundTicketPrice / totalBeforeDiscount;
        const refundCoin = Math.round(
          refundRate * invoice.invoiceInfo.totalDiscountByCoin
        );
        const refundCash = Math.round(totalRefundTicketPrice - refundCoin);
        fcmTokens = fcmTokens.concat(invoice?.userInfo?.fcmTokens);
        usersPurchased.push(invoice?.userInfo._id);
        if (refundCoin > 0) {
          await UserModel.findByIdAndUpdate(
            invoice.userInfo?._id,
            {
              $inc: { totalCoins: refundCoin },
            },
            { session }
          );
        }
        EmailService.handleSendMailRefund(
          {
            nameTypeTicket: invoice?.typeTicketInfo?.name,
            titleEvent: invoice?.eventInfo?.title,
            startDate: invoice?.showTimeInfo?.startDate,
            totalRefund: refundCash,
            totalRenfundIcon: refundCoin,
            invoiceCode: invoice?.invoiceInfo?.invoiceCode,
            purchaseDate: invoice?.invoiceInfo?.createdAt,
            totalPurchase: invoice?.tickets?.length,
            fullName: invoice?.invoiceInfo?.fullname,
          },
          invoice?.invoiceInfo?.email
        );
      }
      const uniqueFcmTokens = [...new Set(fcmTokens)];
      const uniqueUsersPruchased = [
        ...new Set(usersPurchased.map((id) => id.toString())),
      ];
      const organizers = await OrganizerModel.findById(
        invoices[0]?.eventInfo?.authorId
      ).select('user');
      if (uniqueUsersPruchased && uniqueUsersPruchased.length > 0) {
        await Promise.all(
          uniqueUsersPruchased.map(async (user) => {
            const notification = new NotificationModel({
              senderID: organizers.user,
              recipientId: user,
              eventId: invoices[0]?.eventInfo?._id,
              type: 'newEvent',
              content: `Đã hủy vé ${
                invoices[0]?.typeTicketInfo?.name
              } ${GetTime(
                invoices[0].showTimeInfo?.startDate
              )} Ngày ${GetDateShortNew(
                invoices[0].showTimeInfo?.startDate
              )} ở sự kiện ${
                invoices[0]?.eventInfo?.title
              } vui lòng xem chi tiết trong email của bạn`,
            });
            await notification.save({ session });
          })
        );
      }

      if (uniqueFcmTokens.length > 0) {
        await Promise.all(
          uniqueFcmTokens.map(async (fcmToken) => {
            try {
              await notificationController.handleSendNotification({
                fcmToken: fcmToken,
                title: 'Thông báo hủy vé',
                subtitle: '',
                body: `Đã hủy vé ${invoices[0]?.typeTicketInfo?.name} ${GetTime(
                  invoices[0].showTimeInfo?.startDate
                )} Ngày ${GetDateShortNew(
                  invoices[0].showTimeInfo?.startDate
                )} ở sự kiện ${
                  invoices[0]?.eventInfo?.title
                } vui lòng xem chi tiết trong email của bạn`,
                image: invoices[0]?.eventInfo?.photoUrl ?? '',
                data: {
                  id: invoices[0]?.eventInfo?._id.toString(),
                  type: 'NewEvent',
                },
              });
            } catch (error) {
              console.error(
                `Error sending notification to ${fcmToken}:`,
                error
              );
            }
          })
        );
      }
      typeTicket.status = 'Canceled';
      await typeTicket.save({ session });
    } else {
      await TypeTicketModel.findByIdAndDelete(idTypeTicket, { session });
      showTime.typeTickets = showTime.typeTickets.filter(
        (ticketId) => ticketId.toString() !== idTypeTicket
      );
    }

    const remainingTypeTickets = await TypeTicketModel.find({
      _id: { $in: showTime.typeTickets },
    }).session(session);
    updateShowTimeStatus(showTime, remainingTypeTickets);
    await showTime.save({ session });

    const showTimes = await ShowTimeModel.find({
      _id: { $in: event.showTimes },
    }).session(session);
    updateEventStatus(event, showTimes);
    await event.save({ session });

    await session.commitTransaction();
    session.endSession();
    res.status(200).json({
      status: 200,
      message: 'Hủy loại vé thành công.',
      data: ticketCount > 0 ? 'purchased' : '',
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({
      status: 500,
      message: 'Đã xảy ra lỗi trong quá trình xóa loại vé.',
    });
  }
});

function updateShowTimeStatus(showTime, typeTickets) {
  if (typeTickets.every((t) => t.status === 'NotStarted')) {
    showTime.status = 'NotYetOnSale';
  } else if (typeTickets.every((t) => t.status === 'SoldOut')) {
    showTime.status = 'SoldOut';
  } else if (typeTickets.every((t) => t.status === 'Ended')) {
    showTime.status = 'SaleStopped';
  } else if (typeTickets.some((t) => t.status === 'OnSale')) {
    showTime.status = 'OnSale';
  } else if (typeTickets.every((t) => t.status === 'Canceled')) {
    showTime.status = 'Canceled';
  }
}

function updateEventStatus(event, showTimes) {
  if (showTimes.every((s) => s.status === 'SoldOut')) {
    event.statusEvent = 'SoldOut';
  } else if (showTimes.every((s) => s.status === 'SaleStopped')) {
    event.statusEvent = 'SaleStopped';
  } else if (showTimes.every((s) => s.status === 'NotYetOnSale')) {
    event.statusEvent = 'NotYetOnSale';
  } else if (showTimes.some((s) => s.status === 'OnSale')) {
    event.statusEvent = 'OnSale';
  } else if (showTimes.every((s) => s.status === 'Canceled')) {
    event.statusEvent = 'Cancelled';
  }
}
module.exports = {
  getAll,
  createTypeTicket,
  updateStatusTypeTicket,
  updateTypeTicket,
  deleteTypeTicket,
};
