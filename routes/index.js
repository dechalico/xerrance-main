// declare dependencies
const url = require('url');
const express = require('express');
const passport = require('passport');
const User = require('../models/users');
const UserSummary = require('../models/userSummary');
const RegistrationToken = require('../models/registrationToken');
const NotSendEmail = require('../models/notSendEmail');
const Convertion = require('../models/convertion');
const BuyCode = require('../models/buyCode');
const helper = require('../lib/helpers');
const indexMiddleware =require('../middleware/index');

const router = express.Router();

router.get('/',(req,res) => {
  res.render('comingSoon',{host: process.env.HOST});
});

router.get('/register',(req,res) => {
  if(req.isAuthenticated()){
    res.redirect('/dashboard');
  } else {
    res.render('register');
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
  if(message.referral.value.length <= req.hostname.length + 5){
    message.referral.error = "Please provide valid referral link";
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
    // create new user fields
    const newUser = {
      firstname: message.firstname.value,
      lastname: message.lastname.value,
      address: message.address.value,
      email: message.email.value,
      username: message.email.value,
    }
    // parse the referral link to get the query string refToken
    const parseUrl = url.parse(message.referral.value,true);
    const refToken = parseUrl.query.refToken;
    // check referral link if valid
    if(typeof(refToken) == 'string' && refToken.trim().length > 0){
      // check if refToken user is valid
      User.findById(refToken.trim(),(err,userResult) => {
        if(userResult === null){
          // if refToken key is invalid
          message.referral.error = "Specified referral link is invalid";
          res.render('register',{message: message});
        }else {
          // check if user reffered is validated
          if(userResult.isValidated){
            // add refToken to newUser referral
            newUser.referral = refToken;
            // inserting new user to database if valid
            User.register(newUser,message.password.value,(err) => {
              if(!err){
                // get the registered user
                User.findOne({username: message.email.value},(err,userResult) => {
                  if(!err && userResult){
                    // insert registered token to database
                    RegistrationToken.create({userId: userResult._id},(err,tokenResult) => {
                      if(!err && tokenResult){
                        // link to confirm the email
                        const linkToConfirm = process.env.HOST +"/register/confirmation?token="+tokenResult._id+"&id=" + userResult._id;
                        // send email
                        helper.sendMail(message.email.value,"Email Confirmation","Please click the email " + 
                          linkToConfirm,(isError,error) => {
                            if(!isError){
                              // if email sent to user registered
                              res.redirect('/login');
                            } else {
                              // if email not sent to user registered
                              NotSendEmail.create({
                                _id: userResult._id,
                                token: tokenResult._id
                              },(err,notSendEmailResult) => {
                                if(err){
                                  console.log(err);
                                }
                              });
                            }
                        });
                      } else {
                        console.log(err);
                      }
                    });
                  } else {
                    console.log(err);
                  }
                });
              } else{
                // if email already existed
                if(err.name === 'UserExistsError'){
                  message.email.error = "Specified email address already registered"
                  res.render('register',{message: message});
                } else{
                  console.log(err);
                }
              }
            });
          } else {
            // user exist but not validated means referral link not acceptable 
            message.referral.error = "Specified referral link is invalid";
            res.render('register',{message: message});
          }
        }
      });
    }else {
      // if referral url link is invalid format
      message.referral.error = "Specified referral link is invalid";
      res.render('register',{message: message});
    }
  } else {
    // error if some fields are invalid
    res.render('register',{message: message});
  }
});

router.get('/register/confirmation',(req,res) => {
  // validating query strings
  const token = typeof(req.query.token) === 'string' && req.query.token.trim().length > 0 ? req.query.token.trim() : false;
  const id = typeof(req.query.id) === 'string' && req.query.id.trim().length > 0 ? req.query.id.trim() : false;
  // check if valid
  if(token && id){
    // find the registration token if exist
    RegistrationToken.findById(token,(err,tokenResult) => {
      // validate if token and id are have reference
      if(!err && tokenResult){
        if(tokenResult.userId === id){
          // find the user and update is verified = true
          User.findById(id,(userError,userResult) => {
            if(!userError && userResult){
              // update isValidated field in user and link summary to user summary
              userResult.isValidated = true;
              userResult.summary = userResult._id;
              // save the user to update the is verified status
              userResult.save((err) => {
                if(!err){
                  res.redirect('/login');
                } else {
                  res.redirect('/login');
                }
              });
              // delete the confirmation token to free-up database
              RegistrationToken.findByIdAndDelete(token,(err) => {
                if(err){
                  console.log(err);
                }
              });
              // give referral Point to user who refer
              const referralId = userResult.referral;
              User.findById(referralId,(err,userReferral) => {
                // if user who refer exist,
                if(!err && userReferral){
                  // try to check if have userSummary
                  UserSummary.findById(userReferral._id,(err,referralSummary) => {
                    if(!err && referralSummary){
                      // if already have user summary so increament to 1
                      referralSummary.totalReferrals = referralSummary.totalReferrals +1;
                      UserSummary.findByIdAndUpdate(referralSummary._id,referralSummary,(err,updatedReferralSummary) => {
                        // log the error
                        if(err){
                          console.log(err)
                        }
                      });
                    } else if (err === null && referralSummary === null){
                      // if no have user summary yet then create
                      UserSummary.create({_id: referralId, totalReferrals: 1},(err,summaryRessult) => {
                        if(err){
                          // log the error if their is error occur
                          console.log(err);
                        }
                      });
                    } else {
                      console.log('dri nag last');
                    }
                  });
                }
              });
            } else {
              res.redirect('/login');
            }
          });
        } else {
          res.redirect('/login');
        }
      } else {
        res.redirect('/login');
      }
    });
  } else {
    res.redirect('/login');
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
  // check if username exist and validate
  User.findOne({username: email},(err,userResult) => {
    if(!err && userResult){
      // check if user is validated
      if(userResult.isValidated){
        // try to authenticate the account
        passport.authenticate('local', function(err, user, info) {
          if (err) {
            return res.render('login',{message: {error: "Invalid credentials, or account not verified yet.", email: email}});
          }
          if (!user) {
            return res.render('login',{message: {error: "Invalid credentials, or account not verified yet.",email: email}});
          }
          // try to login and set sesssion the account
          req.logIn(user, function(err) {
            if (err) { 
              return res.render('login',{message: {error: "Invalid credentials, or account not verified yet.",email: email}});
            }
            return res.redirect('/dashboard');
          });
        })(req, res, next);
      } else {
        return res.render('login',{message: {error: "Invalid credentials, or account not verified yet.",email: email}});
      }
    } else {
      return res.render('login',{message: {error: "Invalid credentials, or account not verified yet.",email: email}});
    }
  });
});

router.get('/logout',(req,res) => {
  req.logOut();
  res.redirect('/login');
});

router.get('/buycode',(req,res) => {
  // get the convertion
  Convertion.findOne({},(err,convertionResult) => {
    if(!err && convertionResult){
      const data = {
        phpPrice: 3500,
        usdtPrice: 3500 / convertionResult.php,
      }
      res.render('buyReferralCode',{data: data,host: process.env.HOST});
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
    },
    quantity: {
      value: typeof(req.body.quantity) === 'string' && req.body.quantity.trim().length > 0 ? Number(req.body.quantity) : 0
    }
  }
  // check if all fields are valid
  if(message.email.value.length === 0){
    message.email.error = "Please provide valid email address"
    isValidAllField = false;
  }
  if(message.quantity.value === 0){
    message.quantity.error = "Please provide valid quantity"
    isValidAllField = false;
  }

  if(isValidAllField){
    // get the convertion if any
    Convertion.findOne({},(err,convertionResult) => {
      if(!err && convertionResult){
        // if no error and their is convertion data
        const data = {
          email: message.email.value,
          quantity: message.quantity.value,
          phpPrice: 3500,
          usdtPrice: 3500 / convertionResult.php,
          totalPHP: message.quantity.value * 3500,
          totalUSDT: (3500 / convertionResult.php) * message.quantity.value,
        }
        BuyCode.create(data,(err,buyCodeData) => {
          if(!err && buyCodeData){
            // if no error redirect to payment information
            res.redirect("/buycode/payment?ref=" + buyCodeData._id);
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
  Convertion.findOne({},(err,convertionResult) => {
    if(!err && convertionResult){
      const data = {
        phpPrice: 3500,
        usdtPrice: 3500 / convertionResult.php,
      }
      res.render('buyReferralCode',{data: data,message: message,host: process.env.HOST});
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
        res.render('payment',{host: process.env.HOST});
      } else {
        res.redirect('/buycode');
      }
    });
  } else {
    res.redirect('/buycode');
  }
});

router.get('/cook',(req,res) => {
  const cookies = req.headers.cookie.split(';');
  console.log(cookies);
});

router.get('/test/clear',(req,res) => {
  User.deleteMany({},(err) => {
    if(!err){
      User.create({
        firstname: "dexter",
        lastname: "echalico",
        address: "Davao City",
        email: "admin@gmail.com",
        isValidated: true
      },(err) => {
        console.log(err);
      });
    }
  });
  RegistrationToken.deleteMany({},(err) => {
    console.log(err);
  });
  UserSummary.deleteMany({},(err) => {
    console.log(err);
  });
});


module.exports = router;