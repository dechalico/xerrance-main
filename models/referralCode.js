const mongoose = require('mongoose');

const referralCode = new mongoose.Schema({
  referralCodes:[
    {type: mongoose.Schema.Types.ObjectId,ref: 'buyCodeSuccess'}
  ],
  left:[String],
  right:[String],
  usedReferralCodes:[
    {type: mongoose.Schema.Types.ObjectId,ref: 'buyCodeSuccess'}
  ],
  unUsedReferralCodes: [
    {type: mongoose.Schema.Types.ObjectId,ref: 'buyCodeSuccess'}
  ]
});

module.exports = mongoose.model('referralCode',referralCode);