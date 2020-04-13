// declare dependencies
const express = require('express');
const indexMiddleware = require('../middleware/index');
const Account = require('../models/account');
const AccountReferral = require('../models/accountReferralCode');
const AccountSummary = require('../models/accountSummary');
const MiningEngine = require('../models/miningEngine');
const GeneratedReferralCode = require('../models/generatedReferralCode');
const helper = require('../lib/helpers');
const UpdateAccountSummary = require('../lib/code/updateAccountSummary');
const Ranking = require('../models/ranking');

const router = express.Router();

router.get('/dashboard/home',indexMiddleware.isLoggedIn,(req,res) => {
  // assign user to session user
  const user = req.user;

  Account.findById(user.accountId,(err,account) => {
    if(!err && account){
      AccountSummary.findById(account.accountSummaryId,(err,summaryData) => {
        // get the account summary data
        let tmpSummaryData = {};
        if(!err && summaryData){
          tmpSummaryData = summaryData;
        }
        // get member referral codes associate to member
        AccountReferral.findById(account.accountReferralCodeId).populate('referralCodes').populate('unUsedReferralCodes').exec((err,referralCodes) => {
          let tmpReferralCodes = {};
          if(!err){
            tmpReferralCodes = referralCodes;
          }
          // count how many pairs 
          const pairs = tmpSummaryData.leftLeg > tmpSummaryData.rightLeg ? tmpSummaryData.rightLeg : tmpSummaryData.leftLeg;
          // construct data pass to webpage
          const data = {
            summary: {
              mining: helper.formatDecimalToString(tmpSummaryData.miningIncome + 59),
              referral: helper.formatDecimalToString(tmpSummaryData.referralCommission),
              pairing: helper.formatDecimalToString(tmpSummaryData.pairingCommission),
              network: helper.formatDecimalToString(tmpSummaryData.networkBonus),
              gross: helper.formatDecimalToString(tmpSummaryData.grossIncome + 59),
              left: tmpSummaryData.leftLeg,
              right: tmpSummaryData.rightLeg,
              pairs: pairs,
              downline: tmpSummaryData.downline,
              networkType: pairs >= 2000 ? 'Millionaire\'s Club' : pairs >= 1600 ? 'Senior President' : pairs >= 1400 ? 'President' : 
                pairs >= 1250 ? 'Director III' : pairs >= 750 ? 'Director II' : pairs >= 500 ? 'Director I' :
                pairs >= 300 ? 'Team Leader III' : pairs >= 150 ? 'Team Leader II' : pairs >= 50 ? 'Team Leader I' : 'Newbie'
            },
            referral: {
              isUsed: tmpSummaryData.usedReferralCodes,
              unUsed: tmpSummaryData.unUsedReferralCodes,
              codes: tmpReferralCodes.referralCodes ? tmpReferralCodes.referralCodes.length : 0,
              unUsedCodes: tmpReferralCodes.unUsedReferralCodes,
              leftCodes: tmpReferralCodes.leftCodes,
              rightCodes: tmpReferralCodes.rightCodes
            }
          };
          // render dashboard page
          res.render('dashboard/dashboard',{data: data,type: 'member'});
        });
      });
    } else {
      console.log('No account for member found');
    }
  });
});

router.get('/dashboard',(req,res) => {
  res.redirect('/dashboard/home');
});

router.get('/dashboard/mining',indexMiddleware.isLoggedIn,(req,res) => {
  const user = req.user;
  Account.findById(user.accountId,(err,account) => {
    if(!err && account){
      // get and populate the miningEngine data and count all minings
      // without option parameter to count all total minings for pagination purpose
      MiningEngine.findById(account.miningEngineId).populate('minings').exec((err,result) => {
        // total count of minings and limit of records
        let count = 0;
        const limit = 15;
        if(!err && result){
          count = result.minings ? result.minings.length : 0;
        }
        // get the page number 
        const dif = Math.ceil(count / limit);
        const page = typeof(req.query.page) === 'string' && Number.isInteger(Number(req.query.page.trim())) &&
          Number(req.query.page.trim()) > 0 && Number(req.query.page.trim()) <= dif ? Number(req.query.page.trim()) : 1;
        // options getting the data in minings
        const options = {
          path: 'mining',
          options:{
            limit: limit,
            sort: {_id:-1},
            skip: limit * (page - 1)
          }
        };
        // get and populate the miningEngine data
        MiningEngine.findById(account.miningEngineId).populate(options).exec((err,dataMining) => {
          // get and populate the miningEngine data
          const pages = [];
          for(i =1; i <= dif; i++){
            pages.push({
              cnt: i,
              isActive: page === i ? true : false
            });
          }
          // get the ranking level of the account
          Ranking.findById(account.miningPower,(err,ranking) => {
            const data = {
              minings: dataMining && dataMining.mining ? dataMining.mining : [],
              pages: pages,
              ranking: ranking ? {
                hashRate: ranking.hashRate,
                hashRateStr: ranking.hashRateStr,
                power: ranking.power,
                algorithm: ranking.algorithm,
                incomePerDay: helper.formatDecimalToString(ranking.incomePerDay),
                rankName: ranking.rankName,
                gpuModel: ranking.gpuModel
              } : null,
              totalMiningIncome: helper.formatDecimalToString(dataMining.currentGrossIncome)
            }
            // render mining page
            res.render('dashboard/mining',{data: data});
          });
        });
      });
    } else {
      console.log('No account for member found');
    }
  });
});

