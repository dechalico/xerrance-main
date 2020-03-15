// declare dependencies
const express = require('express');
const indexMiddleware = require('../middleware/index');

const router = express.Router();

router.get('/dashboard',indexMiddleware.isLoggedIn,(req,res) => {
  res.render('dashboard/index',{user: req.user});
});

module.exports = router;