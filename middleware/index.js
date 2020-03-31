const passport = require('passport');
const Member = require('../models/member');

let middleWare = {
  isLoggedIn: (req,res,next) => {
    if(req.isAuthenticated()){
      console.log('no error');
      return next();
    }
    console.log('no 1');
    return res.redirect("/login");
  }
};

module.exports = middleWare;