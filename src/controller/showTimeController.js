const asyncHandle = require('express-async-handler');
const TypeTicketModel = require('../models/TypeTicketModel');
const { mongoose } = require('mongoose');
const ShowTimeModel = require('../models/ShowTimeModel');
const EventModel = require('../models/EventModel');
const TicketModel = require('../models/TicketModel');
const NotificationModel = require('../models/NotificationModel');
const EmailService = require('../service/EmailService');
const OrganizerModel = require('../models/OrganizerModel');
const notificationController = require('./notificationController');
const { GetTime, GetDateShortNew } = require('../utils/dateTime');

const getAll = asyncHandle(async (req, res) => {
  res.status(400); //ngăn không cho xuống dưới
  throw new Error('Email hoặc mật khẩu không chỉnh xác!!!');
});

const createShowTime = asyncHandle(async (req, res) => {
  const { startDate, endDate, idEvent } = req.body;
  if (!startDate || !endDate || !idEvent) {
    return res.status(400).json({
      status: 400,
      message: 'Phải nhập đầy đủ thông tin !!!',
    });
  }
  const event = await EventModel.findById(idEvent);
  if (!event) {
    return res.status(404).json({
      status: 404,
      message: 'Sự kiện không tồn tại !!!',
    });
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const showTimeCreate = new ShowTimeModel(req.body);
    showTimeCreate.status = 'NotYetOnSale';
    const showtimeCreated = await showTimeCreate.save({ session });

    await EventModel.findByIdAndUpdate(
      idEvent,
      { $push: { showTimes: showtimeCreated._id } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    res.status(200).json({
      status: 200,
      message: 'Thêm thành công',
      data: showtimeCreated,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      status: 500,
      message: 'Lỗi khi thêm showTime',
    });
  }
});

const updateShowTime = asyncHandle(async (req, res) => {
  const { startDate, endDate, idEvent, idShowTime, typeTickets, status } =
    req.body;
  if (!startDate || !endDate || !idEvent || !idShowTime) {
    return res.status(400).json({
      status: 400,
      message: 'Phải nhập đầy đủ thông tin !!!',
    });
  }
  const showTime = await ShowTimeModel.findById(idShowTime).populate(
    'typeTickets',
    '_id endSaleTime'
  );
  const isChangeDate =
    new Date(showTime.startDate).getTime() !== new Date(startDate).getTime() ||
    new Date(showTime.endDate).getTime() !== new Date(endDate).getTime();

  if (!showTime) {
    return res.status(404).json({
      status: 404,
      message: 'Suất diễn không tồn tại !!!',
    });
  }
  const event = await EventModel.findById(idEvent).populate('authorId', 'user');
  if (!event) {
    return res.status(404).json({
      status: 404,
      message: 'Sự kiện không tồn tại !!!',
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const typeTickets = [...showTime.typeTickets];
    const checkEndSale = typeTickets.some(
      (typeTicket) => new Date(typeTicket.endSaleTime) > new Date(startDate)
    );
    if (checkEndSale) {
      return res.status(404).json({
        status: 404,
        message:
          'Thời gian bắt đầu của suất diễn phải lớn hơn hoặc bằng thời gian kết thúc bán vé!!!',
      });
    }
    showTime.startDate = startDate;
    showTime.endDate = endDate;
    const showTimeUpdate = await showTime.save({ session });
    if (showTimeUpdate && isChangeDate) {
      let usersPurchased = [];
      let fcmTokens = [];
      for (const typeTicket of typeTickets) {
        const tickets = await TicketModel.find({ typeTicket: typeTicket.id })
          .select('current_owner')
          .populate('current_owner', 'fcmTokens');
        usersPurchased = tickets.flatMap((item) => item.current_owner._id);
        fcmTokens = tickets.flatMap((item) => item.current_owner.fcmTokens);
      }
      const uniqueFcmTokens = [...new Set(fcmTokens)];
      const uniqueUsersPruchased = [
        ...new Set(usersPurchased.map((id) => id.toString())),
      ];
      if (uniqueFcmTokens.length > 0) {
        await Promise.all(
          uniqueFcmTokens.map(async (fcmToken) => {
            try {
              await notificationController.handleSendNotification({
                fcmToken: fcmToken,
                title: 'Thông báo thay đổi thời gian suất diễn',
                subtitle: '',
                body: `Đã thay đổi thời gian diễn ra vé bạn đã mua ở sự kiện ${event?.title} xin lỗi về sự bất tiện và xem chi tiết tại đây !!`,
                image: event?.photoUrl ?? '',
                data: {
                  id: event._id.toString(),
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
      if (uniqueUsersPruchased && uniqueUsersPruchased.length > 0) {
        await Promise.all(
          uniqueUsersPruchased.map(async (user) => {
            const notification = new NotificationModel({
              senderID: event.authorId?.user,
              recipientId: user._id,
              eventId: event.id,
              type: 'newEvent',
              content: `Đã thay đổi thời gian diễn ra vé bạn đã mua ở sự kiện ${event?.title} xin lỗi về sự bất tiện và xem chi tiết tại đây !!`,
            });
            await notification.save({ session });
          })
        );
      }
    }
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({
      status: 200,
      message: 'Cập nhập thành công',
      data: showTimeUpdate,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      status: 500,
      message: 'Lỗi khi cập nhập showTime',
    });
  }
});

const deleteShowTime = asyncHandle(async (req, res) => {
  const { idEvent, idShowTime } = req.body;
  if (!idEvent || !idShowTime) {
    return res.status(400).json({
      status: 400,
      message: 'Lỗi rồi',
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

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const ticketCount = await TicketModel.countDocuments({
      showTime: idShowTime,
    });
    if (ticketCount > 0) {
      const idstypeTicket = showTime.typeTickets;
      for (const idTypeTicket of idstypeTicket) {
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
        if (uniqueFcmTokens.length > 0) {
          await Promise.all(
            uniqueFcmTokens.map(async (fcmToken) => {
              try {
                await notificationController.handleSendNotification({
                  fcmToken: fcmToken,
                  title: 'Thông báo hủy vé',
                  subtitle: '',
                  body: `Đã hủy vé ${
                    invoices[0]?.typeTicketInfo?.name
                  } ${GetTime(
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
        await TypeTicketModel.findByIdAndUpdate(
          idTypeTicket,
          {
            status: 'Canceled',
          },
          { session }
        );
      }
      showTime.status = 'Canceled';
      await showTime.save({ session });
    } else {
      const showTimeDeleted = await ShowTimeModel.findByIdAndDelete(
        idShowTime,
        { session }
      );
      if (showTimeDeleted && showTimeDeleted.typeTickets) {
        await TypeTicketModel.deleteMany(
          { _id: { $in: showTimeDeleted.typeTickets } },
          { session }
        );
      }
    }

    const showTimes = await ShowTimeModel.find({
      _id: { $in: event.showTimes },
    }).session(session);
    const index = showTimes.findIndex(
      (showTimes) => showTimes._id.toString() === idShowTime
    );
    if (index !== -1) {
      showTimes.splice(index, 1);
    }

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
    const allCancel = showTimes.every(
      (showTime) => showTime.status === 'Canceled'
    );
    if (allSoldOutEvent) {
      event.statusEvent = 'SoldOut';
    } else if (allSaleStoppedEvent) {
      event.statusEvent = 'SaleStopped';
    } else if (allNotYetOnSaleEvent) {
      event.statusEvent = 'NotYetOnSale';
    } else if (anyOnSaleEvent) {
      event.statusEvent = 'OnSale';
    } else if (allCancel) {
      event.statusEvent = 'Canceled';
    }
    event.showTimes = showTimes;
    await event.save({ session });
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({
      status: 200,
      message: 'Xóa showTime thành công',
      data: ticketCount > 0 ? 'purchased' : '',
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      status: 500,
      message: 'Lỗi khi xóa showTime',
    });
  }
});

const updateStatusShowTime = asyncHandle(async (req, res) => {
  const showTimes = await ShowTimeModel.find();
  const currentTime = new Date();
  await Promise.all(
    showTimes.map(async (showTime) => {
      if (showTime.status !== 'Canceled') {
        if (currentTime < showTime.startDate) {
          showTime.status = 'NotStarted';
        } else if (
          currentTime >= showTime.startDate &&
          currentTime <= showTime.endDate
        ) {
          showTime.status = 'Ongoing';
        } else if (currentTime > showTime.endDate) {
          await TicketModel.updateMany(
            { showTime: showTime._id },
            { status: 'Ended' }
          ); //khi suất diễn kết thúc thì cập nhập trạng thái vé là kết thúc
          showTime.status = 'Ended';
        }
        if (showTime.status === 'Ongoing' || showTime.status === 'NotStarted') {
          // Tải trạng thái của tất cả typeTickets liên kết với suất diễn này
          const tickets = await TypeTicketModel.find({
            _id: { $in: showTime.typeTickets },
          });

          const allNotYetOnSale = tickets.every(
            (ticket) => ticket.status === 'NotStarted'
          );
          const allSoldOut = tickets.every(
            (ticket) => ticket.status === 'SoldOut'
          );
          const allSaleStopped = tickets.every(
            (ticket) => ticket.status === 'Ended'
          );
          const anyOnSale = tickets.some(
            (ticket) => ticket.status === 'OnSale'
          );

          if (allNotYetOnSale) {
            showTime.status = 'NotYetOnSale';
          } else if (allSoldOut) {
            showTime.status = 'SoldOut';
          } else if (allSaleStopped) {
            showTime.status = 'SaleStopped';
          } else if (anyOnSale) {
            showTime.status = 'OnSale';
          }
        }
        await showTime.save();
      }
    })
  );
  res.status(200).json({
    status: 200,
    message: 'Thêm thành công',
  });
});
module.exports = {
  getAll,
  createShowTime,
  updateStatusShowTime,
  updateShowTime,
  deleteShowTime,
};
