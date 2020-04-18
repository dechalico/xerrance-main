const express = require('express');
const Account = require('../models/account');
const Purchase = require('../models/purchase');
const UpgradeHist = require('../models/upgradeHistory');
const MiningEngine = require('../models/miningEngine');
const helper = require('../lib/helpers');
const Ranking = require('../models/ranking');

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
  if(typeof(req.query.token) === 'string' && req.query.token.trim() === process.env.CALLBACK_TOKEN){
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

module.exports = router;