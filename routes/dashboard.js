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
const BuyInAccount = require('../models/buyCodeInAccount');

const router = express.Router();

router.get('/dashboard/home',indexMiddleware.isLoggedIn,(req,res) => {
  // assign user to session user
  const user = req.user;
  DashboardIndex(user.accountId,(isValid,data) => {
    if(isValid){
      res.render('dashboard/index',{data: data,active: 1,title: 'Xerrance | Dashboard'});
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
      res.render('dashboard/minings',{data: data,active: 2,title: 'Xerrance | Mining'});
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
      res.render('dashboard/referralCodes',{data: data,active: 3,title: 'Xerrance | Referral Codes'});
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
      res.render('dashboard/referralCode',{data: data,active: 3,title: 'Xerrance | Referral Codes'});
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
            res.render('dashboard/upgrades',{data: data,active: 2,title: 'Xerrance | Upgrade Mining'});
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
            res.render('dashboard/buyUpgradeRank',{rank: rank,active: 2,title: 'Xerrance | Upgrade Mining'});
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
                    const link = '/dashboard/order/upgrade?token=' + account._id + '&id=' + lastId;
                    res.redirect(link);
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

router.get('/dashboard/order/upgrade',indexMiddleware.isLoggedIn,(req,res) => {
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
            let isAlreadyPayed = false;
            let rankId = ''
            for(let i=0; i < purchase.upgradeRank.length; i++){
              if(String(purchase.upgradeRank[i]._id) == id){
                // check if already payed
                if(purchase.upgradeRank[i].isPaymentSuccess){
                  isAlreadyPayed = true;
                } else {
                  rankId = purchase.upgradeRank[i].rankId;
                  isFound = true;
                }
                break;
              }
            }
            if(!isAlreadyPayed){
              if(isFound){
                // get the rank level bought
                Ranking.findById(rankId,(err,rank) => {
                  if(!err && rank){
                    // save the purchase details
                    purchase.save(err => {
                      if(!err){
                        res.render('dashboard/payUpgradeRank',{rank: rank,id: id,token: token,active: 2,title: 'Xerrance | Order Upgrade'});
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
      res.render('dashboard/network',{data: data,isSearch : false,active: 4,title: 'Xerrance | Network'});
    } else {
      res.redirect('/logout');
    } 
  });
});

router.get('/dashboard/network/buyreferral',indexMiddleware.isLoggedIn,(req,res) => {
  res.render('dashboard/buyReferral',{active: 4,title: 'Xerrance | Network - Buy Referral Code'});
});

router.post('/dashboard/network/buyreferral',indexMiddleware.isLoggedIn,(req,res) => {
  // get the account
  // validate and check quantity payload
  let quantity;
  if(typeof(req.body.quantity) == 'string'){
    quantity = Number(req.body.quantity);
    quantity = Number.isInteger(quantity) ? quantity : false;
  }

  if(quantity){
    Account.findById(req.user.accountId,(err,account) => {
      if(!err && account){
        const buyData = {
          accountId: account._id,
          quantity: quantity,
          usdPrice: 70,
          discountPercent: 0,
          totalUsdPrice: 70 * quantity,
          referralCodes: []
        };
        BuyInAccount.create(buyData,(err,buyResult) => {
          if(!err && buyResult){
            const link = '/dashboard/order/buyreferral?token=' + account._id + '&id=' + buyResult._id;
            res.redirect(link);
          } else {
            res.redirect('/dashboard/network/buyreferral');
          }
        })
      } else {
        res.redirect('/logout');
      }
    });
  } else {
    res.redirect('/dashboard/network/buyreferral');
  }
});

router.get('/dashboard/order/buyreferral',indexMiddleware.isLoggedIn,(req,res) => {
  // check and validate query string
  const token = typeof(req.query.token) == 'string' ? req.query.token.trim() : false;
  const id = typeof(req.query.id) == 'string' ? req.query.id.trim() : false;

  if(token && id){
    // check token id or account id if valid
    Account.findById(token,(err,account) => {
      if(!err && account){
        // check id or buy id if valid
        BuyInAccount.findById(id,(err,buyData) => {
          if(!err && buyData){
            // check if this buy details already paid
            if(buyData.isPaymentSuccess){
              res.redirect('/dashboard/network/buyreferral');
            } else {
              const data = {
                totalPriceStr: helper.formatDecimalToString(buyData.totalUsdPrice),
                priceStr: helper.formatDecimalToString(buyData.usdPrice),
                totalPrice: buyData.totalUsdPrice,
                quantity: buyData.quantity,
                id: id,
                token: token
              };
              res.render('dashboard/payReferral',{data: data,active: 4,title: 'Xerrance | Network - Pay Referral Code'});
            }
          } else {
            res.redirect('/dashboard/network/buyreferral');
          }
        });
      } else {
        res.redirect('/dashboard/network');
      }
    });
  } else {
    res.redirect('/dashboard/network/buyreferral');
  }
});

router.get('/dashboard/network/:id',indexMiddleware.isLoggedIn,(req,res) => {
  // get the account of member login
  const user = req.user;
  DashboardNetworkAccount(user.accountId,req.params.id,(isValid,data) => {
    if(isValid){ 
      res.render('dashboard/network',{data: data,isSearch: true,active: 4,title: 'Xerrance | Network'});
    } else {
      res.redirect('/logout');
    }
  });
});

router.get('/dashboard/setting',indexMiddleware.isLoggedIn,(req,res) => {
  // assign user to session user and create referral link
  const user = req.user;
  res.render('dashboard/siteSetting',{active: 5,title: 'Xerrance | Settings'});
});

router.get('/dashboard/*',(req,res) => {
  res.render('dashboard/notfound',{title: 'Xerrance | Page Not Found'});
});

module.exports = router;