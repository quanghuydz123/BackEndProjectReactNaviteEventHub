const authRouter = require("./authRouter")


const routes = (app) =>{
    app.use('/auth',authRouter)
}

module.exports = routes