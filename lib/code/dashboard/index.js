const Account = require('../../../models/account');
const AccountSummary = require('../../../models/accountSummary');
const helper = require('../../helpers');

module.exports = function(accountId,callback){
  // check if account id is valid
  const result = {
    accountBalance: '0.00',
    withdrawals: '0.00',
    miningIncome: '0.00',
    referralCommission: '0.00',
    pairingCommision: '0.00',
    networkBonus: '0.00',
    networkTitle: 'Newbie',
    totalPairs: '0',
    left: '0',
    right: '0',
    downlines: '0',
    referralCodes: '0',
    usedReferralCodes: '0',
    unUsedReferralCodes: '0',
    daysLeft: '0',
    daysConsume: '0'
  };
  Account.findById(accountId,(err,account) => {
    if(!err && account){
      // if account id is valid, then get the accountSummary data
      AccountSummary.findById(account.accountSummaryId,(err,summary) => {
        if(!err && summary){
          const currentDate = new Date();
          const dateRenew = new Date(summary.lastDateRenew);
          const dateLast = new Date();

          dateLast.setDate(dateRenew.getDate() + 124);
          result.daysLeft = Math.ceil(Math.abs(currentDate - dateLast) / (1000*60*60*24));
          result.daysConsume = Math.ceil(Math.abs(dateRenew - currentDate) / (1000*60*60*24));

          result.accountBalance = helper.formatDecimalToString(summary.grossIncome);
          result.miningIncome = helper.formatDecimalToString(summary.miningIncome);
          result.referralCommission = helper.formatDecimalToString(summary.referralCommission);
          result.pairingCommision = helper.formatDecimalToString(summary.pairingCommission);
          result.networkBonus = helper.formatDecimalToString(summary.networkBonus);
          result.networkTitle = summary.networkTitle;
          result.totalPairs = helper.formatDecimalToString(summary.totalPairs);
          result.left = summary.totalLeftCodes;
          result.right = summary.totalRightCodes;
          result.referralCodes = summary.referralCodes;
          result.usedReferralCodes = summary.useReferralCodes;
          result.unUsedReferralCodes = summary.unUsedReferralCodes;
        }
        callback(true,result);
      });
    } else {
      callback(false);
    }
  });
};