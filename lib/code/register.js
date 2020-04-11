const Member = require('../../models/member');
const helper = require('../helpers');
const GeneratedReferralCode = require('../../models/generatedReferralCode');

module.exports = function(req,res){
  let isValid = true;
  // get the body payload fields
  const message = {
    firstname: {
      value: req.body.firstname || '',
    },
    lastname: {
      value: req.body.lastname || '',
    },
    address: {
      value: req.body.address || '',
    },
    referral: {
      value: req.body.referral || '',
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
  if(message.referral.value.length <= 0){
    message.referral.error = "Please provide valid referral code";
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
  // if all fields are valid
  if(isValid) {
    // check and validate referral code
    checkReferralCode(res,message);
  } else {
    // error if some fields are invalid
    res.render('register',{message: message,host: process.env.HOST});
  }
};

// check referral code if valid or existed
function checkReferralCode(res,message) {
  // check if referral code is existed in database
  GeneratedReferralCode.findById(message.referral.value,(err,generatedResult) => {
    // check if referral code is valid and not in used
    if(!err && generatedResult && !generatedResult.isUsed){
      // no error, rererral code is valid
      // construct data of member field to save to database
      const newMember = {
        firstname: message.firstname.value,
        lastname: message.lastname.value,
        address: message.address.value,
        email: message.email.value,
        username: message.email.value,
        genratedReferralCodeId: message.referral.value
      };
      // temporary register the new member
      register(res,message,newMember);
    } else {
      // if referral code in invalid or not found in database
      message.referral.error = 'Please provide valid referral code';
      res.render('register',{message: message,host: process.env.HOST});
    }
  });
};

// temporary register the member for verfication
function register(res,message,newMember) {
  // try to register member to database
  Member.register(newMember,message.password.value,(err,memberResult) => {
    if(!err){
      // member registration successfull
      // construct an url to send email message to member to verified the account
      const url = process.env.HOST + "/membership/verification?id=" + memberResult._id + "&token=" + message.referral.value;
      helper.sendMail(message.email.value,"Account Verification",
        "Thank you for registering with us, Please visit this link to validate your account " + url,(err) => {
          res.redirect('/login');
        });
    } else {
      if(err.name === 'UserExistsError'){
        // if email already existed
        message.email.error = "Specified email address already registered";
        res.render('register',{message: message,host: process.env.HOST});
      } else{
        // other error
        console.log(err);
        message.email.error = "Some Internal Error Happens";
        res.render('register',{message: message,host: process.env.HOST});
      }
    }
  });
};
