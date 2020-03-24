const express = require('express');
const Convertion = require('../models/convertion');
const BuyCode = require('../models/buyCode');
const helper = require('../lib/helpers');

const router = express.Router();


router.get('/buycode',(req,res) => {
  // get the convertion
  Convertion.findOne({},(err,convertionResult) => {
    if(!err && convertionResult){
      const data = {
        quantity: 1,
        phpPrice: 3500,
        usdtPrice: 3500 / convertionResult.php,
        totalPHP: 3500,
        totalUSDT: 3500 / convertionResult.php,
        currentDate: new Date()
      }
      res.render('buyCode/buyReferralCode',{data: data,host: process.env.HOST});
    } else {
      // if error or no convertion found
      res.redirect("/server-error");
    }
  });
});

router.post('/buycode',(req,res) => {
  let isValidAllField = true;
  // validate all fields 
  const message= {
    email: {
      value: typeof(req.body.email) === 'string' && req.body.email.trim().length > 3 ? req.body.email.trim() : ''
    }
  }
  // check if all fields are valid
  if(message.email.value.length === 0){
    message.email.error = "Please provide valid email address"
    isValidAllField = false;
  }

  // if all fields are valid
  if(isValidAllField){
    // get the convertion if any
    Convertion.findOne({},(err,convertionResult) => {
      if(!err && convertionResult){
        // if no error and their is convertion data
        const data = {
          email: message.email.value,
          quantity: 1,
          phpPrice: 2450,
          usdtPrice: 2450 / convertionResult.php,
          totalPHP: 1 * 2450,
          totalUSDT: (2450 / convertionResult.php) * 1,
        }
        BuyCode.create(data,(err,buyCodeData) => {
          if(!err && buyCodeData){
            // if no error redirect to payment information
            const link = process.env.HOST + "/buycode/payment?ref=" + buyCodeData._id;
            helper.sendMail(message.email.value,"Buying Code for Registration",
              "Thank you for buying registration code. Please visit this link " + link + " to proceed to your payment.",(err) => {
                if(!err){
                  // if no error when sending an email to user
                  res.render("buyCode/emailSent",{host: process.env.PORT});
                } else {
                  // when their is error occure while sending email to user
                  res.render("buyCode/emailSent",{host: process.env.PORT});
                }
              });
          } else {
            // if error or no convertion found
            res.redirect("/server-error");
          }
        });
      } else {
        // if error or no convertion found
      res.redirect("/server-error");
      }
    });
  } else {
    // get the convertion and return error messages
    // get the convertion
    Convertion.findOne({},(err,convertionResult) => {
      if(!err && convertionResult){
        const data = {
          quantity: 1,
          phpPrice: 3500,
          usdtPrice: 3500 / convertionResult.php,
          totalPHP: 3500,
          totalUSDT: 3500 / convertionResult.php,
          currentDate: new Date()
        }
        res.render('buyCode/buyReferralCode',{data: data,host: process.env.HOST});
      } else {
        // if error or no convertion found
        res.redirect("/server-error");
      }
    });
  }
});

router.get('/buycode/payment',(req,res) => {
  if(typeof(req.query.ref) === 'string' && req.query.ref.trim().length > 0){
    BuyCode.findById(req.query.ref,(err,buyCodeResult) => {
      if(!err && buyCodeResult){
        buyCodeResult.isValidated = true;
        buyCodeResult.save((err) => {
          if(!err){
            res.render('buyCode/payment',{host: process.env.HOST});
          } else {
            res.redirect('/buycode');
          }
        });
      } else {
        res.redirect('/buycode');
      }
    });
  } else {
    res.redirect('/buycode');
  }
});

module.exports = router;