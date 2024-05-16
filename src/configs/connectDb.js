const {mongoose } = require('mongoose');

require('dotenv').config();

const dbUrl = `mongodb+srv://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSOWRD}@cluster0.iju99ia.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

const connectDb = async (app)=>{
    mongoose.connect(dbUrl)
    .then(()=>{
    console.log("connect success")
    })
    .catch((err)=>{
    console.log(err);
    })
}

module.exports = {connectDb}