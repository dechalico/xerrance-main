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

lib.formatDecimalToString = (decimalValue) => {
  // format the decimal to string '1,256.00'
  if(typeof(decimalValue) === 'number'){
    // convert the value to localestring and check if have decimal places
    const valueLocaleString = decimalValue.toLocaleString();
    const dotIndex = valueLocaleString.indexOf('.');

    if(dotIndex > -1){
      // if have decimal places
      return valueLocaleString.length >= (dotIndex + 1) + 2 ? valueLocaleString : valueLocaleString + "0";
    } else {
      // if no decimal places
      return valueLocaleString + ".00";
    }
  } else {
    return '0.00';
  }
};

lib.getBTCTransaction = (address,callback) => {
  const https = require('https');
  const api_key = process.env.BLOCKO_API_KEY;

  const options = {
    hostname: 'blockonomics.co',
    port: 443,
    path: '/api/merchant_order/' + address,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + api_key,
      'Content-Type': 'application/json'
    }
  }

  const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`)

    let chunkData = '';

    res.on('data', (d) => {
      chunkData += d;
    })

    res.on('end',() => {
      if(res.statusCode === 200){
        // convert chunk data to json object
        const jsonChunkData = JSON.parse(chunkData);
        callback(false,jsonChunkData);
      } else {
        callback(true);
      }
    });
  })

  req.on('error', (error) => {
    callback(true);
  })

  req.write('')
  req.end()
};
module.exports = lib;