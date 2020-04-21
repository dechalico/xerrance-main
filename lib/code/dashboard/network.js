const Account = require('../../../models/account');
const AccountReferralCodes = require('../../../models/accountReferralCode');
const helper = require('../../helpers');

module.exports = function(accountId,callback){
  // check if account id is valid
  const purchaseOption = {
    path: 'purchaseId',
    populate: {
      path : 'referralCodes',
      options:{
        limit: 15,
        sort: {_id:-1},
      }
    }
  }
  Account.findById(accountId).populate('accountSummaryId').populate('memberId').populate(purchaseOption).exec((err,account) => {
    if(!err && account){
      const data = {
        networkImg: '',
        totalBonus: '0.00',
        level: 'Newbie',
        pairs: '0',
        left: '0',
        right: '0',
        downline: '0',
        directReferrals: '0',
        referralCodes: '0',
        usedReferrals: '0',
        unUsedReferrals: '0',
        networkBonus: '0.00',
        pairingBonus: '0.00',
        referralBonus: '0.00',
        totalWithdrawals: '0.00',
        accountName: '',
        leftTree: [],
        rightTree: [],
        purchases: [],
        withdrawals: []
      }
      data.totalBonus = helper.formatDecimalToString(account.accountSummaryId.grossIncome - account.accountSummaryId.miningIncome);
      data.level = account.accountSummaryId.networkTitle;
      data.pairs = account.accountSummaryId.totalPairs;
      data.left = account.accountSummaryId.totalLeftCodes;
      data.right = account.accountSummaryId.totalRightCodes;
      data.networkBonus = helper.formatDecimalToString(account.accountSummaryId.networkBonus);
      data.pairingBonus = helper.formatDecimalToString(account.accountSummaryId.pairingCommission);
      data.referralBonus = helper.formatDecimalToString(account.accountSummaryId.referralCommission);
      data.accountName = account.memberId.firstname + ' ' + account.memberId.lastname;
      data.purchases = account.purchaseId.referralCodes;

      // set the network badge image
      const networkTitle = data.level.trim();
      if(networkTitle == 'Newbie')
        data.networkImg = 'dist/img/network/newbie.jpg';
      else if(networkTitle == 'Team Leader I')
        data.networkImg = 'dist/img/network/teamleader1.jpg';
      else if(networkTitle == 'Team Leader II')
        data.networkImg = 'dist/img/network/teamleader2.jpg';
      else if(networkTitle == 'Team Leader III')
        data.networkImg = 'dist/img/network/teamleader3.jpg';
      else if(networkTitle == 'Direcotr I')
        data.networkImg = 'dist/img/network/director1.jpg';
      else if(networkTitle == 'Director II')
        data.networkImg = 'dist/img/network/director2.jpg';
      else if(networkTitle == 'Director III')
        data.networkImg = 'dist/img/network/director3.jpg';
      else if(networkTitle == 'President')
        data.networkImg = 'dist/img/network/millionairesclub1.jpg';
      else if(networkTitle == 'Senior President')
        data.networkImg = 'dist/img/network/millionairesclub2.jpg';
      else if(networkTitle == 'Millionaire\'s Club')
        data.networkImg = 'dist/img/network/millionairesclub3.jpg';

      // get the accountReferralCode data to get the account tree view
      AccountReferralCodes.findById(account.accountReferralCodeId,(err,accountReferralCodes) => {
        if(!err && accountReferralCodes){
          data.downline = accountReferralCodes.levels.length;
          data.usedReferrals = accountReferralCodes.usedReferralCodes.length;
          data.unUsedReferrals = accountReferralCodes.unUsedReferralCodes.length;
          data.referralCodes = accountReferralCodes.referralCodes.length;
          data.directReferrals = accountReferralCodes.directDownlines.length;

          const leftArray = [];
          const rightArray = [];
          let leftCurParent = account._id;
          let rightCurParent = account._id;
          let level = 1;
          let isLoop = true;
          let isFound = false;
          
          // query to level data to get the tree of left and right nodes
          while(isLoop){
            isFound = false;
            const arrayLevel = accountReferralCodes.levels.filter(l => l.level == level);
            for(let i = 0; i < arrayLevel.length; i++){
              let cntFound = 0;
              if(arrayLevel[i].leg == 'left leg' && String(arrayLevel[i].parentAccount) == String(leftCurParent)){
                isFound = true;
                leftCurParent = arrayLevel[i].account;
                leftArray.push(arrayLevel[i]);
                cntFound++;
              } else if(arrayLevel[i].leg == 'right leg' && String(arrayLevel[i].parentAccount) == String(rightCurParent)){
                isFound = true;
                rightCurParent = arrayLevel[i].account;
                rightArray.push(arrayLevel[i]);
                cntFound++;
              }
              // break the for loop imediately and proceed to next level
              if(cntFound == 2){
                break;
              }
            }

            // break the loop
            if(!isFound){
              isLoop = false;
            }
            // increment the level to filter downlevel
            level++;
          }
          data.leftTree = leftArray;
          data.rightTree = rightArray;
        }
        callback(true,data);
      });
    } else {
      callback(false);
    }
  });
}