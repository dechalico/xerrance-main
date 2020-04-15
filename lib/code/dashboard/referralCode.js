const Account = require('../../../models/account');
const helper = require('../../helpers');
const GeneratedReferralCode = require('../../../models/generatedReferralCode');

module.exports = function(accountId,referralCodeId,callback){
  // check if account is valid
  Account.findById(accountId,(err,account) => {
    if(!err && account){
      // check if referralCodeIs is valid
      GeneratedReferralCode.findById(referralCodeId,(err,referralCode) => {
        if(!err && referralCode && referralCode.ownerAccountId){
          // check if the owner of referral code is refers to account
          if(String(referralCode.ownerAccountId) == String(account._id)){
            const data = {
              id: referralCode._id,
              dateCreated: helper.fomatDate(new Date(referralCode.dateCreated)),
              isUsed : referralCode.isUsed,
              downlinerAccountId: null,
              downlinerAccountName: null,
              usedAccountId: null,
              usedAccountName: null,
              isPending: referralCode.leg ? false : true,
              status: referralCode.leg
            }
            // get the downliner account of the referral code and the account who used the referral code
            if(referralCode.isUsed){
              // get the account who use the referral code
              Account.findById(referralCode.usedBy).populate('memberId').exec((err,accountUsedBy) => {
                if(!err && accountUsedBy){
                  data.usedAccountId = accountUsedBy._id;
                  data.usedAccountName = accountUsedBy.memberId.firstname + " " + accountUsedBy.memberId.lastname;
                }
                // get the downliner account of the referral code
                Account.findById(referralCode.downlineAccountId).populate('memberId').exec((err,accountDownlineBy) => {
                  if(!err && accountDownlineBy){
                    data.usedAccountId = accountDownlineBy._id;
                    data.usedAccountName = accountDownlineBy.memberId.firstname + " " + accountDownlineBy.memberId.lastname;
                  }
                  callback(true,data);
                });
              });
            } else {
              callback(true,data);
            }
          } else {
            callback(false);
          }
        } else {
          callback(false);
        }
      });
    } else {
      callback(false);
    }
  });
}