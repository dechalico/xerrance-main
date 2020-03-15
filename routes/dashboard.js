// declare dependencies
const express = require('express');
const indexMiddleware = require('../middleware/index');

const router = express.Router();

router.get('/dashboard',indexMiddleware.isLoggedIn,(req,res) => {
  res.render('dashboard/index',{user: req.user,host: process.env.HOST});
});

router.get('/dashboard/profile',indexMiddleware.isLoggedIn,(req,res) => {
  res.render('dashboard/profile',{user: req.user,host: process.env.HOST});
});

module.exports = router;