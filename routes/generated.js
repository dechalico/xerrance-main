const express = require('express');
const router = express.Router();

const BuyCodeInWeb = require('../models/buyCodeInWeb');
const GeneratedReferralCode = require('../models/generatedReferralCode');
const Member = require('../models/member');
const BuyCodeInAccount = require('../models/buyCodeInAccount');
const Account = require('../models/account');
const AccountReferralCode = require('../models/accountReferralCode');
const AccountSummary = require('../models/buyCodeInAccount');
const MiningEngine = require('../models/miningEngine');

router.get('/test/referral',(req,res) => {
  if(typeof(req.query.token) === 'string' && req.query.token.trim().length > 0
    && req.query.token.trim() === process.env.TEST_KEY){
    
    // create entry in buy in web transaction
    BuyCodeInWeb.create({email: 'xerrance01@gmail.com'},(err,buyResult) => {
      if(!err && buyResult){
        GeneratedReferralCode.create({buyId: buyResult._id},(err,generatedResult) => {
          if(!err && generatedResult){
            res.write('Generated Referral Code: ' + generatedResult._id);
            res.end();
          } else {
            res.write('Some Internal Error Happens');
            res.end();
          }
        });
      } else {
        res.write('Some Internal Error Happens');
        res.end();
      }
    });
  } else {
    res.write('Invalid specified token');
    res.end();
  }
});

router.get('/test/accounts',(req,res) => {
  Member.find({}).populate('accountId').exec((err,data) => {
    if(!err && data){
      let write = '';
      for(i=0; i < data.length; i++){
        write +=  data[i];
      }
      res.write(write);
      res.end();
    } else {
      res.write('No data found');
      res.end();
    }
  });
});

async function createBuyCodeInAccountPromise(buyId,accountId,count){
  const result = [];
  for(i =0; i < count; i++){
    const data = await GeneratedReferralCode.create({buyId: buyId,ownerAccountId: accountId});
    if(data){
      result.push(data._id);
    }
  }
  return result;
}

router.get('/test',(req,res) => {
  res.render('dashboard/referralCode');
});

router.get('/test/buycode',(req,res) => {
  const id = typeof(req.query.id) === 'string' && req.query.id.trim().length > 3 ? req.query.id.trim() : false;
  const count = typeof(req.query.count) === 'string' && Number.isInteger(Number(req.query.count.trim())) ? Number(req.query.count.trim()) : 1;

  Account.findById(id,(err,account) => {
    if(!err && account){
      BuyCodeInAccount.create({accountId: id,quantity: count}).then(buyData => {
        createBuyCodeInAccountPromise(buyData._id,id,count).then(r => {
          AccountReferralCode.findById(account.accountReferralCodeId,(err,accountReferralResult) => {
            if(!err && accountReferralResult){
              let write = '';
              for(i=0; i < r.length; i++){
                write += r[i] + ', '
                accountReferralResult.referralCodes.push(r[i]);
                accountReferralResult.unUsedReferralCodes.push(r[i]);
              }
              accountReferralResult.save(err => {
                if(err){
                  console.log('Error when updating the account referral codes');
                }
              });
              res.write(write);
              res.end();
            } else {
              console.log('Error when finding account referral code');
            }
          });
        });
      });
    } else {
      res.write('Invalid account');
      res.end();
    }
  });
});

router.get('/test/register',(req,res) => {
  
});

router.get('/test/clear',(req,res) => {
  Member.deleteMany({},err => {
    if(!err) {
      console.log('Membership Collection Successfully Clear Data');
    }
  });

  GeneratedReferralCode.deleteMany({},err => {
    if(!err) {
      console.log('Generated Referral Codes Collection Successfully Clear Data');
    }
  });

  BuyCodeInWeb.deleteMany({},err => {
    if(!err){
      console.log('Buy Code in Web Collection Successfully Clear Data');
    }
  });

  BuyCodeInAccount.deleteMany({},err => {
    if(!err){
      console.log('Buy Code in Account Collection Successfully Clear Data');
    }
  });

  Account.deleteMany({},err => {
    if(!err){
      console.log(' Account Collection Successfully Clear Data');
    }
  });

  AccountReferralCode.deleteMany({},err => {
    if(!err){
      console.log('Account Referral Code Collection Successfully Clear Data');
    }
  });

  AccountSummary.deleteMany({},err => {
    if(!err){
      console.log('Account Summary Code Collection Successfully Clear Data');
    }
  });

  MiningEngine.deleteMany({},err => {
    if(!err){
      console.log('Mining Engine Collection Successfully Clear Data');
    }
  });

  res.write('Successfully Clear All Data');
  res.end();
});



module.exports = router;