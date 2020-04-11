const mongoose = require('mongoose');

const accountSummary = new mongoose.Schema({
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
  // count of total pairs including pairs of downline accounts
  totalPairs: {
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
  // total gross income
  grossIncome: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('accountSummary',accountSummary);