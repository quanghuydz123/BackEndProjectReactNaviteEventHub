const authRouter = require("./authRouter")
const userRouter = require("./userRouter")
const EventRouter = require("./EventRouter")
const categoryRouter = require("./categoryRouter")
const followRouter = require("./followRouter")
const notificationRouter = require("./notificationRouter")

const routes = (app) =>{
    app.use('/auth',authRouter)
    app.use('/users',userRouter)
    app.use('/event',EventRouter)
    app.use('/category',categoryRouter)
    app.use('/follow',followRouter)
    app.use('/notification',notificationRouter)

}

module.exports = routes