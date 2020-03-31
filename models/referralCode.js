const mongoose = require('mongoose');

const referralCode = new mongoose.Schema({
  referralCodes:[
    {type: mongoose.Schema.Types.ObjectId,ref: 'buyCodeSuccess'}
  ],
  left:[String],
  right:[String]
});

module.exports = mongoose.model('referralCode',referralCode);