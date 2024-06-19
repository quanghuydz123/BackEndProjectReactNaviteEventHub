const express = require('express')
const app = express()
const cors = require('cors')
const routes = require('./src/routes')
const connectDb = require('./src/configs/connectDb')
const errorMiddleHandle = require('./src/middlewares/errorMiddlewares')
const socketIo = require('socket.io');
require('dotenv').config()
const server = require('http').createServer(app)
const io = socketIo(server);
const port = 3001





app.use(cors())
app.use(express.json())

// Lắng nghe kết nối từ client
io.on('connection', (socket) => {
    console.log('New client connected');
    
    // Xử lý các sự kiện từ client
    socket.on('events', (data) => {
        console.log('events', data);
        io.emit('events','truyền lại nè')
    });

    socket.on('followers', (data) => {
        console.log('followers:', data);
        io.emit('followers','truyền lại nè')
    });


    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

routes(app)

connectDb.connectDb()

app.use(errorMiddleHandle)

server.listen(port,()=>{
    console.log("Sever is running in port: " + port )
})