router.get('/dashboard/referralcodes',indexMiddleware.isLoggedIn,(req,res) => {
  const user = req.user;
  Account.findById(user.accountId,(err,account) => {
    if(!err && account){
      // get and populate the referralCodes data and count all referral codes
      // without option parameter to count all total referrals for pagination purpose
      AccountReferral.findById(account.accountReferralCodeId).populate('referralCodes').exec((err,result) => {
        // total count of minings and limit of records
        let count = 0;
        const limit = 15;
        if(!err && result){
          count = result.referralCodes.length;
        }
        // total page number
        const dif = Math.ceil(count / limit);
        // validate page query
        const page = typeof(req.query.page) === 'string' && Number.isInteger(Number(req.query.page.trim())) &&
          Number(req.query.page.trim()) > 0 && Number(req.query.page.trim()) <= dif ? Number(req.query.page.trim()) : 1;
        // options getting the data in minings
        const options = {
          path: 'referralCodes',
          options:{
            limit: limit,
            sort: {_id:-1},
            skip: limit * (page - 1)
          }
        };
        // get and populate the miningEngine data
        AccountReferral.findById(account.accountReferralCodeId).populate(options).exec((err,referralCodesData) => {
          // get and populate the miningEngine data
          // pages
          const pages = [];
          for(i =1; i <= dif; i++){
            pages.push({
              cnt: i,
              isActive: page === i ? true : false
            });
          }
          // construct data pass to webpage
          const data = {
            referrals: referralCodesData ? referralCodesData : {},
            pages: pages,
          }
          // render mining page
          res.render('dashboard/referralCodes',{data: data});
        });
      });
    } else {
      console.log('No account found for member');
    }
  });
});

router.get('/dashboard/referralcodes/:id',indexMiddleware.isLoggedIn,(req,res) => {
  // get the account of member login
  Account.findById(req.user.accountId,(err,account) => {
    if(!err && account){
      // check if referral code id is valid
      GeneratedReferralCode.findById(req.params.id,(err,referralCode) => {
        if(!err && referralCode){
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
                const data = {
                  id: referralCode._id,
                  dateCreated: helper.fomatDate(new Date(referralCode.dateCreated)),
                  used:{
                    isUsed: false,
                    downlinerAccountId: null,
                    downlinerAccountName: null,
                    usedAccountId: null,
                    usedAccountName: null
                  },
                  isPending: true,
                  status: 'Pending'
                };
                // check the leg of referral code
                // check if referralcode is in right leg
                let isRight = false;
                for(let i=0; i < accountReferral.rightCodes.length; i++){
                  if(String(referralCode._id) == String(accountReferral.rightCodes[i])){
                    isRight = true;
                    break;
                  }
                }
                // check if referralcode is in left leg
                let isLeft = false;
                if(!isRight){
                  for(let i=0; i < accountReferral.leftCodes.length; i++){
                    if(String(referralCode._id) == String(accountReferral.leftCodes[i])){
                      isLeft = true;
                      break;
                    }
                  }
                }
                if(isRight){
                  data.isPending = false;
                  data.status = "Right Leg";
                } else if(isLeft){
                  data.isPending = false;
                  data.status = "Left Leg";
                }
                if(referralCode.isUsed){
                  data.used.isUsed = true;
                  // get the downliner Account of referral code
                  Account.findById(referralCode.downlineAccountId).populate('memberId').exec((err,downlinerAccount) => {
                    if(!err && downlinerAccount){
                      data.used.downlinerAccountId = downlinerAccount._id;
                      data.used.downlinerAccountName = downlinerAccount.memberId.firstname + " " + downlinerAccount.memberId.lastname;
                      // get the account who use the referral code
                      Account.findById(referralCode.usedBy).populate('memberId').exec((err,accountUsed) => {
                        if(!err && accountUsed){
                          data.used.usedAccountId = accountUsed._id;
                          data.used.usedAccountName = accountUsed.memberId.firstname + " " + accountUsed.memberId.lastname;
                          res.render('dashboard/referralCode',{data: data});
                        } else {
                          console.log('No Downliner account found');
                        }
                      });
                    } else {
                      console.log('No Downliner account found');
                    }
                  });
                } else {
                  res.render('dashboard/referralCode',{data: data});
                }
              } else {
                res.redirect('/dashboard/referralcodes');
              }
            } else {
              res.redirect('/dashboard/referralcodes');
            }
          });
        } else {
          res.redirect('/dashboard/referralcodes');
        }
      });
    } else {
      console.log('No account found in member');
    }
  });
});

router.post('/dashboard/referralcodes/:id',indexMiddleware.isLoggedIn,(req,res) => {
  const leg = req.body.leg;
  if(leg){
     // get the account of member login
    Account.findById(req.user.accountId,(err,account) => {
      if(!err && account){
        // check if referral code id is valid
        GeneratedReferralCode.findById(req.params.id,(err,referralCode) => {
          if(!err && referralCode){
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
                      res.redirect('/dashboard/referralcodes');
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
                  res.redirect('/dashboard/referralcodes');
                }
              } else {
                res.redirect('/dashboard/referralcodes');
              }
            });
          } else {
            res.redirect('/dashboard/referralcodes');
          }
        });
      } else {
        console.log('No account found in member');
      }
    });
  } else {
    res.redirect('/dashboard/referralcodes');
  }
});

router.get('/dashboard/mining/upgrade',indexMiddleware.isLoggedIn,(req,res) => {
  Ranking.find({},(err,rankingResult) => {
    Account.findById(req.user.accountId,(err,account) => {
      if(!err && account){
        const data = {
          ranking: rankingResult,
          currentRankingId: account.miningPower
        }
        res.render('dashboard/upgrades',{data: data});
      } else {
        res.redirect('/dashboard');
      }
    });
  });
});

router.get('/dashboard/setting',indexMiddleware.isLoggedIn,(req,res) => {
  // assign user to session user and create referral link
  const user = req.user;
  res.render('dashboard/siteSetting',{user: user,host: process.env.HOST,type: 'member'});
});

module.exports = router;