const mongoose = require('mongoose');

const mining = new mongoose.Schema({
  dateCreated: {
    type: Date,
    default: Date.now
  },
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
  paringCommission:{
    type: Number,
    default: 0
  },
  networkBonus: {
    type: Number,
    default: 0,
  },
  grossIncome: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('mining',mining);