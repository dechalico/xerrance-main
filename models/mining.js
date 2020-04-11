const mongoose = require('mongoose');

// mining history
const mining = new mongoose.Schema({
  downline: {
    type: Number,
    default: 0
  },
  rightCodes: {
    type: Number,
    default: 0
  },
  leftCodes: {
    type: Number,
    default: 0
  },
  referralCommission: {
    type: Number,
    default: 0
  },
  miningIncome: {
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

module.exports=  mongoose.model('mining',mining);