const cron = require('node-cron');
const eventController = require('../controller/eventController')
const showTimeController = require('../controller/showTimeController')
const typeTicketController = require('../controller/typeTicketController')
const asyncHandle = require('express-async-handler')
const TypeTicketModel = require("../models/TypeTicketModel")
const EventModel = require("../models/EventModel")
const ShowTimeModel = require("../models/ShowTimeModel")


const updateStatusTypeTicket = asyncHandle(async () => {
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
    
})

const updateStatusShowTime = asyncHandle(async () => {
    const showTimes = await ShowTimeModel.find();
    const currentTime = new Date();
    await Promise.all((showTimes.map(async (showTime)=>{
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
            const allSoldOut = tickets.every(ticket => ticket.status === 'SoldOut');
            const anyOnSale = tickets.some(ticket => ticket.status === 'OnSale');
        
            if (allSoldOut) {
              showTime.status = 'SoldOut';
            } else if (anyOnSale) {
              showTime.status = 'OnSale';
            }
          }
          await showTime.save();
    })))
})

const updateStatusEvent = asyncHandle(async () => {
    const events = await EventModel.find().select('_id showTimes statusEvent')
    await Promise.all(events.map(async (event)=>{
        if(event.statusEvent !== 'PendingApproval' && event.statusEvent !== 'Cancelled'){
            const showTimes = await ShowTimeModel.find({ _id: { $in: event.showTimes } });
            const allNotStarted = showTimes.every(showTime => showTime.status === 'NotStarted');
            const allEnded = showTimes.every(showTime => showTime.status === 'Ended');
            const allSoldOut = showTimes.every(showTime => showTime.status === 'SoldOut');
            const anyOngoing = showTimes.some(showTime => showTime.status === 'Ongoing');
            const anyOnSale = showTimes.some(showTime => showTime.status === 'OnSale');
            if (allNotStarted) {
                event.statusEvent = 'NotStarted';
            } else if (allEnded) {
                event.statusEvent = 'Ended';
            } else if (allSoldOut) {
                event.statusEvent = 'SoldOut';
            } else if (anyOngoing) {
                event.statusEvent = 'Ongoing';
            } else if (anyOnSale) {
                event.statusEvent = 'OnSale';
            }
        
            await event.save();
        }
    }))
  
})

cron.schedule('*//10 * * * *', async () => {
    console.log("Updating statuses...");
    await updateStatusTypeTicket();
    await updateStatusShowTime();
    await updateStatusEvent();
    console.log("Statuses updated for Event, ShowTime, and TypeTicket");
});

module.exports={}