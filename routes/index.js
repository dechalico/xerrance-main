// declare dependencies
const express = require('express');
const passport = require('passport');
const register = require('../lib/code/register');
const verifyMember = require('../lib/code/verifyMember');
const Member = require('../models/member');
const BuyCodeInWeb = require('../models/buyCodeInWeb');
const helper =require('../lib/helpers');
const ForgotPassword = require('../models/forgotPasswordRequest');

const router = express.Router();

router.get('/buyreferralcode',(req,res) => {
  res.render('buyReferral',{title: 'Xerrance | Buy Referral Code'});
});

router.get('/terms',(req,res) => {
  res.render('terms',{title: 'Xerrance | Terms and Condition'});
});

router.get('/faq',(req,res) => {
  res.render('faq',{title: 'Xerrance | FAQ'});
});

router.get('/forgot-password',(req,res) => {
  res.render('forgotPassword',{title: 'Xerrance | Forgot Password'});
});

router.post('/forgot-password',(req,res) => {
  const email = typeof(req.body.email) == 'string' ? req.body.email.trim() : false;
  if(email){
    // try to find email
    Member.find({email: email},(err,member) => {
      if(!err && member && member.length > 0){
        ForgotPassword.create({email: email},(err,forgotPassword) => {
          if(!err && forgotPassword){
            const link = process.env.HOST + "/account-recovery?token=" + forgotPassword._id;
            helper.sendMail(email,"Account Recovery","Please visit this link " + link + " to change your password",(err) => {
              const data = {
                message: 'We send an email in your inbox to continue recover your account',
                title: 'Recover Account'
              }
              res.render('message',{data: data,title: 'Xerrance | Recover Account Notification'});
            });
          } else {
            res.render('forgotPassword',{isEmailValid: false,message: 'Internal error happen, request again later',title: 'Xerrance | Forgot Password'});
          }
        });
      } else {
        res.render('forgotPassword',{isEmailValid: false,message: 'Specified email not found on the server',title: 'Xerrance | Forgot Password'});
      }
    });
  } else {
    res.redirect('/forgot-password');
  }
});

router.get('/account-recovery',(req,res) => {
  const token = typeof(req.query.token) == 'string' ? req.query.token.trim() : false;
  const data = {
    message: 'The link you requested is already expired',
    title: 'Session Expired'
  };

  if(token){
    ForgotPassword.findById(token,(err,forgotPassword) => {
      if(!err && forgotPassword && !forgotPassword.isRecoverSuccessfull){
        res.render('recoverAccount',{token: token,title: 'Xerrance | Recover Account'});
      } else {
        res.render('message',{data: data,title: 'Xerrance | Recover Account Notification'});
      }
    });
  } else {
    res.render('message',{data: data,title: 'Xerrance | Recover Account Notification'});
  }
});

router.post('/account-recovery',(req,res) => {
  // validate fields
  const password = typeof(req.body.password) == 'string' && typeof(req.body.password2) == 'string' &&
    req.body.password.trim() == req.body.password2.trim() && req.body.password.trim().length > 7 ? req.body.password.trim() : false;
  const token = req.body.token;
  if(password){
    // check if the token is valid
    ForgotPassword.findById(token,(err,forgotPassword) => {
      if(!err && forgotPassword && !forgotPassword.isRecoverSuccessfull){
        // find the mmeber by username. passport local api
        Member.findByUsername(forgotPassword.email,(err,member) => {
          if(!err && member){
            // change the password
            member.setPassword(password,() => {
              // save and update the member
              member.save();
              // save and update the forgot password details
              forgotPassword.isRecoverSuccessfull = true;
              forgotPassword.save(err => {
                if(err){
                  console.log('Error when updating forgotPassword data');
                }
              });
              const data = {
                message: 'Account Successfully Recovered.',
                title: 'Recover Account'
              };
              res.render('message',{data: data,title: 'Xerrance | Recover Account Notification'});
            });
          } else {
            res.render('recoverAccount',{email: email,title: 'Xerrance | Recover Account'});
          }
        });
      } else {
        const data = {
          message: 'The link you requested is already expired',
          title: 'Session Expired'
        };
        res.render('message',{data: data,title: 'Xerrance | Recover Account Notification'});
      }
    });
  } else {
    res.render('recoverAccount',{message: 'Possible error: Password did not match, Password must be at least 8 characters',token: token,title: 'Xerrance | Recover Account'});
  }
});

