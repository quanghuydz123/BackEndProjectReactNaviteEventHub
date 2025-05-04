const asyncHandle = require('express-async-handler');
require('dotenv').config();
const EventModel = require('../models/EventModel');
const ShowTimeModel = require('../models/ShowTimeModel');
const CategoryModel = require('../models/CategoryModel');
const TypeTicketModel = require('../models/TypeTicketModel');
const OrganizerModel = require('../models/OrganizerModel');
const { mongoose } = require('mongoose');
const FollowModel = require('../models/FollowModel');
const TicketModel = require('../models/TicketModel');

const calsDistanceLocation = require('../utils/calsDistanceLocation');
const UserModel = require('../models/UserModel');
const { cleanString } = require('../utils/handleString');
const notificationController = require('./notificationController');
const NotificationModel = require('../models/NotificationModel');
const KeyWordModel = require('../models/KeyWordModel');

const addEvent = asyncHandle(async (req, res) => {
  const {
    title,
    description,
    Address,
    addressDetals,
    Location,
    position,
    photoUrl,
    price,
    users,
    category,
    authorId,
    startAt,
    endAt,
  } = req.body;
  if (req.body) {
    const createEvent = await EventModel.create({
      title,
      description,
      Address,
      addressDetals,
      Location,
      position,
      photoUrl,
      price,
      users,
      category,
      authorId,
      startAt,
      endAt,
    });
    if (createEvent) {
      res.status(200).json({
        status: 200,
        message: 'Thêm thành công',
        data: createEvent,
      });
    } else {
      res.status(400);
      throw new Error('Thêm thất bại');
    }
  } else {
    res.status(401);
    throw new Error('Không có dữ liệu event');
  }
});

const getAllEvent = asyncHandle(async (req, res) => {
  const { limit, limitDate } = req.query;
  const events = await EventModel.find()
    .populate({
      path: 'authorId',
      populate: [
        {
          path: 'user',
          select: '_id fullname email photoUrl bio',
        },
        // {
        //     path: 'eventCreated',
        //     select: '-description -authorId',
        //     populate: [
        //         {
        //             path: 'category',
        //             select: '_id name image'
        //         },
        //         {
        //             path: 'usersInterested.user',
        //             select: '_id fullname email photoUrl'
        //         },
        //         {
        //             path:'showTimes',
        //             options: { sort: { startDate: 1 }}
        //         }
        //     ]
        // }
      ],
    })
    .select('authorId');
  res.status(200).json({
    status: 200,
    message: 'Thành công',
    data: events,
  });
});
const getEvents = asyncHandle(async (req, res) => {
  const {
    lat,
    long,
    distance,
    limit,
    limitDate,
    searchValue,
    isUpcoming,
    isPastEvents,
    categoriesFilter,
    startAt,
    endAt,
    minPrice = 0,
    maxPrice = 10000000,
    sortType,
    keywordsFilter,
  } = req.query;
  const filter = { statusEvent: { $nin: ['Cancelled', 'PendingApproval'] } };
  if (searchValue) {
    const regex = new RegExp(cleanString(searchValue), 'i');
    filter.titleNonAccent = { $regex: regex };
  }
  if (categoriesFilter) {
    filter.category = { $in: categoriesFilter };
  }

  if (keywordsFilter) {
    filter.keywords = { $in: keywordsFilter };
  }
  const events = await EventModel.find(filter)
    .populate({
      path: 'keywords',
      select: '_id name popularity',
    })
    .populate('category', '_id name image')
    .populate('usersInterested.user', '_id fullname email photoUrl')
    .populate({
      path: 'showTimes',
      options: { sort: { startDate: 1 } }, // Sắp xếp theo startDate tăng dần
      populate: {
        path: 'typeTickets',
        select: 'price type',
        options: { sort: { price: -1 } },
        populate: {
          path: 'promotion',
          select: '-startDate -endDate -createdAt -updatedAt',
          options: { limit: 1 },
        },
      },
    })
    // .limit(limit ?? 0)
    .select(
      '-description -authorId -uniqueViewCount -uniqueViewRecord -viewRecord'
    )
    .sort(sortType === 'view' ? { viewCount: -1 } : {});
  // .sort({viewCount:-1})
  // const showTimeCopy = [...events.map((event)=>event.showTimes)]
  // const showTimeCopySort = showTimeCopy.sort((a, b) => (a.status === 'Ended') - (b.status === 'Ended'));
  // events.showTimes = showTimeCopySort
  // events.forEach(event => {
  //     event.showTimes = [...event.showTimes].sort((a, b) => (a.status === 'Ended') - (b.status === 'Ended'));
  // });
  events.forEach((event) => {
    //sap xếp các suất diễn đã kết thúc xuống cuối
    event.showTimes = [
      ...event.showTimes.filter((showTime) => showTime.status !== 'Ended'),
      ...event.showTimes.filter((showTime) => showTime.status === 'Ended'),
    ];
  });
  let sortedEvents;
  if (sortType) {
    //bỏ các sự kiện đã kết thúc xuống cuối
    sortedEvents = events.sort(
      (a, b) => (a.statusEvent === 'Ended') - (b.statusEvent === 'Ended')
    );
  } else {
    const sortedStartEvents = events.sort((a, b) => {
      //sắp xếp sự kiện tăng dần theo thời gian xuất diễn
      const dateA = a.showTimes[0]?.startDate
        ? new Date(a.showTimes[0].startDate)
        : new Date(0);
      const dateB = b.showTimes[0]?.startDate
        ? new Date(b.showTimes[0].startDate)
        : new Date(0);
      //dateB - dateA giảm dần
      return dateA - dateB;
    });
    //bỏ các sự kiện đã kết thúc xuống cuối
    sortedEvents = sortedStartEvents.sort(
      (a, b) => (a.statusEvent === 'Ended') - (b.statusEvent === 'Ended')
    );
  }
  const filterEventsByPrice = sortedEvents.filter((item) => {
    const showTime = item.showTimes?.[0];
    const typeTicket =
      showTime?.typeTickets?.[showTime?.typeTickets.length - 1];
    if (!typeTicket) {
      return true;
    }
    return typeTicket.price >= minPrice && typeTicket.price <= maxPrice;
  });
  if (lat && long && distance) {
    const eventsNearYou = [];
    if (filterEventsByPrice.length > 0) {
      filterEventsByPrice.forEach((event) => {
        const eventDistance = calsDistanceLocation(
          lat,
          long,
          event.position.lat,
          event.position.lng
        );
        if (eventDistance < distance) {
          eventsNearYou.push(event);
        }
      });
    }
    res.status(200).json({
      status: 200,
      message: 'Thành công',
      data: eventsNearYou.slice(0, limit),
    });
  } else {
    res.status(200).json({
      status: 200,
      message: 'Thành công',
      data: filterEventsByPrice.slice(0, limit),
    });
  }
});

