const mongoose =  require('mongoose')
const notificationSchema = new mongoose.Schema(
{
    senderID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    recipientId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    eventId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events',
    },
    type: {
        type: String,
        enum: ['inviteEvent', 'message', 'like','follow','rejectFollow','allowFollow', 'other'],
        required: true
    },
    content:{
        type:String,
    },
    isRead:{
        type:Boolean,
        required:true,
        default:false
    },
    isViewed:{
        type:Boolean,
        required:true,
        default:false
    },
    status:{
        type: String,
        enum: ['answered', 'unanswered', 'cancelled','rejected', 'other'],
    },
    isDeleted: {
        type: Boolean,
        required:true,
        default: false
    }
},
{
    timestamps: true
}
);

const NotificationModel = mongoose.model("notifications",notificationSchema);
module.exports = NotificationModel
