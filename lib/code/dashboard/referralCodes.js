const Account = require('../../../models/account');
const AccountReferralCodes = require('../../../models/accountReferralCode');

module.exports = function(accountId,limit,page,callback){
  // check the accountId is valid
  Account.findById(accountId,(err,account) => {
    if(!err && account){
      // options getting the accountReferralCodes data
      const options = {
        path: 'referralCodes',
        options:{
          limit: limit,
          sort: {_id:-1},
          skip: limit * (page - 1)
        },
        populate:[
          {path: 'referralCodes'},
        ]
      };
      // get and populate the miningEngine data
      AccountReferralCodes.findById(account.accountReferralCodeId).populate(options).exec((err,referralCodesData) => {
        // get and populate the miningEngine data
        // construct data pass to webpage
        const data = {
          referrals: [],
        }
        if(!err && referralCodesData){
          data.referrals = referralCodesData.referralCodes;
        }
        callback(true,data);
      });
    } else {
      callback(false);
    }
  });
}