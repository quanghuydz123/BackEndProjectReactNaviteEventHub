const { Double } = require("mongodb");
const { default: mongoose } = require("mongoose");

const UserSchema = new mongoose.Schema({
    fullname:{type:String},
    email:{type:String,required:true},
    password:{type:String},
    address:{
        province:{
            name:{type:String,required:true},
            code:{type:Number,required:true},
        },
        districts:{
            name:{type:String,required:true},
            code:{type:Number,required:true},
        },
        ward:{
            name:{type:String,required:true},
            code:{type:Number,required:true},
        },
        houseNumberAndStreet:{type:String}
    },
    photoUrl:{type:String},
    phoneNumber:{type:String},
    bio:{
        type:String
    },  
    position:{
        lat:{type:Number},
        lng:{type:Number}
    },
    fcmTokens:[{type:String}],
    idRole:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'roles',
    },
    eventsInterested:[{
        event:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'events',
            required:true
        },
        createdAt:{
            type: Date,
            default:Date.now()
        }
    }],
    categoriesInterested:[{
        category:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Categories',
            required:true
        },
        createdAt:{
            type: Date,
            default:Date.now()
        }
    }],
    viewedEvents:[{
        event:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'events',
            required:true
        },
        createdAt:{
            type: Date,
            default:Date.now()
        }
    }],
    // historyTransaction: [{
    //     id: {
    //         type: mongoose.Schema.Types.ObjectId,
    //         required: true,
    //         refPath: 'historyTransaction.type',
    //         unique:true
    //     },
    //     type: {
    //         type: String,
    //         enum: ['invoices', 'transfertickets'], // Loại tài liệu
    //         required: true
    //     }
    // }],
    numberOfFollowing:{type:Number,default:0},
    numberOfFollowers:{type:Number,default:0},
    createAt:{type:Date,default:Date.now()},
    updateAt:{type:Date,default:Date.now()}

})

const UserModel = mongoose.model('users',UserSchema)
module.exports = UserModel