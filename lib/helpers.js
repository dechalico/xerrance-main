// dependencies declaration
const lib = {}
const nodemailer = require('nodemailer');

lib.createToken = (length) => {
  const possibleChars = "1234567890abcdefghijklmnopqrstuvwxyz";
  let result = '';
  for(let i=0; i < length; i++){
    const rand = possibleChars.charAt(Math.floor((Math.random() * possibleChars.length)));
    result += rand;
  }
  return result;
};

lib.sendMail = (to,subject,message,callback) => {
  // creating mail transporter configuration
  const mailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    secure: true,
    auth: {
      type: process.env.EMAIL_AUTH_TYPE,
      user: process.env.EMAIL_AUTH_USER,
      clientId: process.env.EMAIL_AUTH_CLIENT_ID,
      clientSecret: process.env.EMAIL_AUTH_CLIENT_SECRET,
      refreshToken: process.env.EMAIL_AUTH_REFRESH_TOKEN,
      accessToken: process.env.EMAIL_AUTH_ACCESS_TOKEN
    }
  });
  
  // mail details
  const mailDetails = {
    from: process.env.EMAIL,
    to: to,
    subject: subject,
    text: message
  };

  // sending to email and return callback
  mailTransporter.sendMail(mailDetails,(err,data) => {
    if(!err){
      callback(false);
    } else {
      callback(true,err);
    }
  });
};

module.exports = lib;