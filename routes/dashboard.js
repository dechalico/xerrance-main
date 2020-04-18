// declare dependencies
const express = require('express');
const indexMiddleware = require('../middleware/index');
const Account = require('../models/account');
const Ranking = require('../models/ranking');
const DashboardIndex = require('../lib/code/dashboard/index');
const DashboardMinings = require('../lib/code/dashboard/mining');
const DashboardReferralCodes = require('../lib/code/dashboard/referralCodes');
const DashboardReferralCode = require('../lib/code/dashboard/referralCode');
const DashboardPostReferralCode =require('../lib/code/dashboard/PostreferralCode');
const DashboardNetwork = require('../lib/code/dashboard/network');
const DashboardNetworkAccount = require('../lib/code/dashboard/networkAccount');
const Purchase = require('../models/purchase');
const helper = require('../lib/helpers');

const router = express.Router();

router.get('/dashboard/home',indexMiddleware.isLoggedIn,(req,res) => {
  // assign user to session user
  const user = req.user;
  DashboardIndex(user.accountId,(isValid,data) => {
    if(isValid){
      res.render('dashboard/index',{data: data});
    } else {
      res.redirect('/logout');
    }
  });
});

router.get('/dashboard',(req,res) => {
  res.redirect('/dashboard/home');
});

router.get('/dashboard/mining',indexMiddleware.isLoggedIn,(req,res) => {
  const user = req.user;
  const page = typeof(req.query.page) === 'string' && Number.isInteger(Number(req.query.page.trim())) &&
          Number(req.query.page.trim()) > 0 && Number(req.query.page.trim()) <= dif ? Number(req.query.page.trim()) : 1;
  DashboardMinings(user.accountId,0,page,(isValid,data) => {
    if(isValid){
      res.render('dashboard/minings',{data: data});
    } else {
      res.redirect('/logout');
    }
  });
});

router.get('/dashboard/referralcodes',indexMiddleware.isLoggedIn,(req,res) => {
  const user = req.user;
  const page = typeof(req.query.page) === 'string' && Number.isInteger(Number(req.query.page.trim())) &&
          Number(req.query.page.trim()) > 0 && Number(req.query.page.trim()) <= dif ? Number(req.query.page.trim()) : 1;
  DashboardReferralCodes(user.accountId,0,page,(isValid,data) => {
    if(isValid){
      res.render('dashboard/referralCodes',{data: data});
    } else {
      res.redirect('/logout');
    }
  });
});

router.get('/dashboard/referralcodes/:id',indexMiddleware.isLoggedIn,(req,res) => {
  // get the account of member login
  const user = req.user;
  DashboardReferralCode(user.accountId,req.params.id,(isValid,data) => {
    if(isValid){
      res.render('dashboard/referralCode',{data: data});
    } else {
      res.redirect('/dashboard/referralcodes');
    }
  });
});

router.post('/dashboard/referralcodes/:id',indexMiddleware.isLoggedIn,(req,res) => {
  // get the account of member login
  const user = req.user;
  const leg = req.body.leg;
  if(leg){
     DashboardPostReferralCode(user.accountId,req.params.id,leg,(isValid) => {
      res.redirect('/dashboard/referralcodes');
     })
  } else {
    res.redirect('/dashboard/referralcodes');
  }
});

router.get('/dashboard/mining/upgrade',indexMiddleware.isLoggedIn,(req,res) => {
  // get all the rankings
  Ranking.find({},(err,rankingResult) => {
    // get the user account
    Account.findById(req.user.accountId,(err,account) => {
      if(!err && account){
        // get the ranking account
        Ranking.findById(account.miningPower,(err,accoungRank) => {
          if(!err && accoungRank){
            const data = {
              ranking: rankingResult,
              currentRankLevel: accoungRank.rankLevel
            }
            res.render('dashboard/upgrades',{data: data});
          } else {
            res.redirect('/dashboard');
          }
        });
      } else {
        res.redirect('/dashboard');
      }
    });
  });
});

router.get('/dashboard/mining/upgrade/:id',indexMiddleware.isLoggedIn,(req,res) => {
  // check eh rank id is valid request
  Ranking.findById(req.params.id,(err,rank) => {
    if(!err && rank){
      // check the current account rank level, if the requested upgrade is below current rank level then rerirect to upgrades
      Account.findById(req.user.accountId).populate('miningPower').exec((err,account) => {
        if(!err && account){
          if(account.miningPower.rankLevel >= rank.rankLevel){
            res.redirect('/dashboard/mining/upgrade');
          } else {
            res.render('dashboard/buyUpgradeRank',{rank: rank});
          }
        } else {
          res.redirect('/dashboard/mining/upgrade');
        }
      });
    } else {
      res.redirect('/dashboard/mining/upgrade');
    }
  });
});

