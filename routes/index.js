// declare dependencies
const express = require('express');
const passport = require('passport');
const register = require('../lib/code/register');
const verifyMember = require('../lib/code/verifyMember');
const Member = require('../models/member');

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
    res.render('login',{host: process.env.HOST, data: data});
  }
});

router.post('/login', function(req, res, next) {
  const email = req.body.username || '';
  Member.findOne({email: email},(err,member) => {
    if(!err && member && member.isEmailVerified){
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
          if(typeof(req.body.callback) == 'string' && req.body.callback.trim().length > 10){
            res.redirect(req.body.callback.trim());
          } else {
            return res.redirect('/dashboard');
          }
        });
      })(req, res, next);
    } else {
      return res.render('login',{message: {error: "Invalid credentials, or account not verified yet.",email: email},host: process.env.HOST});
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