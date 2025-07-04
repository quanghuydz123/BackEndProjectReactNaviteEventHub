const mongoose =  require('mongoose')
const notificationSchema = new mongoose.Schema(
{
    senderID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
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
    invoiceId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'invoices',
    },
    type: {
        type: String,
        enum: ['inviteEvent', 'paymentTicket', 'like','follow','newEvent', 'shareTicket','other'],
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
