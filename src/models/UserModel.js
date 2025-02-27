const { Double } = require("mongodb");
const { default: mongoose } = require("mongoose");

const UserSchema = new mongoose.Schema({
    fullname:{type:String},
    email:{type:String,required:true},
    password:{type:String},
    address:{
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
    searchHistory: [{
        keyword: { type: String, required: true },
        searchedAt: { type: Date, default: Date.now },
        // isDeleted:{type:Boolean,default:false}
    }],
    googleId: { type: String, unique: true },
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
    numberOfFollowing:{type:Number,default:0},
    numberOfFollowers:{type:Number,default:0},
    lastCheckIn: { type: Number,default:-1 },
    IsDailyCheck:{type:Boolean,default:false},
    totalCoins:{type:Number,required:true,default:0},
    createAt:{type:Date,default:Date.now()},
    updateAt:{type:Date,default:Date.now()}

})

const UserModel = mongoose.model('users',UserSchema)
module.exports = UserModel