const updateFollowerEvent = asyncHandle(async (req, res) => {
  const { idUser, idEvent } = req.body;
  const event = await EventModel.findById({ _id: idEvent });
  console.log(event);
  res.status(200).json({
    message: 'Cập nhập followers thành công',
  });
});

const getEventById = asyncHandle(async (req, res) => {
  const { eid } = req.query;
  const event = await EventModel.findById(eid)
    .populate('keywords', '_id name popularity')
    .populate('category', '_id name image')
    .populate('usersInterested.user', '_id fullname email photoUrl')
    .populate({
      path: 'authorId',
      populate: [
        {
          path: 'user',
          select: '_id fullname email photoUrl bio',
        },
      ],
    })
    // .populate({
    //     path:'showTimes',
    //     options: { sort: { startDate: 1 } }, // Sắp xếp theo startDate tăng dần
    //     populate:{
    //         path:'typeTickets',
    //         options: { sort: { price: -1 } }, // Sắp xếp theo startDate tăng dần
    //     }
    // })
    .select(
      '-createdAt -description -updatedAt -uniqueViewCount -uniqueViewRecord -viewRecord -viewCount'
    );
  // const showTimeCopy = event.showTimes
  // const showTimeCopySort = showTimeCopy.sort((a, b) => (a.status === 'Ended') - (b.status === 'Ended'));
  // event.showTimes=showTimeCopySort
  // Sao chép mảng `showTimes` và sắp xếp
  // const showTimeCopySort = [
  //     ...event.showTimes.filter(showTime => showTime.status !== 'Ended'),
  //     ...event.showTimes.filter(showTime => showTime.status === 'Ended')
  // ];
  // event.showTimes = showTimeCopySort;

  res.status(200).json({
    status: 200,
    message: 'Thành công',
    data: event,
  });
});

