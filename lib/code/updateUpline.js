const AccountSummary = require('../../models/accountSummary');
const AccountReferralCodes = require('../../models/accountReferralCode');
const UpdateAccountSummary = require('../code/updateAccountSummary');

module.exports = function(account){
  // find upline referral accounts
  AccountReferralCodes.findById(account.accountReferralCodeId).populate('referrals').exec((err,accountReferralCodes) => {
    if(!err && accountReferralCodes){
      AccountSummary.findById(account.accountSummaryId,(err,accountSummary) => {
        if(!err && accountSummary){
          const data = {
            pairCount: accountSummary.usedLeftCodes > accountSummary.usedRightCodes ? accountSummary.usedRightCodes : accountSummary.usedLeftCodes,
            left: accountSummary.usedLeftCodes,
            right: accountSummary.usedRightCodes,
            account: account._id
          };
          for(let i = 0; i < accountReferralCodes.referrals.length; i++){
            // update upline accounts
            update(accountReferralCodes.referrals[i],data);
          }
        }
      });
    }
  });
}

// update the accountReferralCode and accountSummary of the upline account
function update(account,downsLegData){
  AccountReferralCodes.findById(account.accountReferralCodeId,(err, accountReferral) => {
    if(!err && accountReferral){
      let isFound = false;
      for(let i = 0; i < accountReferral.downlinesLeg.length; i++){
        if(String(accountReferral.downlinesLeg[i].account) == String(downsLegData.account)){
          isFound = true;
          accountReferral.downlinesLeg[i].pairCount = downsLegData.pairCount;
          accountReferral.downlinesLeg[i].left = downsLegData.left;
          accountReferral.downlinesLeg[i].right = downsLegData.right;
          break;
        }
      }

      if(!isFound){
        accountReferral.downlinesLeg.push(downsLegData);
      }

      // save and update account referral
      accountReferral.save(err => {
        // update account summary data
        UpdateAccountSummary(account,2);
        if(err){
          console.log('error when updating account referral data');
        }
      });
    }
  });
}