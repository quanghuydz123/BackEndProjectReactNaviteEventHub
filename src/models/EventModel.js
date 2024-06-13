const { default: mongoose } = require("mongoose");

const EventSchema = new mongoose.Schema({
    title:{type:String,required:true},
    description:{type:String},
    Address:{type:String,required:true},
    photoUrl:{type:String},
    addressDetals:{type:Object},
    Location:{type:String},
    position:{type:Object,required:true},
    price:{type:Number,required:true},
    category:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categories',
        required: true,
    },
    authorId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    users:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    }],
    startAt:{type:Date,required:true},
    endAt:{type:Date},
    date:{type:Date},
    status:{type:Boolean,require:true,default:true}
},
{
    timestamps: true
})

const EventModel = mongoose.model('events',EventSchema)
module.exports = EventModel