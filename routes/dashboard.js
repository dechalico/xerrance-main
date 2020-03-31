// declare dependencies
const express = require('express');
const indexMiddleware = require('../middleware/index');
const UserSummary = require('../models/userSummary');

const router = express.Router();

router.get('/dashboard',indexMiddleware.isLoggedIn,(req,res) => {
  // assign user to session user and create referral link
  const user = req.user;
  res.render('dashboard/profile',{user: user,host: process.env.HOST,type: 'member'});
});

router.get('/dashboard/profile',indexMiddleware.isLoggedIn,(req,res) => {
  // assign user to session user and create referral link
  const user = req.user;
  res.render('dashboard/profile',{user: user,host: process.env.HOST,type: 'member'});
});

router.get('/dashboard/setting',indexMiddleware.isLoggedIn,(req,res) => {
  // assign user to session user and create referral link
  const user = req.user;
  res.render('dashboard/siteSetting',{user: user,host: process.env.HOST,type: 'member'});
});

module.exports = router;