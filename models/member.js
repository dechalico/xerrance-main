const mongoose = require('mongoose');
const localMongoose = require('passport-local-mongoose');

// referral: refer to buyCodeSuccess
// rederralCodes: referral codes bought, refer to referralCodes
// note use index in email,username,referral 
const member = new mongoose.Schema({
  firstname: String,
  lastname: String,
  address: String,
  referral: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'buyCodeSuccess'
  },
  referralCodes:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'referralCode'
  },
  email: String,
  username: String,
  password: String,
  dateCreated:{
    type: Date,
    default: Date.now
  }
});

member.plugin(localMongoose);

module.exports = mongoose.model('member',member);