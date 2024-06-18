const { default: mongoose } = require("mongoose");

const FollowerSchema = new mongoose.Schema({
    status:{type:Boolean,required: true,default:true},
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    event:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events',
        required: true,
    }

})

const FollowerModel = mongoose.model('followers', FollowerSchema)
module.exports = FollowerModel