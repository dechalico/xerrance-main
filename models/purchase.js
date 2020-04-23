const mongoose = require('mongoose');

const purchase = new mongoose.Schema({
  referralCodes:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'buyCodeInAccount'
    }
  ],
  upgradeRank: [
    {
      account: String,
      rankId: String,
      price: Number,
      rankName: String,
      dateOrder: Date,
      isPaymentSuccess: {
        type: Boolean,
        default: false
      },
      addr: String,
      datePayed: Date
    }
  ]
});

module.exports = mongoose.model('purchase',purchase);