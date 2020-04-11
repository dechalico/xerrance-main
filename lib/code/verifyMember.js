// models declaration
const GeneratedReferralCode = require('../../models/generatedReferralCode');
const Member = require('../../models/member');
const MiningEngine = require('../../models/miningEngine');
const AccountReferralCode = require('../../models/accountReferralCode');
const AccountSummary = require('../../models/accountSummary');
const Account = require('../../models/account');

const downlineLimit = 2;

module.exports = function(res,id,token){
  // check if member id is valid
  respond = res;
  Member.findById(id,(err,memberResult) => {
    if(!err && memberResult) {
      // member id is valid, then check if token or referral id is valid and not in use
      checkReferralCode(token,memberResult,res);
    } else {
      // membership id is invalid or not existed in database
      res.redirect('/register');
    }
  });
};

// check if specified referral code is valid
function checkReferralCode(token,member,res){
  GeneratedReferralCode.findById(token,(err,generatedResult) => {
    if(!err && generatedResult && !generatedResult.isUsed){
      // if referral code is valid and not in used then check what type of referral code. 
      // check if referral code is buy in member account or buy in web without account
      if(generatedResult.ownerAccountId){
        // if their is owner account ID then the referral code is buy in member account
        buyInMemberAccount(member,generatedResult,res);
      } else {
        // else the referral code is buy directly in web without account
        buyInDirectlyInWeb(member,generatedResult,res);
      }
    } else {
      // token or referral code is invalid or used.
      res.redirect("/register");
    }
  });
};

// referral code buy in member account
function buyInMemberAccount(member,referralCode,res){
  Account.findById(referralCode.ownerAccountId,(err,ownerAccount) => {
    if(!err && ownerAccount){
      // owner account id exist then get the netreferral to assign in new account member
      createAccount(member,ownerAccount,referralCode);
    } else {
      // if ownerid account does not exist
      res.redirect("/register");
    }
  });
};

// referral code buy directly in web without membership
async function buyInDirectlyInWeb(member,referralCode,res){
  try{
    createDefaulAccount(member,referralCode).then(newAccount => {
      // updating the member fields
      member.accountId = newAccount._id;
      member.genratedReferralCodeId = referralCode._id;
      member.isEmailVerified = true;
      member.save(err => {
        if(err){
          console.log('Error when updating the member profile');
        }
      });

      // updating the referral code
      referralCode.usedBy = newAccount._id;
      referralCode.dateUsed = Date.now();
      referralCode.downlineAccountId = newAccount;
      referralCode.isUsed = true;
      referralCode.save(err => {
        if(err){
          console.log('Error when updating referral code');
        }
      });
      console.log('New account created successfully');
      res.redirect('/login');
    });
  } catch(err){
    console.log(err);
  }
}

async function createAccount(member,ownerAccount,referralCode){
  try{
    // create default account fields to assign in new account
    const accountReferral = await AccountReferralCode.create({});
    const accountSummary = await AccountSummary.create({});
    const accountMining = await MiningEngine.create({mining: []});
    
    const newAccountData = {
      memberId: member._id,
      genratedReferralCodeId: referralCode._id,
      accountReferralCodeId: accountReferral._id,
      accountSummaryId: accountSummary._id,
      miningEngineId: accountMining._id,
    }
    // create new account
    Account.create(newAccountData,(err,newAccount) => {
      if(!err && newAccount){
        // update member and assign accountId to new account created
        member.accountId = newAccount._id;
        member.save(err => {
          if(err){
            console.log(err);
          }
        });
        // check if the referralOwner account can accomodate more downlines
        // const ownerReferralCodes = await AccountReferralCode.findById(ownerAccount.accountReferralCodeId);
        // if(ownerReferralCodes){
        //   // check if the owner of referral code can accomodate more downlines
        //   if(ownerReferralCodes.directDownlines.length < downlineLimit){
        //     // the owner can accomodate direct downline
        //     // assign downline account in referral code, then save and update;
        //     referralCode.downlineAccountId = ownerAccount._id;
        //     referralCode.isUsed = true;
        //     referralCode.usedBy = newAccount._id;
        //     referralCode.dateUsed = Date.now();
        //     referralCode.save(err => {
        //       if(err){
        //         console.log('referral code failed to update');
        //       }
        //     });
        //     // accomodate downline account
        //     accomodateDownline(ownerAccount,ownerReferralCodes,newAccount);
        //   } else {
        //     // the owner cannot accomodate more downline,
        //     cannotAccomodateDownline(ownerReferralCodes,newAccount,referralCode);
        //   }
        // } else {
        //   // no accountReferrals of ownerAccount
        //   console.log('No referral account of the owner found');
        // }
      } else {
        console.log('Error when creating the new account');
      }
    });
  } catch(err){
    console.log(err);
  }
};

// owner of referral code can accomodate more downline
function accomodateDownline(ownerAccount,ownerReferralCodes,newAccount){
  // save and update direct downlines of the owner
  ownerReferralCodes.directDownlines.push(newAccount._id);
  ownerReferralCodes.save(err => {
    console.log('Error when updating the direct downlines of the owner');
  });

  console.log('Can accommodate more downlines');
}

async function cannotAccomodateDownline(ownerReferralCodes,newAccount,referralCode){
  // find the downlinerId where to assgin
  console.log('Cannot accommodate more downlines');
}

async function createDefaulAccount(member,referralCode){
  try{
    // create default account fields to assign in new account
    const accountReferral = await AccountReferralCode.create({
      referralCodes: [],
      directDownlines: [],
      leftCodes: [],
      rightCodes: [],
      usedReferralCodes: [],
      unUsedReferralCodes: [],
      levels: [],
      referrals: []
    });
    const accountSummary = await AccountSummary.create({});
    const accountMining = await MiningEngine.create({mining: []});
    
    const newAccountData = {
      memberId: member._id,
      genratedReferralCodeId: referralCode._id,
      accountReferralCodeId: accountReferral._id,
      accountSummaryId: accountSummary._id,
      miningEngineId: accountMining._id,
    }

    return await Account.create(newAccountData);
  } catch(err){
    console.log(err);
    return null;
  }
}
