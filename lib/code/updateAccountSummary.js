const AccountSummary = require('../../models/accountSummary');
const AccountReferralCodes = require('../../models/accountReferralCode');

const directReferralLimit = 2;

module.exports = function(account,updateType,callback){
  // find and update account summary
  AccountSummary.findById(account.accountSummaryId,(err,summary) => {
    if(!err && summary){

      // find accountReferralCode
      AccountReferralCodes.findById(account.accountReferralCodeId).populate('usedReferralCodes').exec((err,accountReferralCodes) => {
        if(!err && accountReferralCodes){
          // update fields of account summary
          summary.useReferralCodes = accountReferralCodes.usedReferralCodes.length;
          summary.unUsedReferralCodes = accountReferralCodes.unUsedReferralCodes.length;
          summary.referralCodes = accountReferralCodes.referralCodes.length;
          summary.directReferrals = accountReferralCodes.directDownlines.length;
          summary.rightCodes = accountReferralCodes.rightCodes.length;
          summary.leftCodes = accountReferralCodes.leftCodes.length;

          // temporary variable
          const prevPairs = summary.usedLeftCodes > summary.usedRightCodes ? summary.usedRightCodes : summary.usedLeftCodes;
          const prevTitle = summary.networkTitle;

          // count all used left codes
          let leftCnt = 0;
          let rightCnt = 0;
          for(let i = 0; i < accountReferralCodes.usedReferralCodes.length; i++){
            if(accountReferralCodes.usedReferralCodes[i].leg.trim().toLowerCase() == 'left leg')
            leftCnt++;
          }
          // count all used right codes
          for(let i = 0; i < accountReferralCodes.usedReferralCodes.length; i++){
            if(accountReferralCodes.usedReferralCodes[i].leg.trim().toLowerCase() == 'right leg')
            rightCnt++;
          }

          summary.usedLeftCodes = leftCnt;
          summary.usedRightCodes = rightCnt;
          summary.totalPairs = leftCnt > rightCnt ? rightCnt : leftCnt;

          // count all total left codes,right codes, and pairing including all downlines
          summary.totalLeftCodes = leftCnt;
          summary.totalRightCodes = rightCnt;
          for(let i=0; i < accountReferralCodes.downlinesLeg.length; i++){
            summary.totalLeftCodes += accountReferralCodes.downlinesLeg[i].left;
            summary.totalRightCodes += accountReferralCodes.downlinesLeg[i].right;
            summary.totalPairs += accountReferralCodes.downlinesLeg[i].pairCount;
          }

          //update network title
          if(summary.totalPairs < 50)
            summary.networkTitle = 'Newbie';
          else if (summary.totalPairs < 150)
            summary.networkTitle = 'Team Leader I';
          else if (summary.totalPairs < 300)
            summary.networkTitle = 'Team Leader II';
          else if (summary.totalPairs < 500)
            summary.networkTitle = 'Team Leader III';
          else if(summary.totalPairs < 750)
            summary.networkTitle = 'Direcotr I';
          else if(summary.totalPairs < 1250)
            summary.networkTitle = 'Director II';
          else if(summary.totalPairs < 1400)
            summary.networkTitle = 'Director III';
          else if(summary.totalPairs < 1600)
            summary.networkTitle = 'President';
          else if(summary.totalPairs < 2000)
            summary.networkTitle = 'Senior President';
          else
            summary.networkTitle = 'Millionaire\'s Club';
          
          // determine update type
          const type = typeof(updateType) == 'number' ? updateType : 0;
          // legend: 1=update referral commission,pairingCommission
          // legend: 2=update only networktitle and network bonus
          if(type === 1){
            if(summary.directReferrals <= directReferralLimit){
              // add referral commission ($4.86)
              summary.referralCommission += 4.86;
              // add pairing commission ($5.38)
              if(prevPairs < (leftCnt > rightCnt ? rightCnt : leftCnt)){
                summary.pairingCommission += 5.38;
              }
            } else {
              // add referral commission ($2)
              summary.referralCommission += 2;
              // add pairing commission ($0.98)
              if(prevPairs < (leftCnt > rightCnt ? rightCnt : leftCnt)){
                summary.pairingCommission += 0.98;
              }
            }
            // check if title is change, if change then change network bonus
            if(summary.networkTitle == 'Newbie')
              summary.networkBonus = 0;
            else if (summary.networkTitle == 'Team Leader I')
              summary.networkBonus = 194.40;
            else if (summary.networkTitle == 'Team Leader II')
              summary.networkBonus = 388.80;
            else if(summary.networkTitle == 'Team Leader III')
              summary.networkBonus = 1360.80;
            else if (summary.networkTitle == 'Direcotr I')
              summary.networkBonus = 1701;
            else if (summary.networkTitle == 'Director II')
              summary.networkBonus == 3159;
            else if (summary.networkTitle == 'Director III')
              summary.networkBonus = 4860;
            else if(summary.networkTitle == 'President')
              summary.networkBonus = 3402;
            else if(summary.networkTitle == 'Senior President')
              summary.networkBonus = 6318;
            else if(summary.networkTitle == 'Millionaire\'s Club')
              summary.networkBonus = 9720;
          } else if(type == 2){
            // check if title is change, if change then change network bonus
            if(summary.networkTitle == 'Newbie')
              summary.networkBonus = 0;
            else if (summary.networkTitle == 'Team Leader I')
              summary.networkBonus = 194.40;
            else if (summary.networkTitle == 'Team Leader II')
              summary.networkBonus = 388.80;
            else if(summary.networkTitle == 'Team Leader III')
              summary.networkBonus = 1360.80;
            else if (summary.networkTitle == 'Direcotr I')
              summary.networkBonus = 1701;
            else if (summary.networkTitle == 'Director II')
              summary.networkBonus == 3159;
            else if (summary.networkTitle == 'Director III')
              summary.networkBonus = 4860;
            else if(summary.networkTitle == 'President')
              summary.networkBonus = 3402;
            else if(summary.networkTitle == 'Senior President')
              summary.networkBonus = 6318;
            else if(summary.networkTitle == 'Millionaire\'s Club')
              summary.networkBonus = 9720;
          }
          
          summary.grossIncome = summary.referralCommission + summary.miningIncome + summary.pairingCommission + summary.networkBonus + summary.networkBonus;

          summary.save(err => {
            if(callback){
              callback();
            }
            
            if(err){
              console.log('Error when updating account summary');
            }
          });
        }
      });
    }
  });
};