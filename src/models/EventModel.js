const { default: mongoose } = require("mongoose");

const EventSchema = new mongoose.Schema({
    title:{type:String,required:true},
    titleNonAccent:{type:String,required:true},
    description:{type:String},
    Address:{type:String,required:true},
    photoUrl:{type:String},
    Location:{type:String,required:true},
    position:{type:Object,required:true},
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
    addressDetails:{
        province:{
            name:{type:String},
            code:{type:Number},
        },
        districts:{
            name:{type:String},
            code:{type:Number},
        },
        ward:{
            name:{type:String},
            code:{type:Number},
        },
        houseNumberAndStreet:{type:String}
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'keywords',
        require:true
    }],
    showTimes:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'showtimes',
        require:true
    }],
    totalComments:{type:Number,default:0},
    statusEvent:{type:String,
        enum:['PendingApproval',"NotStarted",'Ongoing','Ended','Cancelled','OnSale','SoldOut','SaleStopped','NotYetOnSale'],
        require:true,
        default:'PendingApproval'},
    viewCount:{type:Number,default:0},
    viewRecord:[{
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            require:true
        },
        createdAt:{type:Date,default:Date.now()},
    }],
    uniqueViewCount:{type:Number,default:0},
    uniqueViewRecord:[{
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            require:true
        },
        createdAt:{type:Date,default:Date.now()},
    }],
},
{
    timestamps: true
})

const EventModel = mongoose.model('events',EventSchema)
module.exports = EventModel