// declare dependencies
const url = require('url');
const express = require('express');
const passport = require('passport');
const User = require('../models/users');
const RegistrationToken = require('../models/registrationToken');
const helper = require('../lib/helpers');
const indexMiddleware =require('../middleware/index');

const router = express.Router();

router.get('/register',(req,res) => {
  res.render('register');
});

router.post('/register',(req,res) => {
  let isValid = true;
  const message = {
    firstname: {
      value: req.body.firstname || '',
    },
    initial: {
      value: req.body.initial || '',
    },
    lastname: {
      value: req.body.lastname || '',
    },
    address: {
      value: req.body.address || '',
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
  if(message.initial.value.length <= 1){
    message.initial.error = "Please provide valid initial";
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

  if(isValid){
    // create new user fields
    const newUser = {
      firstname: message.firstname.value,
      initial: message.initial.value,
      lastname: message.lastname.value,
      address: message.address.value,
      email: message.email.value,
      username: message.email.value
    }
    // inserting new user to database
    User.register(newUser,message.password.value,(err) => {
      if(!err){
        // get the registered user
        User.findOne({username: message.email.value},(err,userResult) => {
          if(!err){
            // insert registered token to database
            RegistrationToken.create({userId: userResult._id},(err,tokenResult) => {
              if(!err && tokenResult){
                // link to confirm the email
                const linkToConfirm = process.env.HOST+":"+process.env.PORT+
                  "/register/confirmation?token="+tokenResult._id+"&id=" + userResult._id;
                // send email
                helper.sendMail(message.email.value,"Email Confirmation","Please click the email " + 
                  linkToConfirm,(isError,error) => {
                    if(!isError){
                      res.redirect('/login');
                    } else {
                      console.log(error);
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
              userResult.isValidated = true;
              // save the user to update the is verified status
              userResult.save((err) => {
                if(!err){
                  res.redirect('/login');
                } else {
                  res.redirect('/login');
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
    res.render('login');
  }
});

router.post('/login', function(req, res, next) {
  const email = req.body.username || '';
  User.findOne({username: email},(err,userResult) => {
    if(!err && userResult){
      if(userResult.isValidated){
        // try to login the account
        passport.authenticate('local', function(err, user, info) {
          if (err) {
            return res.render('login',{message: {error: "Invalid username or email, or account not verified yet.", email: email}});
          }
          if (!user) {
            return res.render('login',{message: {error: "Invalid username or email, or account not verified yet.",email: email}});
          }
          req.logIn(user, function(err) {
            if (err) { 
              return res.render('login',{message: {error: "Invalid username or email, or account not verified yet.",email: email}});
            }
            return res.redirect('/dashboard');
          });
        })(req, res, next);
      } else {
        return res.render('login',{message: {error: "Invalid username or email, or account not verified yet.",email: email}});
      }
    } else {
      return res.render('login',{message: {error: "Invalid username or email, or account not verified yet.",email: email}});
    }
  });
});

router.get('/logout',(req,res) => {
  req.logOut();
  res.redirect('/login');
});

module.exports = router;