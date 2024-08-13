const asyncHandle = require('express-async-handler')
const { JWT } = require('google-auth-library');
const UserModel = require("../models/UserModel")
const EmailService = require('../service/EmailService');
const EventModel = require('../models/EventModel');
const NotificationModel = require('../models/NotificationModel');
const FollowModel = require('../models/FollowModel');

const handleSendNotification = async ({ fcmToken, title, subtitle, body, data }) => {
  var request = require('request');
  var options = {
    'method': 'POST',
    'url': 'https://fcm.googleapis.com/v1/projects/eventapp-1cfef/messages:send',
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getAccessToken()}`
    },
    body: JSON.stringify({
      "message": {
        "token": `${fcmToken}`,
        "data": data,
        "notification": {
          "body": `${body}`,
          "title": `${title}`
        }
      }
    })

  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
  });

}

const getAccessToken = () => {
  return new Promise(function (resolve, reject) {
    const key = require('../placeholders/adminsdk.json');
    const jwtClient = new JWT(
      key.client_email,
      null,
      key.private_key,
      ['https://www.googleapis.com/auth/cloud-platform'],
      null
    );
    jwtClient.authorize(function (err, tokens) {
      if (err) {
        reject(err);
        return;
      }
      resolve(tokens.access_token);
    });
  });
}

const handleSendNotificationInviteUserToEvent = asyncHandle(async (req, res) => {
  const { SenderID, RecipientIds, eventId } = req.body;
  const event = await EventModel.findById(eventId);

  // Sử dụng Promise.all để chờ cho tất cả các async operation hoàn thành (phải có nếu không nó sẽ chạy xuống res)
  await Promise.all(RecipientIds.map(async (id) => {
    const user = await UserModel.findById(id);
    const fcmTokens = user.fcmTokens;

    if (fcmTokens.length > 0) {
      await Promise.all(fcmTokens.map(async (fcmToken) => {
        await handleSendNotification({
          fcmToken: fcmToken,
          title: 'Thông báo',
          subtitle: '',
          body: `Bạn được mời tham gia sự kiện ${event.title} hãy tham gia ngay !!!`,
          data: {
            id: eventId
          }
        });
      }));
    } else {
      const data = {
        from: `Support Evenhub Application <${process.env.USERNAME_EMAIL}>`,
        to: user.email,
        subject: "Thông báo",
        text: "Bạn được mời tham gia sự kiện này hãy vô xem ngay",
        html: `<b>abc</b>`
      };

    }

    await NotificationModel.create({
      senderID: SenderID,
      recipientId: id,
      eventId,
      type: 'inviteEvent',
      content: `đã mời bạn tham gia sự kiện ${event.title} hãy tham gia ngay !!!`,
    });
  }));

  res.status(200).json({
    status: 200,
    message: 'success',
    data: {}
  });
});

const getAll = asyncHandle(async (req, res) => {
  const notifications = await NotificationModel.find().populate({
    path: 'senderID recipientId',
  })
    .populate({
      path: 'eventId',
      populate: [
        { path: 'categories' },
        { path: 'authorId' },
        { path: 'users' }
      ]
    });
  res.status(200).json({
    status: 200,
    message: 'Thành công',
    data: {
      notifications
    }
  })
})
const getnotificationsById = asyncHandle(async (req, res) => {
  const { uid } = req.query
  const notifications = await NotificationModel.find({ recipientId: uid }).populate({
    path: 'senderID recipientId',
  })
    .populate({
      path: 'eventId',
      populate: [
        { path: 'categories' },
        { path: 'authorId' },
        { path: 'users' }
      ]
    }).sort({ "createdAt": -1 });
  res.status(200).json({
    status: 200,
    message: 'Thành công',
    data: {
      notifications
    }
  })
})
const updateIsViewedNotifications = asyncHandle(async (req, res) => {
  const { uid } = req.body
  const updateIsViewedNotifications = await NotificationModel.updateMany({ recipientId: uid }, { $set: { isViewed: true } })
  res.status(200).json({
    status: 200,
    message: 'Thành công',
    data: {

    }
  })
})
const deleteNotifications = asyncHandle(async (req, res) => {
  const { uid } = req.body
  const deleteA = await NotificationModel.deleteMany({})
  res.status(200).json({
    status: 200,
    message: 'Thành công',
    data: {

    }
  })
})
const updateStatusNotifications = asyncHandle(async (req, res) => {
  const { idUserFollow, idUserFollowed, type } = req.body
  if (type === 'answered') {

    const followerUser = await FollowModel.findOne({ user: idUserFollow })
    if (followerUser) {
      let users = [...followerUser.users]
      const userFollow = users.find((item) => item.idUser.toString() === idUserFollowed.toString())
      const idNotification = users.find((item) => item.idUser.toString() === idUserFollowed.toString()).idNotification
      await FollowModel.findByIdAndUpdate(followerUser.id, { //hay
        $set: {
          'users.$[x].status': true,
        }
      }, {
        arrayFilters: [
          { "x._id": userFollow.id }
        ]
      })
      await NotificationModel.findByIdAndUpdate(idNotification, { status: 'answered' }, { new: true })
      await NotificationModel.create({
        senderID: idUserFollowed,
        recipientId: idUserFollow,
        type: 'allowFollow',
        content: `đã đồng ý cho bạn theo dõi !!!`,
        status: 'other',
        isRead: true
      })
      res.status(200).json({
        status: 200,
        message: 'cập nhập followUserOther thành công',
        data: {

        }

      })
    }
  }
  else if (type === 'rejected') {
    const followerUser = await FollowModel.findOne({ user: idUserFollow })
    if (followerUser) {
      let users = [...followerUser.users]
      const index = users.findIndex(item => item.idUser.toString() === idUserFollowed.toString())
      if (index != -1) {
        const idNotification = users.find((item) => item.idUser.toString() === idUserFollowed.toString()).idNotification
        users.splice(index, 1)
        const updateFollowUserOther = await FollowModel.findByIdAndUpdate(followerUser.id, { users: users }, { new: true })
        await NotificationModel.findByIdAndUpdate(idNotification, { status: 'rejected' }, { new: true })
        await NotificationModel.create({
          senderID: idUserFollowed,
          recipientId: idUserFollow,
          type: 'rejectFollow',
          content: `rất tiếc đã từ chối cho bạn theo dõi !!!`,
          status: 'other',
          isRead: true
        })
        res.status(200).json({
          status: 200,
          message: 'cập nhập followUserOther thành công',
          data: {
            followers: updateFollowUserOther
          }

        })
      }
    }
  }
})
module.exports = {
  handleSendNotificationInviteUserToEvent,
  handleSendNotification,
  getAccessToken,
  getAll,
  getnotificationsById,
  updateIsViewedNotifications,
  deleteNotifications,
  updateStatusNotifications
}