router.post('/dashboard/mining/upgrade/:id',indexMiddleware.isLoggedIn,(req,res) => {
  // check eh rank id is valid request
  Ranking.findById(req.params.id,(err,rank) => {
    if(!err && rank){
      // check the current account rank level, if the requested upgrade is below current rank level then rerirect to upgrades
      Account.findById(req.user.accountId).populate('miningPower').populate('memberId').exec((err,account) => {
        if(!err && account){
          if(account.miningPower.rankLevel >= rank.rankLevel){
            res.redirect('/dashboard/mining/upgrade');
          } else {
            const currentDate = Date.now();
            const dataPurchase = {
              account: account._id,
              rankId: rank._id,
              price: rank.investment,
              rankName: rank.rankName,
              dateOrder: currentDate,
            };
            Purchase.findById(account.purchaseId,(err,purchase) => {
              if(!err && purchase){
                purchase.upgradeRank.push(dataPurchase);
                purchase.save((err,savePurchase) => {
                  if(!err && savePurchase){
                    // get the last purchase id and construct data send to email
                    const lastId = savePurchase.upgradeRank[savePurchase.upgradeRank.length - 1]._id;
                    const email = account.memberId.email;
                    const link = process.env.HOST + '/order/upgrade?token=' + account._id + '&id=' + lastId;
                    const message = 'Thank you for trusting XERRANCE and upgrading your account. Please follow this link ' + link + ' to continue your transaction.';
                    helper.sendMail(email,'Upgrade Rank Verification',message,(err) => {
                      const data = {
                        header: 'Upgrade Rank',
                        title: ' We\'ve got your order!',
                        body: 'Your order has been placed. We send a message to your email to continue your payment.'
                      };
                      if(err){
                        data.title = 'Internal Error happens';
                        data.body = 'Sorry for inconvenience but seems their is error happens';
                      }
                      res.render('dashboard/message',{data: data});
                    });
                  } else {
                    res.redirect('/dashboard/mining/upgrade')
                  }
                });
              } else {
                res.redirect('/dashboard/mining/upgrade')
              }
            });
          }
        } else {
          res.redirect('/dashboard/mining/upgrade');
        }
      });
    } else {
      res.redirect('/dashboard/mining/upgrade');
    }
  });
});

router.get('/order/upgrade',indexMiddleware.isLoggedIn,(req,res) => {
  // validate request params
  const token = typeof(req.query.token) == 'string' ? req.query.token.trim() : false;
  const id = typeof(req.query.id) == 'string' ? req.query.id.trim() : false;

  if(token && id){
    // check if the account is valid
    Account.findById(token,(err,account) => {
      if(!err && account){
        // get the purchase transaction of the account
        Purchase.findById(account.purchaseId,(err,purchase) => {
          if(!err && purchase){
            // check if the id or transaction id is valid
            let isFound = false;
            let rankId = ''
            for(let i=0; i < purchase.upgradeRank.length; i++){
              if(String(purchase.upgradeRank[i]._id) == id){
                purchase.upgradeRank[i].isValidated = true;
                rankId = purchase.upgradeRank[i].rankId;
                isFound = true;
                break;
              }
            }
            if(isFound){
              // get the rank level bought
              Ranking.findById(rankId,(err,rank) => {
                if(!err && rank){
                  // save the purchase details
                  purchase.save(err => {
                    if(!err){
                      res.render('dashboard/payUpgradeRank',{rank: rank,id: id,token: token});
                    } else {
                      res.redirect('/dashboard/mining');
                    }
                  });
                } else {
                  res.redirect('/dashboard/mining');
                }
              });
            } else {
              res.redirect('/dashboard/mining');
            }
          } else{
            res.redirect('/dashboard/mining');
          }
        });
      } else {
        res.redirect('/dashboard/mining');
      }
    });
  } else {
    res.redirect('/dashboard/mining');
  }
});

router.get('/dashboard/network',indexMiddleware.isLoggedIn,(req,res) => {
  // get the account of member login
  const user = req.user;
  DashboardNetwork(user.accountId,(isValid,data) => {
    if(isValid){ 
      res.render('dashboard/network',{data: data,isSearch : false});
    } else {
      res.redirect('/logout');
    }
  });
});

router.get('/dashboard/network/:id',indexMiddleware.isLoggedIn,(req,res) => {
  // get the account of member login
  const user = req.user;
  DashboardNetworkAccount(user.accountId,req.params.id,(isValid,data) => {
    if(isValid){ 
      res.render('dashboard/network',{data: data,isSearch: true});
    } else {
      res.redirect('/logout');
    }
  });
});

router.get('/dashboard/setting',indexMiddleware.isLoggedIn,(req,res) => {
  // assign user to session user and create referral link
  const user = req.user;
  res.render('dashboard/siteSetting',{user: user,host: process.env.HOST,type: 'member'});
});

module.exports = router;