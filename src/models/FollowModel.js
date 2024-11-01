const { default: mongoose } = require("mongoose");

const FollowSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    users: [{
        idUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
        },
        status: {
            type: Boolean,
            required: true,
            default: false
        },
        idNotification: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'notifications',
        }
    }
    ]

})

const FollowModel = mongoose.model('followers', FollowSchema)
module.exports = FollowModel