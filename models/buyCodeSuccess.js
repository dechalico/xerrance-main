const mongoose = require('mongoose');

// _id: unique id use to referral codes
// useId: id who use the referral code
// ownerId: id who own or who buy the referral code
// if no ownerId means buy without membership
const buyCodeSuccess = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'member'
  },
  email: String,
  phpPrice: Number,
  usdtPrice: Number,
  disountedPercent:Number,
  totalPHP: Number,
  totalUSDT: Number,
  addr: String,
  dateCreated:{
    type: Date,
    default: Date.now
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  dataUsed: Date,
  useId: String
});

module.exports = mongoose.model('buyCodeSuccess',buyCodeSuccess);