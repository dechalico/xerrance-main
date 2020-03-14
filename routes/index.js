// declare dependencies
const express = require('express');
const passport = require('passport');
const User = require('../models/users');

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
        passport.authenticate("local")(req,res,() => {
          console.log("user created successfully");
        });
      } else{
        console.log(err);
      }
    });
  } else {
    res.render('register',{message: message});
  }

});

module.exports = router;