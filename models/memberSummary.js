const mongoose =require('mongoose');

const memberSummary = new mongoose.Schema({
  downline: {
    type: Number,
    default: 0
  },
  referralCommission:{
    type: Number,
    default: 0
  },
  miningIncome: {
    type: Number,
    default: 0
  },
  rightLeg:{
    type: Number,
    default: 0
  },
  leftLeg:{
    type: Number,
    default: 0
  },
  pairingCommission: {
    type: Number,
    default: 0
  },
  networkBonus: {
    type: Number,
    default: 0
  },
  grossIncome: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('memberSummary',memberSummary);