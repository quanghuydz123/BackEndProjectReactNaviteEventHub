const { default: mongoose } = require("mongoose");

const EventSchema = new mongoose.Schema({
    title:{type:String,required:true},
    description:{type:String},
    Address:{type:String,required:true},
    photoUrl:{type:String},
    addressDetals:{type:Object},
    Location:{type:String,required:true},
    position:{type:Object,required:true},
    price:{type:Number},
    category:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categories',
        required: true,
    },
    authorId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organizers',
        required: true,
    },
    usersInterested:[{
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            require:true
            
        },
        createdAt:{
            type: Date,
            default:Date.now()
        }
    }],
    keywords:[{
        type:String,
        unique:true
    }],
    showTimes:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'showtimes',
        require:true
    }],
    comments:[{
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            require:true
        },
        content:{type:String,require:true},
        createdAt:{type:Date,default:Date.now()},
    }],
    statusEvent:{type:String,
        enum:['PendingApproval',"NotStarted",'Ongoing','Ended','Cancelled','OnSale','SoldOut','SaleStopped','NotYetOnSale'],
        require:true,
        default:'PendingApproval'},
    startAt:{type:Date},
    endAt:{type:Date},
    // status:{type:Boolean,require:true,default:true}
},
{
    timestamps: true
})

const EventModel = mongoose.model('events',EventSchema)
module.exports = EventModel