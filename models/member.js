const mongoose = require('mongoose');
const localMongoose = require('passport-local-mongoose');

const member =  new mongoose.Schema({
  firstname: String,
  lastname: String,
  address: String,
  email: String,
  username: String,
  password: String,
  isEmailVerified: Boolean,
  // member's account id
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'account'
  },
  genratedReferralCodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'generatedReferralCode'
  },
  dateCreated: {
    type: Date,
    default: Date.now
  }
});

member.plugin(localMongoose);

module.exports = mongoose.model('member',member);
