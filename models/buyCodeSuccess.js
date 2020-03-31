const mongoose = require('mongoose');

// _id: unique id use to referral codes
// useId: id who use the referral code
// ownerId: id who own or who buy the referral code
// if no ownerId means buy without membership
const buyCodeSuccess = new mongoose.Schema({
  ownerId: String,
  email: String,
  phpPrice: Number,
  usdtPrice: Number,
  disountedPercent:Number,
  totalPHP: Number,
  totalUSDT: Number,
  addr: String,
  isUsed: {
    type: Boolean,
    default: false
  },
  dataUsed: Date,
  useId: String
});

module.exports = mongoose.model('buyCodeSuccess',buyCodeSuccess);