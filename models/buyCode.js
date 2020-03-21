const mongoose = require('mongoose');

const buyCode = new mongoose.Schema({
  email: String,
  quantity: Number,
  phpPrice: Number,
  usdtPrice: Number,
  totalPHP: Number,
  totalUSDT: Number
});

module.exports = mongoose.model('buyCode',buyCode);