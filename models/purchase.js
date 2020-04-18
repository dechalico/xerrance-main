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
      isValidated: {
        type: Boolean,
        default: false
      },
      isPaymentSuccess: {
        type: Boolean,
        default: false
      },
      datePayed: Date
    }
  ]
});

module.exports = mongoose.model('purchase',purchase);