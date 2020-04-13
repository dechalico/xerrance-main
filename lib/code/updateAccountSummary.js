const AccountSummary = require('../../models/accountSummary');
module.exports = function(accountSummaryId,accountReferralCodes){
  AccountSummary.findById(accountSummaryId,(err,summary) => {
    if(!err && summary){
      summary.useReferralCodes = accountReferralCodes.usedReferralCodes.length;
      summary.unUsedReferralCodes = accountReferralCodes.unUsedReferralCodes.length;
      summary.referralCodes = accountReferralCodes.referralCodes.length;
      summary.rightCodes = accountReferralCodes.rightCodes.length;
      summary.leftCodes = accountReferralCodes.leftCodes.length;
      summary.totalPairs = accountReferralCodes.rightCodes.length > accountReferralCodes.leftCodes.length ? 
        accountReferralCodes.leftCodes.length : accountReferralCodes.rightCodes.length;
      
        summary.save(err => {
        if(err){
          console.log('Error when updating account summary');
        }
      });
    }
  });
};