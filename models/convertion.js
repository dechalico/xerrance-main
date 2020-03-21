const mongoose = require('mongoose');

const convertion = new mongoose.Schema({
  usd: Number,
  php: Number,
  dateUpdated: Date
});

module.exports = mongoose.model('convertion',convertion);