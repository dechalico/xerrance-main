const passport = require('passport');
const Member = require('../models/member');

let middleWare = {
  isLoggedIn: (req,res,next) => {
    if(req.isAuthenticated()){
      return next();
    }
    return res.redirect("/login");
  }
};

module.exports = middleWare;