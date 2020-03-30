const mongoose = require('mongoose');

// useId: id who use the referral code
const buyCodeSuccess = new mongoose.Schema({
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