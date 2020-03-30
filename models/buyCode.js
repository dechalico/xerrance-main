const mongoose = require('mongoose');

// must delete after 24 hours if not verified
// if payment succed delete the record and transfer to successfull payments
const buyCode = new mongoose.Schema({
  email: String,
  phpPrice: Number,
  usdtPrice: Number,
  disountedPercent:Number,
  totalPHP: Number,
  totalUSDT: Number,
  isValidated: {
    type: Boolean,
    default: false
  },
  dateValidated: Date
});

module.exports = mongoose.model('buyCode',buyCode);