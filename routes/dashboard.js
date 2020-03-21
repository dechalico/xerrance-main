// declare dependencies
const express = require('express');
const indexMiddleware = require('../middleware/index');
const UserSummary = require('../models/userSummary');

const router = express.Router();

router.get('/dashboard',indexMiddleware.isLoggedIn,(req,res) => {
  // assign user to session user and create referral link
  const user = req.user;
  user.referralLink = process.env.HOST + "/referral?refToken=" + req.user._id;
  // get the user summary
  
  UserSummary.findById(user._id,(err,userSummaryResult) => {
    res.render('dashboard/profile',{user: user,userSummary: userSummaryResult,host: process.env.HOST});
  });
});

router.get('/dashboard/profile',indexMiddleware.isLoggedIn,(req,res) => {
  // assign user to session user and create referral link
  const user = req.user;
  user.referralLink = process.env.HOST + "/referral?refToken=" + req.user._id;
  // get the user summary
  UserSummary.findById(user._id,(err,userSummaryResult) => {
    res.render('dashboard/profile',{user: user,userSummary: userSummaryResult,host: process.env.HOST});
  });
});

router.get('/dashboard/*',(req,res) => {
  if(req.isAuthenticated()){
    res.render('dashboard/notFound',{host: process.env.HOST});
  } else {
    res.render('notFound',{host: process.env.HOST});
  }
});

module.exports = router;