const express = require('express')
const app = express()
const cors = require('cors')
const routes = require('./src/routes')
const connectDb = require('./src/configs/connectDb')
const errorMiddleHandle = require('./src/middlewares/errorMiddlewares')
require('dotenv').config()
const http = require("http").Server(app);
const socketIO = require('socket.io')(http, {
    cors: {
        origin: "<http://localhost:3000>"
    }
})
const port = 3001




app.use(cors())
app.use(express.json())

// Lắng nghe kết nối từ client
socketIO.on('connection', (socket) => {
    console.log('New client connected');
    
    // Xử lý các sự kiện từ client
    socket.on('events', (data) => {
        console.log('events', data);
        socketIO.emit('events','truyền lại nè')
    });

    socket.on('followers', (data) => {
        const {id} = data
        console.log('followers:', id);
        socketIO.emit('followers',id)
    });

    socket.on('followUser', (data) => {
        console.log('followUser:', data);
        socketIO.emit('followUser',data)
    });

    socket.on('updateUser', (data) => {
        console.log('updateUser:', data);
        socketIO.emit('updateUser',data)
    });

    socket.on('getNotifications', (data) => {
        console.log('getNotifications', data);
        socketIO.emit('getNotifications',data)
    });


    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

routes(app)

connectDb.connectDb()

app.use(errorMiddleHandle)

http.listen(port,()=>{
    console.log("Sever is running in port: " + port )
})