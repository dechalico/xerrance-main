const mongoose = require('mongoose');

const pricePointReference = new mongoose.Schema({
  capitalFee: Number,
  registrationFee: Number,
  referralPoint: Number,
  pairingPoint: Number,
  miningPercent: Number,
  dateCreated: {
    type: Number,
    default: Date.now
  }
});

module.exports = mongoose.model('pricePointReference',pricePointReference);