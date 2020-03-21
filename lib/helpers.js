// dependencies declaration
const lib = {}
const nodemailer = require('nodemailer');
const http = require('http');
const Convertion = require('../models/convertion');

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

lib.convertion = () => {
  // request to currency api
  const req = http.request("http://api.currencylayer.com/live?access_key=" + process.env.CURRENCY_API,(res) => {
    let data = '';
    // build chunk data
    res.on('data',chunk => {
      data += chunk;
    });
    res.on('end',() => {
      // convert to data to json object
      const jsonData = JSON.parse(data);
      // check if request is success
      if(jsonData.success){
        Convertion.findOne({},(err,convertionResult) => {
          if(!err && convertionResult){
            // if there is record in convertion update
            convertionResult.php = jsonData.quotes.USDPHP;
            convertionResult.save();
          } else {
            // if no record in convertion create
            Convertion.create({usd: 1,php:jsonData.quotes.USDPHP,dateUpdated: Date.now()});
          }
        });
      }
    });
  });

  req.end();
};
module.exports = lib;