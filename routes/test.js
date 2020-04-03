// this module is for creating referral codes for testing only
// must not used in production
const express = require('express');
const BuyCodeSuccess = require('../models/buyCodeSuccess');
const Member = require('../models/member');
const ReferralCode = require('../models/referralCode');
const PricePointReferrance = require('../models/pricePointReference');
const MemberSummary = require('../models/memberSummary');
const PairingBonus = require('../models/pairingBonus');
const Mining = require('../models/mining');
const MiningEngine = require('../models/miningEngine');

const route = express.Router();

route.get('/test/referral',(req,res) => {
  // validate token if valid
  if(typeof(req.query.token) === 'string' && req.query.token.trim().length > 0
    && req.query.token.trim() === process.env.TEST_KEY){
    
    // create referral code
    BuyCodeSuccess.create({email: 'xerrance01@gmail.com'},(err,buyCodeData) => {
      if(!err && buyCodeData){
        res.write('Referral Code: ' + buyCodeData._id);
      } else {
        res.write('Somethinf error happen, please try again');
      }
      res.end();
    });
  } else {
    res.write('Invalid request please go back to home page');
    res.end();
  }
});

function createReferralsPromise (ownerId){
  return new Promise(resolve => {
    BuyCodeSuccess.create({ownerId: ownerId},(err,data) => {
      if(!err && data){
        resolve(data._id);
      } else {
        resolve(false);
      }
    });
  });
};

async function createReferral(ownerId,count){
  const referralsCreated = [];
  for(let i =0; i < count; i++){
    const result = await createReferralsPromise(ownerId);
    if(result){
      referralsCreated.push(result);
    }
  }
  return referralsCreated;
};

route.get('/test/auto/referral',(req,res) => {
  // validate query params
  const email = typeof(req.query.email) === 'string' && req.query.email.trim().length > 3 ? req.query.email.trim() : false;
  const count = typeof(req.query.count) === 'string' && Number.isInteger(Number(req.query.count.trim())) ? Number(req.query.count.trim()) : 1;
  
  if(email){
    // check if email member is valid
    Member.findOne({email: email},(err,memberResult) => {
      if(!err && memberResult){
        // create referral codes through promise
        createReferral(memberResult._id,count).then(r => {
          // get referralCode refers to member
          ReferralCode.findById(memberResult.referralCodes,(err,referralCodeData) => {
            if(!err && referralCodeData){
              // assign generated referral codes to member
              for(i =0; i < r.length; i++){
                referralCodeData.referralCodes.push(r[i]);
                if(referralCodeData.right.length > referralCodeData.left.length){
                  referralCodeData.left.push(r[i]);
                } else {
                  referralCodeData.right.push(r[i]);
                }
              }
              referralCodeData.save();
              // find and update memberSummary document
              const referralPoint = 4.91;
              const pairingPoint = 5.9;
              const pairs = referralCodeData.left.length > referralCodeData.right.length ? referralCodeData.right.length : referralCodeData.left.length;
              let networkBonus = 0;
              if(pairs >= 2000){
                networkBonus =9720;
              } else if (pairs >= 1600){
                networkBonus = 6318;
              } else if (pairs >= 1400){
                networkBonus = 5402;
              } else if (pairs >= 1250){
                networkBonus = 4860;
              } else if (pairs >= 750){
                networkBonus = 3159;
              } else if (pairs >= 500){
                networkBonus = 1701;
              } else if (pairs >= 300){
                networkBonus = 1360;
              } else if (pairs >= 150){
                networkBonus = 388;
              } else if (pairs >= 50){
                networkBonus = 194;
              }else{
                networkBonus = 0;
              }
              const summary = {
                downline: referralCodeData.referralCodes.length,
                referralCommission: referralCodeData.referralCodes.length >= 10 ? 50 : referralCodeData.referralCodes.length * referralPoint,
                leftLeg: referralCodeData.left.length,
                rightLeg: referralCodeData.right.length,
                pairingCommission: referralCodeData.referralCodes.length > 10 ? (pairs > 5 ? (5 * pairingPoint) + ((pairs -5) * 0.98) : pairs * pairingPoint) : (pairs * pairingPoint),
                networkBonus: networkBonus,
                grossIncome: (referralCodeData.referralCodes.length >= 10 ? 50 : referralCodeData.referralCodes.length * referralPoint) +
                  (referralCodeData.referralCodes.length > 10 ? (pairs > 5 ? (5 * pairingPoint) + ((pairs -5) * 0.98) : pairs * pairingPoint) : (pairs * pairingPoint)) +
                  networkBonus
              }
              MemberSummary.findByIdAndUpdate(memberResult.memberSummary,summary,(err) => {
                if(!err){
                  res.write("Successfully created downlines");
                  res.end();
                } else {
                  console.log('Error when updating member summary');
                }
              });
            } else {
              console.log('no referral found.');
            }
          });
        });
      } else {
        res.write("Please provide valid email");
        res.end();
      }
    });  
  } else {
    res.write("Please provide email to automate the referral");
    res.end();
  }
});

