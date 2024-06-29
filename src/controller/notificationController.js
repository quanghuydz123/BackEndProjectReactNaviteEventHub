const asyncHandle = require('express-async-handler')
const {JWT} = require('google-auth-library');
const UserModel = require("../models/UserModel")
const EmailService = require('../service/EmailService')

const handleSendNotification  = async ({fcmToken,title,subtitle,body,data})=>{
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

const getAccessToken = () =>{
    return new Promise(function(resolve, reject) {
      const key = require('../placeholders/adminsdk.json');
      const jwtClient = new JWT(
        key.client_email,
        null,
        key.private_key,
        ['https://www.googleapis.com/auth/cloud-platform'],
        null
      );
      jwtClient.authorize(function(err, tokens) {
        if (err) {
          reject(err);
          return;
        }
        resolve(tokens.access_token);
      });
    });
  }
  
const handleSendNotificationInviteUserToEvent  = asyncHandle( async (req, res) => {
    const {uids,eventId} = req.body
    uids.forEach(async (id)=>{
        const user = await UserModel.findById(id)
        const fcmTokens = user.fcmTokens
        if(fcmTokens.length > 0){
            fcmTokens.forEach(async (fcmToken)=>
                await handleSendNotification({
                    fcmToken:fcmToken,
                    title:'Gửi thông báo nè',
                    subtitle:'',
                    body:'Xin chào',
                    data:{
                        id:"123"
                    }
                })
            )
        }else{
            const data = {
                from: `Support Evenhub Application <${process.env.USERNAME_EMAIL}>`, // sender address
                to: user.email, // list of receivers
                subject: "Thông báo", // Subject line
                text: "Bạn được mời tham gia sự kiện này hãy vô xem ngay", // plain text body
                html: `<b>abc</b>` // html body
            }
        }
    })
    res.status(200).json({
        status:200,
        message:'succes',
        data:{

        }
    })
})

module.exports = {
    handleSendNotificationInviteUserToEvent,
    handleSendNotification,
    getAccessToken
}