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
    }
    ]

})

const FollowModel = mongoose.model('followers', FollowSchema)
module.exports = FollowModel