function createMiningPromise(summaryId,dateCreated){
  return new Promise(resolve => {
    // get the member summary to update gross income
    MemberSummary.findById(summaryId,(err,summarydata) => {
      if(!err && summarydata){
        // mining data and mining computation per day
        const miningPercent = 26;
        const capitalFee = 59;
        const registrationFee = 11;
        // construct mining data
        const data = {
          dateCreated: dateCreated,
          downline: summarydata.downline,
          referralCommission: summarydata.referralCommission,
          miningIncome: (summarydata.miningIncome) + (((miningPercent / 100) * ((summarydata.downline + 1) * (capitalFee + registrationFee))) / 30),
          paringCommission: summarydata.pairingCommission,
          networkBonus: summarydata.networkBonus,
          grossIncome: summarydata.grossIncome + (((miningPercent / 100) * ((summarydata.downline + 1) * (capitalFee + registrationFee))) / 30)
        };
        // create and save mining data
        Mining.create(data,(err,result) => {
          if(!err && result){
            summarydata.miningIncome = data.miningIncome;
            summarydata.grossIncome = data.grossIncome;
            MemberSummary.updateOne(summarydata,(err) => {
              if(!err){
                resolve(result);
              } else {
                resolve(false);
              }
            });
          } else {
            console.log('error');
            resolve(false);
          }
        });
      } else {
        console.log('error when finding member summary');
      }
    });
  });
};

async function createMining(memberSummaryId,daysCount){
  const minings = [];
  const date = new Date();
  for(let i =0; i < daysCount; i++){
    const result = await createMiningPromise(memberSummaryId,date.getTime());
    if(result){
      minings.push(result);
    }
    date.setDate(date.getDate() + 1);
  }
  return minings;
};

route.get('/test/auto/mining',(req,res) => {
  const email = typeof(req.query.email) === 'string' && req.query.email.trim().length > 3 ? req.query.email.trim() : false;
  const days = typeof(req.query.days) === 'string' && Number.isInteger(Number(req.query.days.trim())) ? Number(req.query.days.trim()) : 1;

  if(email){
    // check if email is existed in database
    Member.findOne({email: email},(err,memberData) => {
      if(!err && memberData){
        // check if have price amounts
        createMining(memberData.memberSummary,days).then(r => {
          MiningEngine.findById(memberData.mining,(err,miningEngineData) => {
            if(!err && miningEngineData){
              miningEngineData.minings.push(...r);
              miningEngineData.save((err) => {
                if(!err){ 
                  res.write('Success');
                  res.end();
                } else {
                  console.log('Mining engine failed to save minings data');
                  res.write('Some Internal Errors happen');
                  res.end();
                }
              });
            } else {
              console.log('No mining engine found');
              res.write('Some Internal Errors happen');
              res.end();
            }
          });
        });
      } else {
        res.write('Please provide valid email');
        res.end();
      }
    });
  } else {
    // if email not existed or invalid
    res.write("Please provide email to automate the referral");
    res.end();
  }
});

route.get('/test/createpoints',(req,res) => {
  PricePointReferrance.create({
    capitalFee: 59,
    registrationFee: 11,
    referralPoint: 4.91,
    pairingPoint: 5.9,
    miningPercent: 26,
  },(err) => {
    if(!err){
      console.log('Price Point Created');
    }
    res.end();
  });
});

route.get('/test/createbonus',(req,res) => {
  const data = {
    newbie: {
      level1: {
        pairsBegin: 0,
        pairsEnd: 49,
        bonus: 0
      }
    },
    teamLeader:{
      level1:{
        pairsBegin: 50,
        pairsEnd: 149,
        bonus: 194
      },
      level2: {
        pairsBegin: 150,
        pairsEnd: 299,
        bonus: 388
      },
      level3:{
        pairsBegin: 300,
        pairsEnd: 499,
        bonus: 1360
      }
    },
    director:{
      level1:{
        pairsBegin: 500,
        pairsEnd: 749,
        bonus: 1701
      },
      level2: {
        pairsBegin: 750,
        pairsEnd: 1249,
        bonus: 3159
      },
      level3:{
        pairsBegin: 1250,
        pairsEnd: 1399,
        bonus: 4860
      }
    },
    president:{
      level1: {
        pairsBegin: 1400,
        pairsEnd: 1599,
        bonus: 5402
      }
    },
    seniorPresident: {
      level1: {
        pairsBegin: 1600,
        pairsEnd: 1999,
        bonus: 6318
      }
    },
    millionaireClub: {
      level1: {
        pairsBegin: 2000,
        pairsEnd: 0,
        bonus: 9720
      }
    }
  };
  PairingBonus.create(data,(err) => {
    if(!err){
      console.log('Pairing Bonus Created');
    }
    res.end();
  });
});

// must remove in production
route.get('/test/clear',(req,res) => {
  ReferralCode.deleteMany({},(err) => {
    if(!err){}
    console.log("Referral Code Successfully Deleted.");
  });

  Member.deleteMany({},(err) => {
    console.log("Member Successfully Deleted");
  });

  BuyCodeSuccess.deleteMany({},(err) => {
    console.log("Buy Codes Successfully Deleted");
  });

  MemberSummary.deleteMany({},(err) => {
    console.log("Member Summary Successfully Deleted");
  });

  Mining.deleteMany({},(err) => {
    console.log("Mining Summary Successfully Deleted");
  });

  MiningEngine.deleteMany({},(err) => {
    console.log("Mining Engine Summary Successfully Deleted");
  });

  res.write("Success");
  res.end();
});

route.get('/test',(req,res) => {
  res.render('dashboard/dashboard',{host: process.env.HOST});
});

module.exports = route;