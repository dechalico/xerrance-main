const express = require('express');
const Convertion = require('../models/convertion');
const BuyCode = require('../models/buyCode');
const BuyCodeSuccess = require('../models/buyCodeSuccess');
const helper = require('../lib/helpers');

const router = express.Router();

// request buycode page
router.get('/buycode',(req,res) => {
  // get the php to usd convertion
  Convertion.findOne({},(err,convertionResult) => {
    if(!err && convertionResult){
      // create buycode order data and discounts and format decimal
      const disountPercent = 30;
      const data = {
        phpPrice: helper.formatDecimalToString(3500),
        usdtPrice: helper.formatDecimalToString(3500 / convertionResult.php),
        disount: disountPercent,
        totalPHP: helper.formatDecimalToString(3500-((disountPercent * 0.01) * 3500)),
        totalUSDT: helper.formatDecimalToString((3500-((disountPercent * 0.01) * 3500)) / convertionResult.php),
        currentDate: new Date()
      }
      res.render('buyCode/buyReferralCode',{data: data,host: process.env.HOST});
    } else {
      // if error or no convertion found
      res.redirect("/server-error");
    }
  });
});

// post and make transaction of buycode page
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
        const disountPercent = 30; 
        const data = {
          email: message.email.value,
          phpPrice: 3500,
          usdtPrice: 3500 / convertionResult.php,
          disountedPercent: disountPercent,
          totalPHP: 3500-((disountPercent * 0.01) * 3500),
          totalUSDT: (3500-((disountPercent * 0.01) * 3500)) / convertionResult.php,
        }
        // insert the buy code details
        BuyCode.create(data,(err,buyCodeData) => {
          if(!err && buyCodeData){
            // if no error redirect to payment information
            const link = process.env.HOST + "/buycode/payment?ref=" + buyCodeData._id + "&email=" + buyCodeData.email;
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
          phpPrice: helper.formatDecimalToString(3500),
          usdtPrice: helper.formatDecimalToString(3500 / convertionResult.php),
          disount: disountPercent,
          totalPHP: helper.formatDecimalToString(3500-((disountPercent * 0.01) * 3500)),
          totalUSDT: helper.formatDecimalToString((3500-((disountPercent * 0.01) * 3500)) / convertionResult.php),
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

// get buycode payment page to verified the email
router.get('/buycode/payment',(req,res) => {
  // check and validate the query string fields
  const ref = typeof(req.query.ref) === 'string' && req.query.ref.trim().length > 0 ? req.query.ref.trim() : false;
  const email = typeof(req.query.email) === 'string' && req.query.email.trim().length > 0 ? req.query.email.trim() : false

  // if all fields are valid
  if(ref && email){
    // check if ref is valid
    BuyCode.findById(req.query.ref,(err,buyCodeResult) => {
      if(!err && buyCodeResult){
        // if no error and their is result
        // check if email is ref value is refer to email
        if(buyCodeResult.email === email){
          // if email and ref value is valid
          buyCodeResult.isValidated = true;
          // update to validated and save the buycode details to database
          // get the some data to pass to user
          const data = {
            totalUSD: Math.round((buyCodeResult.totalUSDT + Number.EPSILON) * 100) / 100,
            transID: buyCodeResult._id
          }
          buyCodeResult.save((err) => {
            if(!err){
              res.render('buyCode/payment',{host: process.env.HOST,data: data});
            } else {
              res.redirect('/buycode');
            }
          });
        } else {
          res.redirect('/buycode');
        }
      } else {
        res.redirect('/buycode');
      }
    });
  } else {
    res.redirect('/buycode');
  }
});

router.get("/buycode/payment/unconfirm",(req,res) => {
  if(typeof(req.query.token) === 'string' && req.query.token.trim() === process.env.CALLBACK_TOKEN){
    helper.getBTCTransaction(req.query.addr,(err,data) => {
      if(!err){
        res.redirect('/buycode');
      } else {
        res.redirect('/buycode');
      }
    });
  } else {
    res.redirect('/buycode');
  }
});

// get all paymeny success callback
router.get("/buycode/payment/success",(req,res) => {
  // check if token string is valid for security purpose
  if(typeof(req.query.token) === 'string' && req.query.token.trim() === process.env.CALLBACK_TOKEN){
    // if token is valid then check the transaction data
    helper.getBTCTransaction(req.query.addr,(err,data) => {
      if(!err){
        // if thier is no error in getting transaction data and status == 2 means successfully paid
        if(data.status === 2) {
          // check if their is extra data value
          const extraData = typeof(data.data.extradata) === 'string' ? data.data.extradata.trim() : false;
          if(extraData){
            // if their is extra data value then transaction is clean and valid data
            // extraData value is : 'transId:asdfasd42134234asdf##type:head'
            const arrExtraData = extraData.split('##');
            // check the extra data is valid
            const arrTrans = typeof(arrExtraData[0]) === 'string' ? arrExtraData[0].split(':') : false;
            const arrTypes = typeof(arrExtraData[1]) === 'string' ? arrExtraData[1].split(':') : false;
            if(typeof(arrTrans[1]) === 'string' && typeof(arrTypes[1]) === 'string'){
              // valid extra data
              // check what kind of payment transaction
              if(arrTypes[1].trim() === 'head'){
                // buy one referral code type
                 BuyCode.findById(arrTrans[1].trim(),(err,buyCodeData) => {
                  if(!err && buyCodeData){
                    // if transaction id is valid, create buyCodeSuccessData to save
                    const buyCodeSuccessData = {
                      email: buyCodeData.email,
                      phpPrice: buyCodeData.phpPrice,
                      usdtPrice: buyCodeData.usdtPrice,
                      disountedPercent: buyCodeData.disountedPercent,
                      totalPHP: buyCodeData.totalPHP,
                      totalUSDT: buyCodeData.totalUSDT,
                      addr: data.address
                    };
                    // save to buyCodeSuccess table
                    BuyCodeSuccess.create(buyCodeSuccessData,(err,successCodeData) => {
                      if(!err){
                        // if save successfully delete the data in buycode record
                        BuyCode.findByIdAndDelete(buyCodeData._id,(err) => {
                          // delete buycode data to clean up databases
                        });

                        const message = 'Thank you for buying referral code, Your referral code is: ' + successCodeData._id;
                        helper.sendMail(successCodeData.email,"Referral Code",message,(err) => {
                          // email the referral code to user.
                        });
                        
                      }
                      res.render("buyCode/paymentSuccess",{host: process.env.PORT});
                    });
                  } else {
                    // invalid transaction id
                    res.redirect('/buycode');
                  }
                 });
              } else {
                // invalid transaction type
                res.redirect('/buycode');
              }
            } else {
              // invalid extra data
              res.redirect('/buycode');
            }
          } else {
            //if thier is no extra data value then save to database
            res.redirect('/buycode');
          }
        } else {
          // if their is error in getting the transaction data
          res.redirect('/buycode');
        }
      } else {
        res.redirect('/buycode');
      }
    });
  } else {
    res.redirect('/buycode');
  }
});

module.exports = router;