const updateEvent = asyncHandle(async (req, res) => {
  const { idEvent, ...updateFields } = req.body;
  let Address = '';
  const session = await mongoose.startSession();
  session.startTransaction();
  const event = await EventModel.findById(idEvent)
    .populate('authorId', 'user')
    .session(session);
  if (!event) {
    await session.abortTransaction();
    session.endSession();
    return res.status(404).json({
      status: 404,
      message: 'Sự kiện không tồn tại !!!',
    });
  }
  const isSamePosition =
    updateFields.position?.lat === event.position?.lat &&
    updateFields.position?.lng === event.position?.lng;
  const isSameLocation = updateFields?.Location === event?.Location;
  try {
    if (updateFields.addressDetails) {
      Address = [
        updateFields.addressDetails.houseNumberAndStreet,
        updateFields.addressDetails.ward?.name,
        updateFields.addressDetails.districts?.name,
        updateFields.addressDetails.province?.name,
      ]
        .filter(Boolean)
        .join(', ');
    }
    if (updateFields.keywords && updateFields.keywords.length > 0) {
      updateFields.keywords = await Promise.all(
        updateFields.keywords.map(async (item) => {
          try {
            if (item.isNew) {
              const keywordCreate = new KeyWordModel({ name: item.value });
              const savedKeyword = await keywordCreate.save({ session });
              return savedKeyword._id;
            } else {
              return item.value;
            }
          } catch (error) {
            console.error('Error saving keyword:', error);
            return null;
          }
        })
      );
    }
    const updateData = {
      ...updateFields,
      titleNonAccent: cleanString(updateFields?.title), // Tạo thêm trường mới
      Address: Address,
    };
    const eventUpdate = await EventModel.findByIdAndUpdate(
      idEvent,
      updateData,
      { new: true }
    );
    if (eventUpdate && (!isSameLocation || !isSamePosition)) {
      let usersPurchased = [];
      let fcmTokens = [];
      const tickets = await TicketModel.find({ event: eventUpdate._id })
        .select('current_owner')
        .populate('current_owner', 'fcmTokens');
      usersPurchased = tickets.flatMap((item) => item.current_owner._id);
      fcmTokens = tickets.flatMap((item) => item.current_owner.fcmTokens);
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
                title: 'Thông báo thay đổi địa điểm tổ chức',
                subtitle: '',
                body: `Đã thay đổi vị trí tổ chức của sự kiện ${event?.title}`,
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
              recipientId: user,
              eventId: event._id,
              type: 'newEvent',
              content: `Đã thay đổi vị trí tổ chức của sự kiện ${event?.title}`,
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
      message: 'Thành công',
      data: eventUpdate,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(404).json({
      status: 404,
      message: `Lỗi rồi ${error}`,
    });
  }
});

const buyTicket = asyncHandle(async (req, res) => {
  const data = req.body;
  console.log('data', data);
  res.status(200).json({
    status: 200,
    message: 'Thành công',
  });
});
const updateStatusEvent = asyncHandle(async (req, res) => {
  const events = await EventModel.find().select('_id showTimes statusEvent');
  await Promise.all(
    events.map(async (event) => {
      if (
        event.statusEvent !== 'PendingApproval' &&
        event.statusEvent !== 'Cancelled'
      ) {
        const showTimes = await ShowTimeModel.find({
          _id: { $in: event.showTimes },
        });
        const allNotStarted = showTimes.every(
          (showTime) => showTime.status === 'NotStarted'
        );
        const allEnded = showTimes.every(
          (showTime) => showTime.status === 'Ended'
        );
        const allSoldOut = showTimes.every(
          (showTime) => showTime.status === 'SoldOut'
        );
        const allSaleStopped = showTimes.every(
          (showTime) => showTime.status === 'SaleStopped'
        );
        const allNotYetOnSale = showTimes.every(
          (showTime) => showTime.status === 'NotYetOnSale'
        );
        const anyOngoing = showTimes.some(
          (showTime) => showTime.status === 'Ongoing'
        );
        const anyOnSale = showTimes.some(
          (showTime) => showTime.status === 'OnSale'
        );
        if (allNotStarted) {
          event.statusEvent = 'NotStarted';
        } else if (allSoldOut) {
          event.statusEvent = 'SoldOut';
        } else if (allSaleStopped) {
          event.statusEvent = 'SaleStopped';
        } else if (allNotYetOnSale) {
          event.statusEvent = 'NotYetOnSale';
        } else if (allEnded) {
          event.statusEvent = 'Ended';
        } else if (anyOngoing) {
          event.statusEvent = 'Ongoing';
        } else if (anyOnSale) {
          event.statusEvent = 'OnSale';
        }
        await event.save();
      }
    })
  );
  res.status(200).json({
    status: 200,
    message: 'Thành công',
    // data:events
  });
});

const createEvent = asyncHandle(async (req, res) => {
  const { showTimes, event, idUser } = req.body;
  delete event._id;
  if (!showTimes || showTimes.length === 0 || !event || !idUser) {
    return res.status(404).json({
      status: 404,
      message: 'Hãy nhập đầy đủ thông tin',
    });
  }
  const session = await mongoose.startSession(); // Bắt đầu session cho transaction
  try {
    await session.startTransaction(); // Bắt đầu transaction

    let organizer = await OrganizerModel.findOne({ user: idUser }).session(
      session
    );
    if (!organizer) {
      // Nếu không có organizer, tạo mới và lưu vào DB
      // await UserModel.findByIdAndUpdate(idUser, { idRole: '66c523fa77cc482c91fcaa63' }, { session ,new:true})
      const newOrganizers = await OrganizerModel.create(
        [
          {
            user: idUser,
            eventCreated: [],
          },
        ],
        { session }
      );
      organizer = newOrganizers[0]; // Lấy phần tử đầu tiên của mảng để có được đối tượng organizer
    }
    // await Promise.all(showTimes.map(async (showTime,index) => {
    //     const showTimeSort = await showTime.typeTickets.sort((a, b) => {//sắp xếp sự kiện tăng dần theo thời gian xuất diễn
    //         const priceA = a.price ? a.price : 0;
    //         const priceB = b.price ? b.price : 0;
    //         //priceB - priceA giảm dần
    //         return priceB - priceA;
    //     });
    //     showTimes[index].typeTickets = showTimeSort
    // }))
    // const sortedShowTime = showTimes.sort((a, b) => {
    //     const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
    //     const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
    //     return dateA - dateB;
    // });

    const currentTime = new Date();
    let idShowtimes = [];
    let statusShowTime = [];
    for (const showtime of showTimes) {
      delete showtime._id;
      let idTypeTicket = [];
      let statusTypeTicket = [];

      for (const typeTicket of showtime.typeTickets) {
        delete typeTicket._id;
        const startSaleTime = new Date(typeTicket.startSaleTime);
        const endSaleTime = new Date(typeTicket.endSaleTime);

        if (currentTime.getTime() < startSaleTime.getTime()) {
          typeTicket.status = 'NotStarted';
        } else if (
          currentTime.getTime() >= startSaleTime.getTime() &&
          currentTime.getTime() <= endSaleTime.getTime()
        ) {
          typeTicket.status = 'OnSale';
        }

        const typeTicketCreate = new TypeTicketModel(typeTicket);
        const savedTicket = await typeTicketCreate.save({ session });

        if (savedTicket) {
          idTypeTicket.push(savedTicket._id);
          statusTypeTicket.push(savedTicket.status);
        } else {
          res.status(400);
          throw new Error('Lỗi khi thêm typeTicket');
        }
      }

      const startDate = new Date(showtime.startDate);
      if (currentTime.getTime() < startDate.getTime()) {
        showtime.status = 'NotStarted';
      }

      const allNotYetOnSale = statusTypeTicket.every(
        (status) => status === 'NotStarted'
      );
      const anyOnSale = statusTypeTicket.some((status) => status === 'OnSale');

      if (allNotYetOnSale) {
        showtime.status = 'NotYetOnSale';
      } else if (anyOnSale) {
        showtime.status = 'OnSale';
      }

      const showTimeCreate = new ShowTimeModel({
        ...showtime,
        typeTickets: idTypeTicket,
      });
      const savedShowTime = await showTimeCreate.save({ session });

      if (savedShowTime) {
        idShowtimes.push(savedShowTime._id);
        statusShowTime.push(savedShowTime.status);
      } else {
        res.status(400);
        throw new Error('Lỗi khi thêm showTime');
      }
    }
    const allNotStarted = statusShowTime.every(
      (status) => status === 'NotStarted'
    );
    const allNotYetOnSale = statusShowTime.every(
      (status) => status === 'NotYetOnSale'
    );
    const anyOnSale = statusShowTime.some((status) => status === 'OnSale');
    if (allNotStarted) {
      event.statusEvent = 'NotStarted';
    } else if (allNotYetOnSale) {
      event.statusEvent = 'NotYetOnSale';
    } else if (anyOnSale) {
      event.statusEvent = 'OnSale';
    }
    event.authorId = organizer._id;
    if (event.addressDetails) {
      event.Address = [
        event.addressDetails.houseNumberAndStreet,
        event.addressDetails.ward?.name,
        event.addressDetails.districts?.name,
        event.addressDetails.province?.name,
      ]
        .filter(Boolean)
        .join(', ');
    }
    if (event.keywords && event.keywords.length > 0) {
      event.keywords = await Promise.all(
        event.keywords.map(async (item) => {
          if (item.isNew) {
            const keywordCreate = new KeyWordModel({ name: item.value });
            const savedKeyword = await keywordCreate.save({ session });
            return savedKeyword._id;
          } else {
            return item.value;
          }
        })
      );
    }
    // if(keywordsNew && keywordsNew.length > 0 ){
    //     const idsKeywordNew = []
    //     for(const keyWordNew of keywordsNew){
    //         const keywordCreate = new KeyWordModel({name:keyWordNew})
    //         const savedKeyword = await keywordCreate.save({ session })
    //         if(savedKeyword){
    //             idsKeywordNew.push(savedKeyword._id)
    //         }
    //     }
    //     event.keywords = event.keywords.concat(idsKeywordNew);
    // }
    const eventCreate = new EventModel({
      ...event,
      showTimes: idShowtimes,
      titleNonAccent: cleanString(event?.title),
    });
    const savedEvent = await eventCreate.save({ session });

    if (savedEvent) {
      const user = await UserModel.findByIdAndUpdate(
        idUser,
        { idRole: '66c523fa77cc482c91fcaa63' },
        { session }
      ); // cập nhập quyền user là người tổ chức
      const eventCreated = [...organizer.eventCreated];
      eventCreated.push(savedEvent._id);
      await OrganizerModel.findByIdAndUpdate(
        organizer._id,
        { eventCreated: eventCreated },
        { session }
      );

      const follow = await FollowModel.find({
        users: {
          $elemMatch: {
            idUser: idUser,
          },
        },
      })
        .select('user')
        .populate('user', 'fcmTokens');

      const usersFollowing = follow.flatMap((item) => item.user._id);
      const fcmTokens = follow.flatMap((item) => item.user.fcmTokens);
      const uniqueFcmTokens = [...new Set(fcmTokens)];
      if (uniqueFcmTokens.length > 0) {
        await Promise.all(
          uniqueFcmTokens.map(async (fcmToken) => {
            try {
              await notificationController.handleSendNotification({
                fcmToken: fcmToken,
                title: 'Thông báo',
                subtitle: '',
                body: `${user.fullname} đã tổ chức sự kiện ${savedEvent.title} hãy xem ngay nào !!!`,
                image: savedEvent?.photoUrl ?? '',
                data: {
                  id: savedEvent._id.toString(),
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
      if (usersFollowing && usersFollowing.length > 0) {
        await Promise.all(
          usersFollowing.map(async (user) => {
            const notification = new NotificationModel({
              senderID: idUser,
              recipientId: user._id,
              eventId: savedEvent._id,
              type: 'newEvent',
              content: ` đã tổ chức sự kiện "${savedEvent.title}" hãy xem ngay nào !!!`,
            });
            await notification.save({ session });
          })
        );
      }
      await session.commitTransaction(); // Commit transaction nếu tất cả đều thành công
      res.status(200).json({
        status: 200,
        message: 'Thành công',
        data: savedEvent,
      });
    } else {
      res.status(400);
      throw new Error('Lỗi khi thêm Event');
    }
  } catch (error) {
    await session.abortTransaction(); // Rollback transaction nếu có lỗi
    console.error(error);
    res.status(400).json({
      status: 400,
      message: error.message,
    });
  } finally {
    session.endSession(); // Kết thúc session
  }
});

const incViewEvent = asyncHandle(async (req, res) => {
  const { idUser, idEvent } = req.body;
  const event = await EventModel.findById(idEvent)
    .populate('category', '_id name image')
    // .populate('authorId')
    .populate('usersInterested.user', '_id fullname email photoUrl')
    .populate({
      path: 'showTimes',
      options: { sort: { startDate: 1 } }, // Sắp xếp theo startDate tăng dần
      populate: {
        path: 'typeTickets',
        select: 'price type',
        options: { sort: { price: -1 } }, // Sắp xếp the
        populate: {
          path: 'promotion',
          select: '-startDate -endDate -createdAt -updatedAt',
          options: { limit: 1 },
        },
      },
    })
    .select('-description -authorId');

  if (!event) {
    res.status(400);
    throw new Error('Event không tồn tại');
  }

  // .limit(limit ?? 0)

  if (idUser) {
    const user = await UserModel.findById(idUser).select('_id viewedEvents');
    if (!user) {
      res.status(400);
      throw new Error('User không tồn tại');
    }
    const viewedEvents = [...user.viewedEvents];
    const index = viewedEvents.findIndex(
      (item) => item.event.toString() === idEvent
    );
    if (index !== -1) {
      viewedEvents.splice(index, 1);
    }
    viewedEvents.unshift({ event: idEvent, createdAt: Date.now() });
    await UserModel.findByIdAndUpdate(
      idUser,
      { viewedEvents: viewedEvents },
      { new: true }
    );

    const uniqueViewRecord = [...event.uniqueViewRecord];
    const currentTime = Date.now();
    const recordIndex = uniqueViewRecord.findIndex(
      (record) => record.user.toString() === idUser
    );
    if (recordIndex === -1) {
      // Người dùng chưa tồn tại hoặc đã qua 24 giờ kể từ lần ghi nhận trước
      if (recordIndex !== -1) {
        // Cập nhật thời gian nếu đã qua 24 giờ
        uniqueViewRecord[recordIndex].createdAt = currentTime;
      } else {
        // Thêm bản ghi mới nếu chưa tồn tại
        uniqueViewRecord.push({ user: idUser, createdAt: currentTime });
      }
      uniqueViewRecord.unshift({ user: idUser, createdAt: currentTime });
      event.uniqueViewCount = (event.uniqueViewCount || 0) + 1;
    } else {
      if (
        currentTime -
          new Date(uniqueViewRecord[recordIndex].createdAt).getTime() >
        24 * 60 * 60 * 1000
      ) {
        uniqueViewRecord.unshift({ user: idUser, createdAt: currentTime });
        event.uniqueViewCount = (event.uniqueViewCount || 0) + 1;
      }
    }
    const viewRecord = [...event.viewRecord];
    viewRecord.unshift({ user: idUser, createdAt: currentTime });

    event.showTimes = [
      ...event.showTimes.filter((showTime) => showTime.status !== 'Ended'),
      ...event.showTimes.filter((showTime) => showTime.status === 'Ended'),
    ];
    const sortedShowTimes = event?.showTimes?.sort((a, b) => {
      //sắp xếp sự kiện tăng dần theo thời gian xuất diễn
      const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
      const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
      //dateB - dateA giảm dần
      return dateA - dateB;
    });
    event.showTimes = sortedShowTimes;
    await EventModel.findByIdAndUpdate(
      idEvent,
      {
        uniqueViewRecord: uniqueViewRecord,
        uniqueViewCount: event.uniqueViewCount,
        $inc: { viewCount: 1 },
        viewRecord: viewRecord,
      },
      { new: true }
    );
    res.status(200).json({
      status: 200,
      message: 'inc view thành công',
      data: event,
    });
  } else {
    await EventModel.findByIdAndUpdate(
      idEvent,
      { $inc: { viewCount: 1 } },
      { new: true }
    );
    res.status(200).json({
      status: 200,
      message: 'inc view thành công',
      data: null,
    });
  }
});

const getDescriptionEvent = asyncHandle(async (req, res) => {
  const { idEvent } = req.query;
  if (!idEvent) {
    res.status(404).json({
      status: 404,
      message: 'idEvent không có',
    });
  }
  const event = await EventModel.findById(idEvent).select('description');
  if (!event) {
    res.status(404).json({
      status: 404,
      message: 'Event không tòn tại không hệ thống',
    });
  }
  res.status(200).json({
    status: 200,
    message: 'Thành công',
    data: event.description,
  });
});

const getShowTimesEvent = asyncHandle(async (req, res) => {
  const { idEvent } = req.query;
  if (!idEvent) {
    res.status(404).json({
      status: 404,
      message: 'idEvent không có',
    });
  }
  const event = await EventModel.findById(idEvent)
    .select('showTimes')
    .populate({
      path: 'showTimes',
      options: { sort: { startDate: 1 } }, // Sắp xếp theo startDate tăng dần
      populate: {
        path: 'typeTickets',
        options: { sort: { price: -1 } }, // Sắp xếp theo startDate tăng dần
        populate: {
          path: 'promotion',
          select: '-startDate -endDate -createdAt -updatedAt',
        },
      },
    });
  const showTimeCopySort = [
    ...event.showTimes.filter((showTime) => showTime.status !== 'Ended'),
    ...event.showTimes.filter((showTime) => showTime.status === 'Ended'),
  ];
  if (!event) {
    res.status(404).json({
      status: 404,
      message: 'Event không tòn tại không hệ thống',
    });
  }
  res.status(200).json({
    status: 200,
    message: 'Thành công',
    data: showTimeCopySort,
  });
});

const getShowTimesEventForOrganizer = asyncHandle(async (req, res) => {
  const { idEvent } = req.query;
  if (!idEvent) {
    res.status(404).json({
      status: 404,
      message: 'idEvent không có',
    });
  }
  const event = await EventModel.findById(idEvent)
    .select('showTimes')
    .populate({
      path: 'showTimes',
      options: { sort: { startDate: 1 } }, // Sắp xếp theo startDate tăng dần,
      select: '-typeTickets',
    });
  const showTimeCopySort = [
    ...event.showTimes.filter((showTime) => showTime.status !== 'Ended'),
    ...event.showTimes.filter((showTime) => showTime.status === 'Ended'),
  ];
  if (!event) {
    res.status(404).json({
      status: 404,
      message: 'Event không tòn tại không hệ thống',
    });
  }
  res.status(200).json({
    status: 200,
    message: 'Thành công',
    data: showTimeCopySort,
  });
});

const getEventByIdForOrganizer = asyncHandle(async (req, res) => {
  const { idEvent } = req.query;
  const event = await EventModel.findById(idEvent)
    .populate('keywords', '_id name popularity')

    // .populate({
    //     path:'showTimes',
    //     options: { sort: { startDate: 1 } }, // Sắp xếp theo startDate tăng dần
    //     populate:{
    //         path:'typeTickets',
    //         options: { sort: { price: -1 } }, // Sắp xếp theo startDate tăng dần
    //     }
    // })
    .select(
      'title description photoUrl addressDetails Location position category keywords'
    );
  // const showTimeCopy = event.showTimes
  // const showTimeCopySort = showTimeCopy.sort((a, b) => (a.status === 'Ended') - (b.status === 'Ended'));
  // event.showTimes=showTimeCopySort
  // Sao chép mảng `showTimes` và sắp xếp
  // const showTimeCopySort = [
  //     ...event.showTimes.filter(showTime => showTime.status !== 'Ended'),
  //     ...event.showTimes.filter(showTime => showTime.status === 'Ended')
  // ];
  // event.showTimes = showTimeCopySort;
  const cloneEvent = {
    ...event.toObject(),
    keywords: [
      ...event.keywords.map(({ _id, name }) => ({
        value: _id,
        label: name,
      })),
    ],
  };
  res.status(200).json({
    status: 200,
    message: 'Thành công',
    data: cloneEvent,
  });
});

const getLatLongEvents = asyncHandle(async (req, res) => {
  const events = await EventModel.find().select('_id position photoUrl');
  res.status(200).json({
    status: 200,
    message: 'Thành công',
    data: events,
  });
});
module.exports = {
  addEvent,
  getAllEvent,
  getEvents,
  updateFollowerEvent,
  getEventById,
  updateEvent,
  buyTicket,
  updateStatusEvent,
  createEvent,
  incViewEvent,
  getDescriptionEvent,
  getShowTimesEvent,
  getShowTimesEventForOrganizer,
  getEventByIdForOrganizer,
  getLatLongEvents,
};
