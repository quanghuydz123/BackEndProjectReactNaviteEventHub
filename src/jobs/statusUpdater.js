const cron = require('node-cron');
const eventController = require('../controller/eventController')
const showTimeController = require('../controller/showTimeController')
const typeTicketController = require('../controller/typeTicketController')
const asyncHandle = require('express-async-handler')
const TypeTicketModel = require("../models/TypeTicketModel")
const EventModel = require("../models/EventModel")
const ShowTimeModel = require("../models/ShowTimeModel")
const TicketModel = require("../models/TicketModel")
const {mongoose } = require('mongoose');


const updateStatusTypeTicket = asyncHandle(async () => {
  const typeTickets = await TypeTicketModel.find();
  const currentTime = new Date();
  await Promise.all((typeTickets.map(async (typeTicket) => {
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

})

const updateStatusShowTime = asyncHandle(async () => {
  const showTimes = await ShowTimeModel.find();
  const currentTime = new Date();
  await Promise.all((showTimes.map(async (showTime) => {
    if (currentTime < showTime.startDate) {
      showTime.status = 'NotStarted';
    } else if (currentTime >= showTime.startDate && currentTime <= showTime.endDate) {
      showTime.status = 'Ongoing';
    } else if (currentTime > showTime.endDate) {
      showTime.status = 'Ended';
    }
    if (showTime.status === 'Ongoing' || showTime.status === 'NotStarted') {
      // Tải trạng thái của tất cả typeTickets liên kết với suất diễn này
      const tickets = await TypeTicketModel.find({ _id: { $in: showTime.typeTickets } });
      // Kiểm tra trạng thái của các vé
      const allNotYetOnSale = tickets.every(ticket => ticket.status === 'NotStarted');
      const allSoldOut = tickets.every(ticket => ticket.status === 'SoldOut');
      const allSaleStopped = tickets.every(ticket => ticket.status === 'Ended');
      const anyOnSale = tickets.some(ticket => ticket.status === 'OnSale');

      if (allNotYetOnSale) {
        showTime.status = 'NotYetOnSale';
      }
      else if (allSoldOut) {
        showTime.status = 'SoldOut';

      }
      else if (allSaleStopped) {
        showTime.status = 'SaleStopped';
      }
      else if (anyOnSale) {
        showTime.status = 'OnSale';
      }
    }
    await showTime.save();
  })))
})

const updateStatusEvent = asyncHandle(async () => {
  const events = await EventModel.find().select('_id showTimes statusEvent')
  await Promise.all(events.map(async (event) => {
    if (event.statusEvent !== 'PendingApproval' && event.statusEvent !== 'Cancelled') {
      const showTimes = await ShowTimeModel.find({ _id: { $in: event.showTimes } });
      const allNotStarted = showTimes.every(showTime => showTime.status === 'NotStarted');
      const allEnded = showTimes.every(showTime => showTime.status === 'Ended');
      const allSoldOut = showTimes.every(showTime => showTime.status === 'SoldOut');
      const allSaleStopped = showTimes.every(showTime => showTime.status === 'SaleStopped');
      const allNotYetOnSale = showTimes.every(showTime => showTime.status === 'NotYetOnSale');
      const anyOngoing = showTimes.some(showTime => showTime.status === 'Ongoing');
      const anyOnSale = showTimes.some(showTime => showTime.status === 'OnSale');
      if (allNotStarted) {
        event.statusEvent = 'NotStarted';
      } else if (allSoldOut) {
        event.statusEvent = 'SoldOut';
      }
      else if (allSaleStopped) {
        event.statusEvent = 'SaleStopped'
      } else if (allNotYetOnSale) {
        event.statusEvent = 'NotYetOnSale'
      }
      else if (allEnded) {
        event.statusEvent = 'Ended';
      }
      else if (anyOngoing) {
        event.statusEvent = 'Ongoing';
      } else if (anyOnSale) {
        event.statusEvent = 'OnSale';
      }

      await event.save();
    }
  }))

})

const deleteTicketReserved = asyncHandle(async () => {
  const now = new Date();
  const expiredTickets = await TicketModel.find({
    status: 'Reserved',
    createdAt: { $lt: new Date(now - 15 * 60 * 1000) }, 
  });
  if (expiredTickets.length > 0) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const ticket of expiredTickets) {
        await TypeTicketModel.findByIdAndUpdate(
          ticket.typeTicket,
          { $inc: { amount: 1 } },
          { session }
        );

        await TicketModel.findByIdAndDelete(ticket._id, { session });
      }

      await session.commitTransaction();
      session.endSession();
      console.log(`Released ${expiredTickets.length} expired tickets.`);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error('Failed to release expired tickets:', error);
    }
  }
})

cron.schedule('*/10 * * * *', async () => {
  console.log("Updating statuses...");
  await updateStatusTypeTicket();
  await updateStatusShowTime();
  await updateStatusEvent();
  console.log("Statuses updated for Event, ShowTime, and TypeTicket");
});

cron.schedule('* * * * *', async () => {
  console.log("delete ticket...");
  await deleteTicketReserved()
});
module.exports = {}