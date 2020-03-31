// this module is for creating referral codes for testing only
// must not used in production
const express = require('express');
const BuyCodeSuccess = require('../models/buyCodeSuccess');

const route = express.Router();

route.get('/test/referral',(req,res) => {
  // validate token if valid
  if(typeof(req.query.token) === 'string' && req.query.token.trim().length > 0
    && req.query.token.trim() === process.env.TEST_KEY){
    
    BuyCodeSuccess.create({email: 'xerrance01@gmail.com'},(err,buyCodeData) => {
      if(!err && buyCodeData){
        res.write('Referral Code: ' + buyCodeData._id);
      } else {
        res.write('Somethinf error happen, please try again');
      }
      res.end();
    });
  } else {
    res.write('Invalid request please go back to home page');
    res.end();
  }
});

module.exports = route;