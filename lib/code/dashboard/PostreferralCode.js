const Account = require('../../../models/account');
const GeneratedReferralCode =require('../../../models/generatedReferralCode');
const AccountReferral = require('../../../models/accountReferralCode');
const UpdateAccountSummary = require('../updateAccountSummary');

module.exports = function(accountId,referralCode,leg,callback){
  // get the account of member login
  Account.findById(accountId,(err,account) => {
    if(!err && account){
      // check if referral code id is valid
      GeneratedReferralCode.findById(referralCode,(err,referralCode) => {
        if(!err && referralCode && !referralCode.isAssign){
          // get the referral code of account and check if referral code belongs to account
          AccountReferral.findById(account.accountReferralCodeId,(err,accountReferral) => {
            if(!err && accountReferral){
              let isFound = false;
              // Note: must change the logic for faster search
              for(let i=0; i < accountReferral.referralCodes.length; i++){
                if(String(referralCode._id) == String(accountReferral.referralCodes[i])){
                  isFound = true;
                  break;
                }
              }
              if(isFound){
                // remove referral code in unAssigned array
                // make sure that the leg is have a value of left or right
                if(leg.toLowerCase().trim() == 'right leg' || leg.toLowerCase().trim() == 'left leg'){
                  for(let i=0; i < accountReferral.unAssignCodes.length; i++){
                    if(String(accountReferral.unAssignCodes[i]) == String(referralCode._id)){
                      accountReferral.unAssignCodes.splice(i,1);
                      break;
                    }
                  }
                }
                // push the referralCode in rightCodes or leftCodes
                if(leg.toLowerCase().trim() == 'right leg'){
                  accountReferral.rightCodes.push(referralCode._id);
                } else if(leg.toLowerCase().trim() == 'left leg'){
                  accountReferral.leftCodes.push(referralCode._id);
                }
                accountReferral.save(err => {
                  if(!err){
                    callback(true);
                  } else {
                    console.log('Error when updating the referral code');
                  }
                });
                // update referral code
                referralCode.leg = leg;
                referralCode.isAssign = true;
                // update account summary
                UpdateAccountSummary(account.accountSummaryId,accountReferral);
                // save and update accountReferralCodes
                referralCode.save(err => {
                  if(err){
                    console.log('Erro when updating referral Code');
                  }
                });
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
    } else {
      callback(false);
    }
  });
}