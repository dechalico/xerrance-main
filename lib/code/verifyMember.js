// models declaration
const GeneratedReferralCode = require('../../models/generatedReferralCode');
const Member = require('../../models/member');
const MiningEngine = require('../../models/miningEngine');
const AccountReferralCode = require('../../models/accountReferralCode');
const AccountSummary = require('../../models/accountSummary');
const Account = require('../../models/account');
const Ranking = require('../../models/ranking');
const UpdateAccountSummary = require('./updateAccountSummary');

const downlineLimit = 2;

module.exports = function(res,id,token){
  // check if member id is valid
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
      // if referral code is valid and not in used then check what type of referral code is. 
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
  // check if the owner of referralCode is existed
  Account.findById(referralCode.ownerAccountId,(err,ownerAccount) => {
    if(!err && ownerAccount){
      // owner account id exist then get the account ReferralCodes and create new account
      createAccount(member,ownerAccount,referralCode,res);
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
      // update membership
      updateMembership(member,newAccount._id);
      // updating the referral code used in registration
      updateReferralCodeUsed(referralCode,newAccount._id,newAccount._id);
      console.log('New account created successfully');
      res.redirect('/login');
    });
  } catch(err){
    console.log(err);
  }
}

async function createAccount(member,ownerAccount,referralCode,res){
  try{
    // create new account
    createDefaulAccount(member,referralCode).then(async (newAccount) => {
      // update memberhip
      updateMembership(member,newAccount._id);
      //check if the referralOwner account can accomodate more downlines
      const ownerAccountReferralCodes = await AccountReferralCode.findById(ownerAccount.accountReferralCodeId);
      if(ownerAccountReferralCodes){
        // check if the owner of referral code can accomodate more downlines
        if(ownerAccountReferralCodes.directDownlines.length < downlineLimit){
          // the owner can accomodate more direct downline
          // accomodate downline account
          updateReferralCodeUsed(referralCode,ownerAccount._id,newAccount._id);
          accomodateDownline(ownerAccount,ownerAccountReferralCodes,newAccount,referralCode,res);
        } else {
          // save and update accountReferrals of the owner of referral code
          ownerAccountReferralCodes.usedReferralCodes.push(referralCode._id);
          for(let i=0; i < ownerAccountReferralCodes.unUsedReferralCodes.length; i++){
            if(String(referralCode._id) == String(ownerAccountReferralCodes.unUsedReferralCodes[i])){
              ownerAccountReferralCodes.unUsedReferralCodes.splice(i,1);
              break;
            }
          }
          ownerAccountReferralCodes.save(err => {
            if(err){
              console.log('Error when updating the direct downlines of the owner');
            }
          });
          // update accountSummary of the owner of referralCode
          UpdateAccountSummary(ownerAccount.accountSummaryId,ownerAccountReferralCodes);
          // the owner cannot accomodate more downline,
          cannotAccomodateDownline(ownerAccountReferralCodes,newAccount,referralCode,res);
        }
      } else {
        // no accountReferrals of ownerAccount
        console.log('No referral account of the owner found');
      }
    });
  } catch(err){
    console.log(err);
  }
};

// update and save referralCode status
function updateReferralCodeUsed(referralCode,downlinerAccountId,newAccountId){
  // assign downliner account in referral code, then save and update referralCode;
  referralCode.downlineAccountId = downlinerAccountId;
  referralCode.isUsed = true;
  referralCode.usedBy = newAccountId;
  referralCode.dateUsed = Date.now();
  referralCode.save(err => {
    if(err){
      console.log('referral code failed to update');
    }
  });
}

// update and save membership of account
function updateMembership(member,newAccountId){
  member.accountId = newAccountId;
  member.isEmailVerified = true;
  member.save(err => {
    if(err){
      console.log('Error when updating the member profile');
    }
  });
}

// owner of referral code can accomodate more downline
function accomodateDownline(ownerAccount,ownerReferralCodes,newAccount,referralCode,res){
  // save and update direct downlines and accountReferralCodes of the the owner of referraCode
  ownerReferralCodes.directDownlines.push(newAccount._id);
  ownerReferralCodes.usedReferralCodes.push(referralCode._id);
  for(let i=0; i < ownerReferralCodes.unUsedReferralCodes.length; i++){
    if(String(referralCode._id) == String(ownerReferralCodes.unUsedReferralCodes[i])){
      ownerReferralCodes.unUsedReferralCodes.splice(i,1);
      break;
    }
  }
  // update the accountSummary of the owner of referralCode
  UpdateAccountSummary(ownerAccount.accountSummaryId,ownerReferralCodes);
  ownerReferralCodes.save(err => {
    if(err){
      console.log('Error when updating the direct downlines of the owner');
    }
  });

  // update and save new account referrals
  newAccountDownLevel(ownerAccount,ownerReferralCodes,newAccount,referralCode,res);
}

