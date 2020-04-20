const express = require('express');
const Account = require('../models/account');
const Purchase = require('../models/purchase');
const UpgradeHist = require('../models/upgradeHistory');
const MiningEngine = require('../models/miningEngine');
const helper = require('../lib/helpers');
const Ranking = require('../models/ranking');
const BuyInAccoount = require('../models/buyCodeInAccount');
const GeneratedReferralCode = require('../models/generatedReferralCode');
const AccountReferralCodes = require('../models/accountReferralCode');

const router = express.Router();

router.get("/purchase/payment/unconfirm",(req,res) => {
  if(typeof(req.query.token) === 'string' && req.query.token.trim() === process.env.CALLBACK_TOKEN){
    res.redirect('/dashboard/mining');
  } else {
    res.redirect('/dashboard/mining');
  }
});

// get all paymeny success callback
router.get("/purchase/payment/success",(req,res) => {
  // check if token string is valid for security purpose
  if(typeof(req.query.token) === 'string' && req.query.token.trim() === process.env.CALLBACK_TOKEN && typeof(req.query.addr) == 'string'){
    // if token is valid then check the transaction data
    helper.getBTCTransaction(req.query.addr,(err,data) => {
      if(!err){
        // if thier is no error in getting transaction data and status == 2 means successfully paid
        if(data.status === 2) {
          // check if their is extra data value
          const extraData = typeof(data.data.extradata) === 'string' ? data.data.extradata.trim() : false;
          if(extraData){
            // if their is extra data value then transaction is clean and valid data
            // extraData value is : 'transId:asdfasd42134234asdf##type:head'
            const arrExtraData = extraData.split('##');
            // validate and check the extra data
            const arrTrans = typeof(arrExtraData[0]) === 'string' ? arrExtraData[0].split(':') : false;
            const arrTypes = typeof(arrExtraData[1]) === 'string' ? arrExtraData[1].split(':') : false;
            const arrToken = arrExtraData.length == 3 ? typeof(arrExtraData[2]) === 'string' ? arrExtraData[2].split(':') : false : false;

            if(typeof(arrTrans[1]) === 'string' && typeof(arrTypes[1]) === 'string'){
              // valid extra data
              // check what kind of payment transaction
              if(arrTypes[1].trim() === 'head'){
                // buy one referral code type

              } 
              else if(arrTypes[1].trim() === 'rank'){
                // purchase upgrade rank mining
                // find the account who purchase the rank
                const purchaseId = arrTrans[1];
                const accountId = arrToken[1];
                Account.findById(accountId,(err,account) => {
                  if(!err && account){
                    // get the account purchase details
                    Purchase.findById(account.purchaseId,(err,purchase) => {
                      if(!err && purchase){
                        // check if the id or transaction id is valid
                        let isFound = false;
                        let rankId = ''
                        for(let i=0; i < purchase.upgradeRank.length; i++){
                          if(String(purchase.upgradeRank[i]._id) == purchaseId){
                            purchase.upgradeRank[i].isPaymentSuccess = true;
                            purchase.upgradeRank[i].datePayed = Date.now();
                            rankId = purchase.upgradeRank[i].rankId;
                            isFound = true;
                            break;
                          }
                        }
                        // if the transaction id is valid
                        if(isFound){
                          // get the rank level bought
                          Ranking.findById(rankId,(err,rank) => {
                            if(!err && rank){
                              // save the purchase details
                              purchase.save(err => {
                                if(!err){
                                  // find the mining engine of the account
                                  MiningEngine.findById(account.miningEngineId,(err,miningEngine) => {
                                    if(!err && miningEngine){
                                      // upgrade history data
                                      const upgradeHistData = {
                                        dateUpgraded: Date.now(),
                                        prevRank: account.miningPower,
                                        upgradedRank: rank._id
                                      }
                                      // save and update the account
                                      account.miningPower = rank._id;
                                      account.save(err => {
                                        if(err){
                                          // Error when updating account
                                          console.log('Error when updating account');
                                          res.redirect('/dashboard/mining');
                                        } else {
                                          // create upgrade history to account
                                          UpgradeHist.create(upgradeHistData,(err,data) => {
                                            if(!err && data){
                                              // save and update mining engine of the account
                                              miningEngine.upgradeHistory.push(data._id);
                                              miningEngine.save(err => {
                                                if(err){
                                                  // Error when updating mining engine
                                                  console.log('Error when updating mining engine');
                                                  res.redirect('/dashboard/mining');
                                                  res.end();
                                                } else{
                                                  res.redirect('/dashboard/mining');
                                                }
                                              });
                                            } else {
                                              // Error when creating upgrade rank history in the account
                                              console.log('Error when creating upgrade rank history in the account');
                                              res.redirect('/dashboard/mining');
                                            }
                                          });
                                        }
                                      });
                                    } else {
                                      // Can\'t find mining engine of the account
                                      console.log('Can\'t find mining engine of the account');
                                      res.redirect('/dashboard/mining');
                                    }
                                  });
                                } else {
                                  // Error when updating the purchase transaction
                                  console.log('Error when updating the purchase transaction');
                                  res.redirect('/dashboard/mining');
                                }
                              });
                            } else {
                              // Cannot find rank bought
                              console.log('Cannot find rank bought');
                              res.redirect('/dashboard/mining');
                            }
                          });
                        } else {
                          // Transaction not found in upgrade ranking
                          console.log('Transaction not found in upgrade ranking');
                          res.redirect('/dashboard/mining');
                        }
                      } else {
                        // Purchase transaction not found
                        console.log('Purchase transaction not found');
                        res.redirect('/dashboard/mining');
                      }
                    });
                  } else {
                    // Cannot find account when upgrading to rank
                    console.log('Cannot find account when upgrading to rank');
                    res.redirect('/dashboard/mining');
                  }
                });
              } else if(arrTypes[1].trim() == 'refAccount'){
                // purchase upgrade rank mining
                // find the account who purchase the rank
                const purchaseId = arrTrans[1];
                const accountId = arrToken[1];

                // check if the account exist
                Account.findById(accountId,(err,account) => {
                  if(!err && account){
                    // fing the buy referral transaction
                    BuyInAccoount.findById(purchaseId,(err,buyData) => {
                      if(!err && buyData){
                        // check if transaction already payed
                        if(!buyData.isPaymentSuccess){
                          // generate referral codes
                          createReferralCodes(buyData._id,account._id,buyData.quantity).then(data => {
                            // check if generated referral codes is equal to count
                            // save and update buydata
                            buyData.isPaymentSuccess = true;
                            buyData.paymentDateSuccess = Date.now();
                            buyData.transactionAddress = req.query.addr;
                            buyData.referralCodes.push(...data);
                            buyData.save(err => {
                              if(err){
                                console.log('Error when updating buy data information');
                              }
                            });
                            // get the purchase details of the  account
                            Purchase.findById(account.purchaseId,(err,purchase) => {
                              if(!err && purchase){
                                purchase.referralCodes.push(buyData._id);
                                // save and update purchase details
                                purchase.save(err => {
                                  if(err){
                                    // error when updating purchase details
                                    console.log('Error when updating purchase');
                                  }
                                });
                              } else {
                                // error when finding the purchase data of the account
                                console.log('No purchase record found in the account');
                                res.redirect('/dashboard/network');
                              }
                            });
                            // get the account referral codes
                            AccountReferralCodes.findById(account.accountReferralCodeId,(err,accountReferralCodes) => {
                              if(!err && accountReferralCodes){
                                accountReferralCodes.referralCodes.push(...data);
                                accountReferralCodes.unUsedReferralCodes.push(...data);
                                accountReferralCodes.unAssignCodes.push(...data);
                                // save and update account referralcodes
                                accountReferralCodes.save(err => {
                                  if(err){
                                    // error when updating accountReferralCode
                                    console.log('Error when updating account referral code');
                                    res.redirect('/dashboard/network');
                                  } else {
                                    // successfully payed
                                    res.redirect('/dashboard/network');
                                  }
                                });
                              } else {
                                // error no accounReferralCodes found
                                console.log('No accountReferralCodes found');
                                res.redirect('/dashboard/network');
                              }
                            });
                            
                          });
                        } else {
                          // transaction data already payed
                          console.log('Transaction data already payed');
                          res.redirect('/dashboard/network');
                        }
                      } else {
                        // cannot find the transaction data
                        console.log('Canoot find the transaction data');
                        res.redirect('/dashboard/network');
                      }
                    });
                  } else {
                    // cannot find the token account
                    console.log('Cannot find the token account');
                    res.redirect('/dashboard/network');
                  }
                });
              }
              else {
                // invalid transaction type
                console.log('Invalid transaction type');
                res.redirect('/dashboard');
              }
            } else {
              // invalid extra data
              console.log('Invalid extra data');
              res.redirect('/dashboard');
            }
          } else {
            //if thier is no extra data value then save to database
            console.log('no extra data value when save');
            res.redirect('/dashboard');
          }
        } else {
          // if their is error in getting the transaction data
          console.log('Error in getting the transaction data');
          res.redirect('/dashboard');
        }
      } else {
        // error when requesting transaction to blockonomic
        console.log('error when requesting transaction to blockonomic');
        res.redirect('/dashboard');
      }
    });
  } else {
    // invalid token requested
    console.log('Invalid token requested');
    res.redirect('/dashboard');
  }
});

async function createReferralCodes(buyId,ownerId,count){
  let referralCodes = [];
  for(let i=0; i < count; i++){
    try{
      const referralCode = await GeneratedReferralCode.create({buyId: buyId,ownerAccountId: ownerId});
      if(referralCodes){
        referralCodes.push(referralCode._id);
      }
    } catch(err){
      console.log(err);
    }
  }
  return referralCodes;
}

module.exports = router;