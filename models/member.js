const mongoose = require('mongoose');
const localMongoose = require('passport-local-mongoose');

const member = new mongoose.Schema({
  firstname: String,
  lastname: String,
  address: String,
  referral: String,
  email: String,
  username: String,
  password: String,
  isValidated: {
    type: String,
    default: false
  },
  summaries: {
    totalTransactions: {
      type: Number,
      default: 0
    },
    totalReferrals: {
      type: Number,
      default: 0
    },
    totalBTC: {
      type: Number,
      default: 0
    }
  },
  referralTokens:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'referralToken'
    }
  ],
  dateCreated:{
    type: Date,
    default: Date.now
  }
});

member.plugin(localMongoose);

module.exports = mongoose.model('member',member);