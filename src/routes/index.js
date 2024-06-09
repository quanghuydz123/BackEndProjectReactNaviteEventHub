const authRouter = require("./authRouter")
const userRouter = require("./userRouter")


const routes = (app) =>{
    app.use('/auth',authRouter)
    app.use('/users',userRouter)
}

module.exports = routes