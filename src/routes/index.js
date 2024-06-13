const authRouter = require("./authRouter")
const userRouter = require("./userRouter")
const EventRouter = require("./EventRouter")
const categoryRouter = require("./categoryRouter")


const routes = (app) =>{
    app.use('/auth',authRouter)
    app.use('/users',userRouter)
    app.use('/event',EventRouter)
    app.use('/category',categoryRouter)

}

module.exports = routes