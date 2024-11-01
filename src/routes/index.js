const authRouter = require("./authRouter")
const userRouter = require("./userRouter")
const EventRouter = require("./EventRouter")
const categoryRouter = require("./categoryRouter")
const followRouter = require("./followRouter")
const notificationRouter = require("./notificationRouter")
const typeTicketRouter = require("./typeTicketRouter")
const showTimeRouter = require("./showTimeRouter")

const routes = (app) =>{
    app.use('/auth',authRouter)
    app.use('/users',userRouter)
    app.use('/event',EventRouter)
    app.use('/category',categoryRouter)
    app.use('/follow',followRouter)
    app.use('/notification',notificationRouter)
    app.use('/typeTickets',typeTicketRouter)
    app.use('/showTimes',showTimeRouter)

}

module.exports = routes