const nodemailer = require("nodemailer");
const { GetTime, GetDateShortNew } = require("../utils/dateTime");
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
            subject: `Thanh toán thành công đơn hàng #${val.invoiceCode} - Vé tham dự sự kiện '${val.titleEvent}' `, // Subject line
            text: "Your code to verification email", // plain text body
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
                    <h2>Thông tin vé</h2>
                    <p><strong>${val.titleEvent}</strong></p>
                    <p><strong>Thời gian:</strong> ${GetTime(val.showTimeStart)}, ${GetDateShortNew(val.showTimeStart)}</p>
                    <p><strong>Địa điểm:</strong> ${val.location}</p>
                    <p><strong>Địa chỉ:</strong> ${val.address}</p>

                    <h3>Thông tin đơn hàng</h3>
                    <p><strong>Mã đơn hàng:</strong> ${val.invoiceCode}</p>
                    <p><strong>Khách hàng:</strong> ${val.userName}</p>
                    <p><strong>Email:</strong> ${val.email}</p>
                    <p><strong>Số điện thoại:</strong> ${val.phoneNumber}</p>
                    <p><strong>Phương thức thanh toán:</strong> VNPAY</p>
                    <p><strong>Thời gian thanh toán:</strong> ${GetTime(val.paymentTime)}, ${GetDateShortNew(val.paymentTime)}</p>


                    <h3>Chi tiết đơn hàng</h3>
                    <ul>
                        <li>Sản phẩm: ${val.titleEvent}</li>
                        <li>Số lượng: ${val.totalTicket}</li>
                        <li>Tổng tiền: ${val.totalPrice} VND</li>
                    </ul>

                    <h3>Điều khoản và điều kiện</h3>
                    <ul>
                        <li>Không hoàn tiền cho vé đã thanh toán.</li>
                        <li>Người mua phải trình vé tại sự kiện khi được yêu cầu.</li>
                        <li>Người mua chịu trách nhiệm bảo mật thông tin mã vé.</li>
                        <li>Nếu mua vé, tức là người mua đã đồng ý với các điều khoản và điều kiện trên.</li>
                    </ul>

                    <p>Nếu bạn có câu hỏi, vui lòng liên hệ:</p>
                    <p><strong>Email:</strong> support@quanghuydz123.vn</p>
                    <p><strong>Hotline:</strong> 0999888111 (Thứ 2 - CN, 6:00 - 18:30)</p>
                </div>
            `
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