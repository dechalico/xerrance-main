const mongoose = require('mongoose');

// if buy not in account
const buyCodeInWeb = new mongoose.Schema({
  email: String,
  usdPrice: Number,
  discountPercent: Number,
  totalUsdPrice: Number,
  isEmailConfirmed: Boolean,
  dateEmailConfirmed: Date,
  dateCreated: {
    type: Date,
    default : Date.now
  }
});

module.exports = mongoose.model('buyCodeInWeb',buyCodeInWeb);