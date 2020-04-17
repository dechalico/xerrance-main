const mongoose = require('mongoose');

const accountSummary = new mongoose.Schema({
  // date renew, default to current date when first account verified
  lastDateRenew: {
    type: Date,
    default: Date.now
  },
  // count of all used referral codes
  useReferralCodes: {
    type: Number,
    default: 0
  },
  // count of all unused referral codes
  unUsedReferralCodes: {
    type: Number,
    default: 0
  },
  // count of all downline same as useReferralCodes
  referralCodes: {
    type: Number,
    default: 0
  },
  // count of all direct referrals
  directReferrals: {
    type: Number,
    default: 0
  },
  // total referral commission
  referralCommission: {
    type: Number,
    default: 0
  },
  // total mining income
  miningIncome: {
    type: Number,
    default: 0
  },
  // count of referral codes in right leg
  rightCodes: {
    type: Number,
    default: 0
  },
  // count of referral codes in left leg
  leftCodes: {
    type: Number,
    default: 0
  },
  // count of referral codes use in left leg
  usedLeftCodes:{
    type: Number,
    default: 0
  },
  // count of referral codes use in right leg
  usedRightCodes:{
    type: Number,
    default: 0
  },
  // count of total pairs including pairs of downline accounts
  totalPairs: {
    type: Number,
    default: 0
  },
  // total count of left codes including downline accounts
  totalLeftCodes:{
    type: Number,
    default: 0
  },
  // total count of right codes including downline accounts
  totalRightCodes:{
    type: Number,
    default: 0
  },
  // total of pairing commission
  pairingCommission: {
    type: Number,
    default: 0
  },
  // total of network bonus
  networkBonus: {
    type: Number,
    default: 0
  },
  networkTitle:{
    type: String,
    default: 'Newbie'
  },
  // acount of return capital
  returnedCapital: {
    type: Number,
    default: 0
  },
  // total gross income
  grossIncome: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('accountSummary',accountSummary);