function newAccountDownLevel(downlinerAccount,downlinerAccountReferralCodes,newAccount,referralCode,res){
  // determine which downlevel the newAccount belongs
  let level = 1;
  let leg = referralCode.leg.toLowerCase().trim();
  let isLoop = true;
  let isFoundParentAccount = false;
  let parentAccount = downlinerAccount._id;

  // loop through down levels
  while(isLoop){
    // filter the levels by level
    const arrayLevel = downlinerAccountReferralCodes.levels.filter(l => l.level == level && l.leg.trim().toLowerCase() == leg);
    isFoundParentAccount = false;

    // get the parent account
    for(let i=0; i < arrayLevel.length; i++){
      if(String(arrayLevel[i].parentAccount) == String(parentAccount)){
        isFoundParentAccount = true;
        parentAccount = arrayLevel[i].account;
      }
    }

    if(!isFoundParentAccount){
      isLoop = false;
    }
    level++;
  }
  
  // get the accountReferral of the parentAccount Found
  Account.findById(parentAccount,(err,parentAccount) => {
    if(!err && parentAccount){
      // get the account referral of parent account
      AccountReferralCode.findById(parentAccount.accountReferralCodeId,(err,parentAccountReferral) => {
        if(!err && parentAccountReferral){
          // assign referral of parentAccount to new Account created
          // get the account referral of new Account created and update
          AccountReferralCode.findById(newAccount.accountReferralCodeId,(err,newAccountReferral) => {
            if(!err && newAccountReferral){
              // push the referral of parent account
              newAccountReferral.referrals.push(...parentAccountReferral.referrals);
              // push the account Id of parent account
              newAccountReferral.referrals.push(parentAccount._id);
              // save and update new account referral
              newAccountReferral.save(err => {
                if(err){
                  console.log('Error when updating new account referral');
                }
              });
              // update upline referralAccounts
              updateReferralAccounts(newAccountReferral.referrals,newAccount._id,parentAccount._id,leg);
              res.redirect('/login');
            } else {
              console.log('No new account referral found');
            }
          });
        } else {
          console.log('No parent account referral found');
        }
      });
    } else {
      console.log('No parent account found');
    }
  });
}

// update levels of upline referrals of new created account
async function updateReferralAccounts(referrals,newAccountId,parentAccountId,leg){
  for(let i=0; i < referrals.length; i++){
    try{
      // find the account
      const referralAccount = await Account.findById(referrals[i]);
      if(referralAccount){
        // find the account referralCodes
        const accountReferralCodes = await AccountReferralCode.findById(referralAccount.accountReferralCodeId);
        if(accountReferralCodes){
          const level = {
            level: referrals.length -i,
            account: newAccountId,
            parentAccount: parentAccountId,
            leg: leg
          }
          accountReferralCodes.levels.push(level);
          await accountReferralCodes.save();
        } else {
          console.log('No account referral codes found');
        }
      } else {
        console.log('No referral account found');
      }
    }catch(err){
      console.log(err);
    }
  }
}

// owner of referralCode cannot accommodate more downlines
async function cannotAccomodateDownline(ownerReferralCodes,newAccount,referralCode,res){
  // find the downlinerId where to assgin
  let prevDirectDownlines = ownerReferralCodes.directDownlines;
  let currentDirectDownlines = [];
  let isLoop = true;
  let downlinerAccountFound = null;
  let downlinerAccountReferral = null;

  while(isLoop){
    currentDirectDownlines = prevDirectDownlines;
    prevDirectDownlines = [];

    for(let i=0; i < currentDirectDownlines.length; i++){
      try{
        // find and get the account
        const account = await Account.findById(currentDirectDownlines[i]);
        if(account){
          const accountReferralCodes = await AccountReferralCode.findById(account.accountReferralCodeId);
          if(accountReferralCodes){
            if(accountReferralCodes.directDownlines < downlineLimit){
              // found where to downline new account, must break the loop
              // add direct downline to selected account, then save and update
              accountReferralCodes.directDownlines.push(newAccount._id);
              accountReferralCodes.save(err => {
                if(err){
                  console.log('Error when updating accountReferral Code');
                }
              });
              isLoop = false;
              downlinerAccountReferral = accountReferralCodes;
              downlinerAccountFound = account._id;
              break;
            } else {
              prevDirectDownlines.push(...accountReferralCodes.directDownlines);
            }
          } else {
            console.log('No account referral codes found');
          }
        } else {
          console.log('No direct downline account found');
        }
      } catch(err){
        console.log(err);
      }
    }
  }

  if(downlinerAccountFound && downlinerAccountReferral){
    // save and update new account referral codes
    // update referralCode status used in registration 
    updateReferralCodeUsed(referralCode,downlinerAccountFound,newAccount._id);
    // assign newAccount downlevel
    newAccountDownLevel(downlinerAccountFound,downlinerAccountReferral,newAccount,referralCode,res);
  } else {
    console.log('Nayabag grabi pgka error');
  }
  
}

// create account with default properties
async function createDefaulAccount(member,referralCode){
  try{
    // create default account fields to assign in new account
    const accountReferral = await AccountReferralCode.create({
      referralCodes: [],
      directDownlines: [],
      leftCodes: [],
      rightCodes: [],
      unAssignCodes: [],
      usedReferralCodes: [],
      unUsedReferralCodes: [],
      levels: [],
      referrals: [],
    });
    const accountSummary = await AccountSummary.create({});
    const accountMining = await MiningEngine.create({mining: []});
    const rank = await Ranking.findOne({rankLevel: 1});
    
    const newAccountData = {
      memberId: member._id,
      genratedReferralCodeId: referralCode._id,
      accountReferralCodeId: accountReferral._id,
      accountSummaryId: accountSummary._id,
      miningEngineId: accountMining._id,
      miningPower: rank._id
    }

    return await Account.create(newAccountData);
  } catch(err){
    console.log(err);
    return null;
  }
}