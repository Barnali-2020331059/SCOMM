const nodemailer = require("nodemailer");
const { smtpUsername, smtpPassword } = require("../secret");


const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use true for port 465, false for port 587
    auth: {
      user: smtpUsername,
      pass: smtpPassword,
    },
  });


  const emailWithNodeMailer = async (emailData)=>{
    try {
        const mailOptions = {
            from: smtpUsername,
            to: emailData.email,
            subject: emailData.subject,
            html: emailData.html,
        };
        const info = await transporter.sendMail(mailOptions);
        console.log ('Message sent: %s', info.response);
    } catch (error) {
        console.error('Error occured while sending mail', error);
        throw  error;
    }
  }


  module.exports= emailWithNodeMailer;