router.post('/buyreferralcode',(req,res) => {
  const email = typeof(req.body.email) == 'string' && req.body.email.trim().length > 5 ? req.body.email.trim() : false;
  if(email){
    const data = {
      email: email,
      usdPrice: 70,
      discountPercent: 0,
      totalUsdPrice: 70,
      isEmailConfirmed: false,
    };
    BuyCodeInWeb.create(data,(err,buyData) => {
      if(!err && buyData){
        const link = process.env.HOST + '/order/buyreferral?token=' + buyData._id;
        const message = 'Thank you for buying referral code. Please follow this link ' + link + ' to continue your transaction';
        helper.sendMail(email,'Buy Referral Code',message,(err) => {
          const data = {
            head: 'Email Confirmation',
            title: 'Hello there,  We\'ve got your Order!',
            body: 'Thank you for your purchase order of Xerrance Referral Code. Please check your inbox for a confirmation email. Click the link in the email to confirm and proceed to the payment.'
          };
          res.render('orderNotification',{data: data,title: 'Xerrance | Buy Referral Code Notification'});
        });
      } else {
        res.redirect('/buyreferralcode');
      }
    });
  }else {
    res.redirect('/buyreferralcode');
  }
});

router.get('/order/buyreferral',(req,res) => {
  const token = typeof(req.query.token) == 'string' ? req.query.token.trim() : false;
  if(token){
    // check if token is valid
    BuyCodeInWeb.findById(token,(err,buyData) => {
      // check if their is data and check if the transaction is already payed
      if(!err && buyData && !buyData.isPaymentSuccess){
        const data = {
          totalPrice: buyData.totalUsdPrice,
          email: buyData.email,
          id: buyData._id
        };
        buyData.isEmailConfirmed = true;
        buyData.dateEmailConfirmed = Date.now();
        buyData.save(err => {
          if(err){
            res.redirect('/buyreferralcode');
          } else {
            res.render('payReferral',{data: data,title: 'Xerrance | Referral Code Payment'});
          }
        });
      } else {
        res.redirect('/buyreferralcode');
      }
    });
  } else {
    res.redirect('/buyreferralcode');
  }
});

router.get('/',(req,res) => {
  res.render('index');
});

router.get('/register',(req,res) => {
  if(req.isAuthenticated()){
    res.redirect('/dashboard');
  } else {
    res.render('register',{title: 'Xerrance | Registration'});
  }
});

// route for membership registration
router.post('/register',(req,res) => {
  // optional code logic here
  // 
  // try to register the member
  register(req,res);
});

// membership verification route
// note! must notify member if some values are invalid
router.get('/membership/verification',(req,res) => {
  // construct query params to validate format
  const id = typeof(req.query.id) === 'string' && req.query.id.trim().length > 5 ? req.query.id.trim() : false;
  const token = typeof(req.query.token) === 'string' && req.query.token.trim().length > 5 ? req.query.token.trim() : false;

  if(id && token){
    // check if Member id is valid
    verifyMember(res,id,token);
  } else {
    // if id and token is invalid format
    res.redirect('/register');
  }
});

router.get('/login',(req,res) => {
  if(req.isAuthenticated()){
    res.redirect('/dashboard');
  } else{
    let data = null;
    if(req.query.callback && req.query.id){
      data = req.query.callback + "&id=" + req.query.id;
    }
    res.render('login',{title: 'Xerrance | Login'});
  }
});

router.post('/login', function(req, res, next) {
  const email = req.body.username || '';
  Member.findOne({email: email},(err,member) => {
    if(!err && member && member.isEmailVerified){
      passport.authenticate('local', function(err, user, info) {
        if (err) {
          return res.render('login',{message: {error: "Invalid credentials, or account not verified yet.", email: email},title: 'Xerrance | Login'});
        }
        if (!user) {
          return res.render('login',{message: {error: "Invalid credentials, or account not verified yet.",email: email},title: 'Xerrance | Login'});
        }
        // try to login and set sesssion the account
        req.logIn(user, function(err) {
          if (err) { 
            return res.render('login',{message: {error: "Invalid credentials, or account not verified yet.",email: email},title: 'Xerrance | Login'});
          }
          if(typeof(req.body.callback) == 'string' && req.body.callback.trim().length > 10){
            res.redirect(req.body.callback.trim());
          } else {
            return res.redirect('/dashboard');
          }
        });
      })(req, res, next);
    } else {
      return res.render('login',{message: {error: "Invalid credentials, or account not verified yet.",email: email},title: 'Xerrance | Login'});
    }
  });
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