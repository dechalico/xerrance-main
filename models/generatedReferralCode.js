const mongoose = require('mongoose');

// all generated referral codes
const generatedReferralCode = new mongoose.Schema({
  buyId: String,
  email: String,
  // who own or who buy the referral code
  ownerAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'account'
  },
  // downline sub owner accountId
  downlineAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'account'
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  // who used the referral code
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'account'
  },
  dateUsed: Date,
  dateCreated: {
    type: Date,
    default: Date.now
  }
});

module.exports= mongoose.model('generatedReferralCode',generatedReferralCode);