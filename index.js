const express = require('express')
const app = express()
const cors = require('cors')
const routes = require('./src/routes')
const connectDb = require('./src/configs/connectDb')
const errorMiddleHandle = require('./src/middlewares/errorMiddlewares')
require('dotenv').config()
const port = 3001

app.use(cors())
app.use(express.json())

routes(app)

connectDb.connectDb()

app.use(errorMiddleHandle)

app.listen(port,()=>{
    console.log("Sever is running in port: "+port )
})