const authRouter = require("./authRouter")
const userRouter = require("./userRouter")
const EventRouter = require("./EventRouter")
const categoryRouter = require("./categoryRouter")
const followerRouter = require("./followerRouter")
const notificationRouter = require("./notificationRouter")

const routes = (app) =>{
    app.use('/auth',authRouter)
    app.use('/users',userRouter)
    app.use('/event',EventRouter)
    app.use('/category',categoryRouter)
    app.use('/follower',followerRouter)
    app.use('/notification',notificationRouter)

}

module.exports = routes