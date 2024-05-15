const express = require('express')
const app = express()
const cors = require('cors')
const authRouter = require('./routes/authRouter')

const port = 3001

app.use(cors())
app.use(express.json())

app.use('/auth',authRouter)

app.listen(port,()=>{
    console.log("Sever is running in port: "+port )
})