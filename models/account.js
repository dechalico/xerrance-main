const mongoose = require('mongoose');

const account = new mongoose.Schema({
  // associated to member model
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'member'
  },
  // mining power on how many mine to multiply to percent. Ex: 1 by 26%
  miningPower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ranking'
  },
  // associated to generatedReferralCode model, referral code use in registration
  genratedReferralCodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'generatedReferralCode'
  },
  // associated to accountReferralCode model, information about all referral codes bought
  accountReferralCodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'accountReferralCode'
  },
  // associated to accountSummary model, summary of all transaction and amounts
  accountSummaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'accountSummary'
  },
  // associated to miningEngine model, where log of minesId stored
  miningEngineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'miningEngine'
  },
  // associated to purchase model, where all purchase trnsaction type stored
  purchaseId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'purchase'
  },
  dateCreated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('account',account);