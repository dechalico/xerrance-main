const mongoose = require('mongoose');

const accountReferralCode = new mongoose.Schema({
  // all referral codes bought
  referralCodes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'generatedReferralCode'
    }
  ],
  directDownlines: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'account'
    }
  ],
  // referral codes assigned in left leg
  leftCodes:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'generatedReferralCode'
    }
  ],
  // referral codes assigned in right leg
  rightCodes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'generatedReferralCode'
    }
  ],
  unAssignCodes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'generatedReferralCode'
    }
  ],
  // all used referral codes
  usedReferralCodes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'generatedReferralCode'
    }
  ],
  // all unused referral codes
  unUsedReferralCodes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'generatedReferralCode'
    }
  ],
  levels:[
    {
      level: Number,
      account:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'account'
      },
      leg: String,
      parentAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'account'
      }
    }
  ],
  referrals:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'account'
    }
  ],
  downlinesPairing:[
    {
      count: Number,
      account:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'account'
      }
    }
  ]
});

module.exports=  mongoose.model('accountReferralCode',accountReferralCode);