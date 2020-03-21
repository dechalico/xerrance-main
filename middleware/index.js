const passport = require('passport');
const User = require('../models/users');

let middleWare = {
  isLoggedIn: (req,res,next) => {
    if(req.isAuthenticated()){
      if(req.user){
        User.findById(req.user._id,(err,userData) => {
          if(!err && userData){
            if(!userData.isValidated){
              return res.redirect("/login");
            }
          } else {
            return res.redirect("/login");
          }
        });
      }
      return next();
    }
    return res.redirect("/login");
  }
};

module.exports = middleWare;