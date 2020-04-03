// declare dependencies
const express = require('express');
const passport = require('passport');
const BuyCodeSuccess = require('../models/buyCodeSuccess');
const Member = require('../models/member');
const ReferralCode = require('../models/referralCode');
const MemberSummary = require('../models/memberSummary');
const MiningEngine = require('../models/miningEngine');

const router = express.Router();

router.get('/',(req,res) => {
  res.render('index',{host: process.env.HOST});
});

router.get('/register',(req,res) => {
  if(req.isAuthenticated()){
    res.redirect('/dashboard');
  } else {
    res.render('register',{host: process.env.HOST});
  }
});

router.post('/register',(req,res) => {
  let isValid = true;
  // get the body payload fields
  const message = {
    firstname: {
      value: req.body.firstname || '',
    },
    lastname: {
      value: req.body.lastname || '',
    },
    address: {
      value: req.body.address || '',
    },
    referral: {
      value: req.body.referral || '',
    },
    email: {
      value: req.body.email || '',
    },
    password: {
      value: req.body.password || '',
    },
    password2: {
      value: req.body.password2 || ''
    },
    condition: {

    }
  };
  // validating fields
  if(message.firstname.value.length <= 1){
    message.firstname.error = "Please provide valid firstname";
    isValid = false;
  }
  if(message.lastname.value.length <= 1){
    message.lastname.error = "Please provide valid lastname";
    isValid = false;
  }
  if(message.address.value.length < 5){
    message.address.error = "Please provide valid address";
    isValid = false;
  }
  if(message.email.value.length <= 1){
    message.email.error = "Please provide valid email";
    isValid = false;
  }
  if(message.referral.value.length <= 0){
    message.referral.error = "Please provide valid referral code";
    isValid = false;
  }
  if(message.password.value.length <= 7){
    message.password.error = "Please provide strong password, Password must be at least 8 characters";
    isValid = false;
  }
  if(message.password.value !== message.password2.value){
    message.password2.error = "Password did not match";
    isValid = false;
  }
  if(typeof(req.body.condition) !== 'string'){
    message.condition.error = "Please read and accept the terms and condition";
    isValid = false;
  }
  // if all fields are valid
  if(isValid){
    // check if referral code is valid
    BuyCodeSuccess.findById(message.referral.value,(err,buyCodeSuccessData) => {
      if(buyCodeSuccessData === null) {
        // if refToken key is invalid
        message.referral.error = "Specified referral code is invalid";
        res.render('register',{message: message,host: process.env.HOST});
      }else {
        // check referral code already used, if not use then proceed to register
        if(!buyCodeSuccessData.isUsed){
          // create new user fields
          const newUser = {
            firstname: message.firstname.value,
            lastname: message.lastname.value,
            address: message.address.value,
            referral: message.referral.value,
            email: message.email.value,
            username: message.email.value,
          };
          // inserting new user to database if valid
          Member.register(newUser,message.password.value,(err) => {
            if(!err){
              // get the registered user
              Member.findOne({username: message.email.value},(err,memberResult) => {
                if(!err && memberResult) {
                  // create referralCode data to new registered user
                  const referralData = {
                    referralCodes:[],
                    left: [],
                    right: []
                  };
                  ReferralCode.create(referralData,(err,referralCodeResult) => {
                    if(!err) {
                      // if no error assign referralCode id to new registered user
                      memberResult.referralCodes = referralCodeResult._id;
                      // create member summary to default values
                      MemberSummary.create({downline: 0},(err,summaryData) => {
                        if(!err){
                          // assign new created memberSummaryID to new member with defaults values
                          memberResult.memberSummary = summaryData._id;
                          // create mining engine to new member
                          MiningEngine.create({minings: []},(err,miningData) =>{
                            // if no error then refenrence mining engine id to new member
                            if(!err){
                              // refenrence mining engine id to new member
                              memberResult.mining = miningData._id;
                              // save and update new member
                              memberResult.save((err) => {
                                // if no error registration process is successful
                                if(!err){
                                  // redirect to login if no error
                                  res.redirect('/login');
                                } else {
                                  // error redirect in register
                                  console.log(err);
                                  res.render('register',{message: message,host: process.env.HOST});
                                }
                              });
                            } else {
                              // error when creating member summary
                              console.log(err);
                              res.render('register',{message: message,host: process.env.HOST});
                            }
                          });
                        } else {
                          // error when creating member summary
                          console.log(err);
                          res.render('register',{message: message,host: process.env.HOST});
                        }
                      });
                    } else {
                      // error when creating referral code
                      console.log(err);
                      res.render('register',{message: message,host: process.env.HOST});
                    }
                  });
                } else {
                  console.log(err);
                  res.render('register',{message: message,host: process.env.HOST});
                }
              });
              // update the referral code to isUsed = true and save to database
              buyCodeSuccessData.isUsed = true;
              buyCodeSuccessData.save();
            } else{
              // if email already existed
              if(err.name === 'UserExistsError'){
                message.email.error = "Specified email address already registered"
                res.render('register',{message: message,host: process.env.HOST});
              } else{
                console.log(err);
                res.render('register',{message: message,host: process.env.HOST});
              }
            }
          });
        } else {
          // referral code exist but already in used
          message.referral.error = "Specified referral code is invalid";
          res.render('register',{message: message,host: process.env.HOST});
        }
      }
    });
  } else {
    // error if some fields are invalid
    res.render('register',{message: message,host: process.env.HOST});
  }
});

router.get('/login',(req,res) => {
  if(req.isAuthenticated()){
    res.redirect('/dashboard');
  } else{
    res.render('login',{host: process.env.HOST});
  }
});

router.post('/login', function(req, res, next) {
  const email = req.body.username || '';
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return res.render('login',{message: {error: "Invalid credentials, or account not verified yet.", email: email},host: process.env.HOST});
    }
    if (!user) {
      return res.render('login',{message: {error: "Invalid credentials, or account not verified yet.",email: email},host: process.env.HOST});
    }
    // try to login and set sesssion the account
    req.logIn(user, function(err) {
      if (err) { 
        return res.render('login',{message: {error: "Invalid credentials, or account not verified yet.",email: email},host: process.env.HOST});
      }
      return res.redirect('/dashboard');
    });
  })(req, res, next);
});

// router.post("/login",passport.authenticate("local",
//   {
//     successRedirect: "/dashboard",
//     failureRedirect: "/login"
//   }),
//   (req,res) => {
// });

router.get('/logout',(req,res) => {
  req.logOut();
  res.redirect('/login');
});

module.exports = router;