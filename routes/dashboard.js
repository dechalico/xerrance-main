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