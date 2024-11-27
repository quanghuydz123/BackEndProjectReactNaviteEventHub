const nodemailer = require("nodemailer");
require('dotenv').config()

const handleSendMail = async (val, email) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true, // Use `true` for port 465, `false` for all other ports
            auth: {
                user: process.env.USERNAME_EMAIL,
                pass: process.env.PASSWORD,
            },
        });

        await transporter.sendMail({
            from: `Support Evenhub Application <${process.env.USERNAME_EMAIL}>`, // sender address
            to: email, // list of receivers
            subject: "Verification email code", // Subject line
            text: "Your code to verification email", // plain text body
            html: `<b>${val}</b>` // html body
        });
        return "OK"
    } catch (error) {
        return error
    }
}

const handleSendEmailUpdate = async (data)=>{
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.USERNAME_EMAIL,
                pass: process.env.PASSWORD,
            },
        });

        await transporter.sendMail(data);
        return "OK"
    } catch (error) {
        return error
    }
}

const handleSendMailPaymmentSuccess = async (val, email) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,  
            secure: true, // Use `true` for port 465, `false` for all other ports
            auth: {
                user: process.env.USERNAME_EMAIL,
                pass: process.env.PASSWORD,
            },
        });

        await transporter.sendMail({
            from: `Support Evenhub Application <${process.env.USERNAME_EMAIL}>`, // sender address
            to: email, // list of receivers
            subject: `Đơn hàng #900243146 - Vé tham dự sự kiện 'Khoá tu Mùa Hè TÌM VỀ CHÍNH MÌNH `, // Subject line
            text: "Your code to verification email", // plain text body
            html: `<b>${val}</b>` // html body
        });
        return "OK"
    } catch (error) {
        return error
    }
}
module.exports = {
    handleSendMail,
    handleSendEmailUpdate,
    handleSendMailPaymmentSuccess
}