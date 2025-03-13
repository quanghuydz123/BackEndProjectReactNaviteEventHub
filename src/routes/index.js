const authRouter = require("./authRouter")
const userRouter = require("./userRouter")
const EventRouter = require("./EventRouter")
const categoryRouter = require("./categoryRouter")
const followRouter = require("./followRouter")
const notificationRouter = require("./notificationRouter")
const typeTicketRouter = require("./typeTicketRouter")
const showTimeRouter = require("./showTimeRouter")
const organizerRouter = require("./organizerRouter")
const invoiceRouter = require("./invoiceRouter")
const ticketRouter = require("./ticketRouter")
const commentRouter = require("./commentRouter")
const promotionRouter = require("./promotionRouter")
const keyWordRouter = require("./keyWordRouter")

const routes = (app) =>{
    app.use('/auth',authRouter)
    app.use('/users',userRouter)
    app.use('/event',EventRouter)
    app.use('/category',categoryRouter)
    app.use('/follow',followRouter)
    app.use('/notification',notificationRouter)
    app.use('/typeTickets',typeTicketRouter)
    app.use('/showTimes',showTimeRouter)
    app.use('/organizers',organizerRouter)
    app.use('/invoices',invoiceRouter)
    app.use('/tickets',ticketRouter)
    app.use('/comments',commentRouter)
    app.use('/promotions',promotionRouter)
    app.use('/keywords',keyWordRouter)


}

module.exports = routes