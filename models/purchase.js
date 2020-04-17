const mongoose = require('mongoose');

const purchase = new mongoose.Schema({
  referralCodes:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'buyCodeInAccount'
    }
  ]
});

module.exports = mongoose.model('purchase',purchase);