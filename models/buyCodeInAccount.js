const mongoose = require('mongoose');

const buyCodeInAccount = new mongoose.Schema({
  // account id who buy the code
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'account'
  },
  quantity: Number,
  usdPrice: Number,
  discountPercent: Number,
  totalUsdPrice: Number,
  isPaymentSuccess: {
    type: Boolean,
    default: false
  },
  paymentDateSuccess: Date,
  transactionAddress: String,
  dateCreated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('buyCodeInAccount',buyCodeInAccount);