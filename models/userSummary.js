const mongoose = require('mongoose');

const userSummary = new mongoose.Schema({
  //_id=userId not auto generated, manually inserted
  totalTransactions: {
    type: Number,
    default: 0
  },
  totalReferralPoints: {
    type: Number,
    default: 0
  },
  totalReferrals: {
    type: Number,
    default: 0
  },
  totalPoints: {
    type: Number,
    default:  0.00000000
  },
  dateCreated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('userSummary',userSummary);