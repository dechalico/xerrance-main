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
      AccountReferralCodes.findById(account.accountReferralCodeId).populate(options).populate('directDownlines').exec((err,referralCodesData) => {
        // get and populate the miningEngine data
        // construct data pass to webpage
        const data = {
          referrals: [],
        }
        if(!err && referralCodesData){
          data.referrals = referralCodesData.referralCodes;
          for(let i=0; i < referralCodesData.directDownlines.length; i++){
            const codeId = String(referralCodesData.directDownlines[i].genratedReferralCodeId);
            for(let x = 0; x < data.referrals.length; x++){
              if(codeId == String(data.referrals[x]._id)){
                data.referrals[x].isDirectReferral = true;
                break;
              }
            }
          }
        }
        callback(true,data);
      });
    } else {
      callback(false);
    }
  });
}