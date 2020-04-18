const express = require('express');
const router = express.Router();

const BuyCodeInWeb = require('../models/buyCodeInWeb');
const GeneratedReferralCode = require('../models/generatedReferralCode');
const Member = require('../models/member');
const BuyCodeInAccount = require('../models/buyCodeInAccount');
const Account = require('../models/account');
const AccountReferralCode = require('../models/accountReferralCode');
const AccountSummary = require('../models/accountSummary');
const MiningEngine = require('../models/miningEngine');
const Ranking = require('../models/ranking');
const UpdateAccountSummary = require('../lib/code/updateAccountSummary');
const MiningCycle = require('../lib/code/miningCycle');
const UpgradeHistory = require('../models/upgradeHistory');
const Purchase = require('../models/purchase');

router.get('/test/referral',(req,res) => {
  if(typeof(req.query.token) === 'string' && req.query.token.trim().length > 0
    && req.query.token.trim() === process.env.TEST_KEY){
    
    // create entry in buy in web transaction
    BuyCodeInWeb.create({email: 'xerrance01@gmail.com'},(err,buyResult) => {
      if(!err && buyResult){
        GeneratedReferralCode.create({buyId: buyResult._id,leg: 'left',isAssign: true},(err,generatedResult) => {
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
  const data = {
    header: 'Upgrade Rank',
    title: ' We\'ve got your order!',
    body: 'Your order has been placed. We send a message to your email to continue your payment.'
  };
  res.render('dashboard/message',{data: data});
});

router.get('/test/buycode',(req,res) => {
  const id = typeof(req.query.id) === 'string' && req.query.id.trim().length > 3 ? req.query.id.trim() : false;
  const count = typeof(req.query.count) === 'string' && Number.isInteger(Number(req.query.count.trim())) ? Number(req.query.count.trim()) : 1;

  Account.findById(id,(err,account) => {
    if(!err && account){
      BuyCodeInAccount.create({accountId: id,quantity: count,totalUsdPrice: 0}).then(buyData => {
        Purchase.findById(account.purchaseId,(err,purchase) => {
          if(!err && purchase){
            purchase.referralCodes.push(buyData._id);
            purchase.save(err => {
              if(err){
                console.log('Error when updating purchase items in account');
              }
            });
          }
        });
        createBuyCodeInAccountPromise(buyData._id,id,count).then(r => {
          AccountReferralCode.findById(account.accountReferralCodeId,(err,accountReferralResult) => {
            if(!err && accountReferralResult){
              let write = '';
              for(i=0; i < r.length; i++){
                write += r[i] + ', '
                accountReferralResult.referralCodes.push(r[i]);
                accountReferralResult.unUsedReferralCodes.push(r[i]);
                accountReferralResult.unAssignCodes.push(r[i]);
              }
              
              // update and save accountReferralCodes
              accountReferralResult.save(err => {
                // update accountSummary
                UpdateAccountSummary(account);
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

  UpgradeHistory.deleteMany({},err => {
    if(!err){
      console.log('Upgrade History Collection Successfully Clear Data');
    }
  });

  Purchase.deleteMany({},err => {
    if(!err){
      console.log('Purchase Collection Successfully Clear Data');
    }
  });

  // Ranking.deleteMany({},err => {
  //   if(!err){
  //     console.log('Ranking Collection Successfully Clear Data');
  //   }
  // });

  res.write('Successfully Clear All Data');
  res.end();
});

router.get('/test/ranking',async (req,res) => {
  try{
    const r1 = await Ranking.create({
      gpuImagePath: 'dist/img/rank/rank01_Miner.png',
      gpuModel: 'Bitmain Antminer S17 (56Th)',
      gpuRelease: 'Apr 2019',
      hashRate: 56,
      hashRateStr: 'Th/s',
      power: 2520,
      noise: 82,
      algorithm: 'SHA-256',
      investment: 70,
      rankLevel: 1,
      incomePerDay: 0.59,
      rankName: 'Miner'
    });
    const r2 = await Ranking.create({
      gpuImagePath: 'dist/img/rank/rank02_AmateurMiner.png',
      gpuModel: 'Bitmain Antminer S17e (64Th)',
      gpuRelease: 'Nov 2019',
      hashRate: 64,
      hashRateStr: 'Th/s',
      power: 2880,
      noise: 80,
      algorithm: 'SHA-256',
      investment: 205.88,
      rankLevel: 2,
      incomePerDay: 1.78,
      rankName: 'Amateur Miner'
    });
    const r3 = await Ranking.create({
      gpuImagePath: 'dist/img/rank/rank03_AvidMiner.png',
      gpuModel: 'FusionSilicon X7 Miner',
      gpuRelease: 'Mar 2019',
      hashRate: 262,
      hashRateStr: 'Gh/s',
      power: 1420,
      noise: 72,
      algorithm: 'X11',
      investment: 411.76,
      rankLevel: 3,
      incomePerDay: 3.57,
      rankName: 'Avid Miner'
    });
    const r4 = await Ranking.create({
      gpuImagePath: 'dist/img/rank/rank04_SuperMiner.png',
      gpuModel: 'Innosilicon A9++ ZMaster',
      gpuRelease: 'May 2019',
      hashRate: 140,
      hashRateStr: 'ksol/s',
      power: 1550,
      noise: 75,
      algorithm: 'Equihash',
      investment: 617.65,
      rankLevel: 4,
      incomePerDay: 5.35,
      rankName: 'Super Miner'
    });
    const r5 = await Ranking.create({
      gpuImagePath: 'dist/img/rank/rank05_SupremeMiner.png',
      gpuModel: 'ASICminer 8 Nano S 58Th',
      gpuRelease: 'Dec 2019',
      hashRate: 58,
      hashRateStr: 'Th/s',
      power: 2500,
      noise: 47,
      algorithm: 'SHA-256',
      investment: 823.53,
      rankLevel: 5,
      incomePerDay: 7.14,
      rankName: 'Supreme Miner'
    });
    const r6 = await Ranking.create({
      gpuImagePath: 'dist/img/rank/rank06_AwesomeMiner.png',
      gpuModel: 'Innosilicon T3+ 52T',
      gpuRelease: 'May 2019',
      hashRate: 52,
      hashRateStr: 'Th/s',
      power: 2800,
      noise: 75,
      algorithm: 'SHA-256',
      investment: 1029.41,
      rankLevel: 6,
      incomePerDay: 8.92,
      rankName: 'Awesome Miner'
    });
    const r7 = await Ranking.create({
      gpuImagePath: 'dist/img/rank/rank07_ExperiencedMiner.png',
      gpuModel: 'Bitmain Antminer Z11',
      gpuRelease: 'Apr 2019',
      hashRate: 135,
      hashRateStr: 'ksol/s',
      power: 1418,
      noise: 70,
      algorithm: 'Equihash',
      investment: 1235.29,
      rankLevel: 7,
      incomePerDay: 10.71,
      rankName: 'Experienced Miner'
    });
    const r8 = await Ranking.create({
      gpuImagePath: 'dist/img/rank/rank08_CoolMiner.png',
      gpuModel: 'Bitmain Antminer S17 Pro (50Th)',
      gpuRelease: 'Apr 2019',
      hashRate: 50,
      hashRateStr: 'Th/s',
      power: 1975,
      noise: 82,
      algorithm: 'SHA-256',
      investment: 1372.55,
      rankLevel: 8,
      incomePerDay: 11.90,
      rankName: 'Cool Miner'
    });
    const r9 = await Ranking.create({
      gpuImagePath: 'dist/img/rank/rank09_EpicMiner.png',
      gpuModel: 'Bitmain Antminer S17 Pro (53Th)',
      gpuRelease: 'Apr 2019',
      hashRate: 53,
      hashRateStr: 'Th/s',
      power: 2094,
      noise: 82,
      algorithm: 'SHA-256',
      investment: 1578.43,
      rankLevel: 9,
      incomePerDay: 13.68,
      rankName: 'Epic Miner'
    });
    const r10 = await Ranking.create({
      gpuImagePath: 'dist/img/rank/rank10_PowerMiner.png',
      gpuModel: 'Bitmain Antminer B7 (96Kh)',
      gpuRelease: 'Mar 2019',
      hashRate: 96,
      hashRateStr: 'kh/s',
      power: 528,
      noise: 65,
      algorithm: 'Tensority',
      investment: 1784.31,
      rankLevel: 10,
      incomePerDay: 15.46,
      rankName: 'Powerful Miner'
    });
    const r11 = await Ranking.create({
      gpuImagePath: 'dist/img/rank/rank11_EmpressiveMiner.png',
      gpuModel: 'Bitmain Antminer S17+ (73Th)',
      gpuRelease: 'Dec 2019',
      hashRate: 73,
      hashRateStr: 'Th/s',
      power: 2920,
      noise: 75,
      algorithm: 'SHA-256',
      investment: 1990.20,
      rankLevel: 11,
      incomePerDay: 17.25,
      rankName: 'Impressive Miner'
    });
    const r12 = await Ranking.create({
      gpuImagePath: 'dist/img/rank/rank12_SkilledMiner.png',
      gpuModel: 'StrongU STU-U6',
      gpuRelease: 'Nov 2019',
      hashRate: 440,
      hashRateStr: 'Gh/s',
      power: 2200,
      noise: 76,
      algorithm: 'X11',
      investment: 3980.39,
      rankLevel: 12,
      incomePerDay: 34.50,
      rankName: 'Skilled Miner'
    });
    const r13 = await Ranking.create({
      gpuImagePath: 'dist/img/rank/rank13_OutrageosMiner.png',
      gpuModel: 'MicroBT Whatsminer M30S',
      gpuRelease: 'Apr 2020',
      hashRate: 86,
      hashRateStr: 'Th/s',
      power: 3268,
      noise: 72,
      algorithm: 'SHA-256',
      investment: 5901.96,
      rankLevel: 13,
      incomePerDay: 51.15,
      rankName: 'Outrageous Miner'
    });
    const r14 = await Ranking.create({
      gpuImagePath: 'dist/img/rank/rank14_LegendaryMiner.png',
      gpuModel: 'Innosilicon A10 ETHMaster (365Mh)',
      gpuRelease: 'Sep 2018',
      hashRate: 365,
      hashRateStr: 'Mh/s',
      power: 650,
      noise: 75,
      algorithm: 'EtHash',
      investment: 7892.16,
      rankLevel: 14,
      incomePerDay: 68.40,
      rankName: 'Legendary Miner'
    });
    const r15 = await Ranking.create({
      gpuImagePath: 'dist/img/rank/rank15_GodlyMiner.png',
      gpuModel: 'Innosilicon A10 ETHMaster (432Mh)',
      gpuRelease: 'Sep 2018',
      hashRate: 432,
      hashRateStr: 'Mh/s',
      power: 740,
      noise: 75,
      algorithm: 'EtHash',
      investment: 9813.73,
      rankLevel: 15,
      incomePerDay: 85.05,
      rankName: 'Godly Miner'
    });
    const r16 = await Ranking.create({
      gpuImagePath: 'dist/img/rank/rank16_UnrealMiner.png',
      gpuModel: 'Innosilicon A10 ETHMaster (485Mh)',
      gpuRelease: 'Sep 2018',
      hashRate: 485,
      hashRateStr: 'Mh/s',
      power: 850,
      noise: 75,
      algorithm: 'EtHash',
      investment: 11803.92,
      rankLevel: 16,
      incomePerDay: 102.30,
      rankName: 'Unreal Miner'
    });
    const r17 = await Ranking.create({
      gpuImagePath: 'dist/img/rank/rank17_InsaneMiner.png',
      gpuModel: 'Bitmain Antminer S19 (95Th)',
      gpuRelease: 'May 2020',
      hashRate: 95,
      hashRateStr: 'Mh/s',
      power: 3250,
      noise: 75,
      algorithm: 'SHA-256',
      investment: 13725.49,
      rankLevel: 17,
      incomePerDay: 118.95,
      rankName: 'Insane Miner'
    });
    const r18 = await Ranking.create({
      gpuImagePath: 'dist/img/rank/rank18_MythicalMiner.png',
      gpuModel: 'Innosilicon A10 ETHMaster (500Mh)',
      gpuRelease: 'Sep 2019',
      hashRate: 500,
      hashRateStr: 'Mh/s',
      power: 750,
      noise: 75,
      algorithm: 'EtHash',
      investment: 15715.69,
      rankLevel: 18,
      incomePerDay: 136.20,
      rankName: 'Mythical Miner'
    });
    const r19 = await Ranking.create({
      gpuImagePath: 'dist/img/rank/rank19_247Miner.png',
      gpuModel: 'Bitmain Antminer S19 Pro (110Th)',
      gpuRelease: 'May 2020',
      hashRate: 110,
      hashRateStr: 'Th/s',
      power: 3250,
      noise: 75,
      algorithm: 'SHA-256',
      investment: 17705.88,
      rankLevel: 19,
      incomePerDay: 153.45,
      rankName: '24/7 Miner'
    });
    const r20 = await Ranking.create({
      gpuImagePath: 'dist/img/rank/rank20_ChamionMiner.png',
      gpuModel: 'Bitmain Antminer K5 (1130Gh)',
      gpuRelease: 'Apr 2020',
      hashRate: 1.13,
      hashRateStr: 'Th/s',
      power: 1580,
      noise: 72,
      algorithm: 'Eaglesong',
      investment: 19627.45,
      rankLevel: 20,
      incomePerDay: 170.10,
      rankName: 'Champion'
    });
    console.log("Success")
  } catch(err){
    console.log(err);
  }
});

router.get('/test/forcemining',(req,res) => {
  MiningCycle(true);
  res.write('success');
  res.end();
});

router.get('/test/upgrade',(req,res) => {
  const level = typeof(req.query.level) == 'string' && Number.isInteger(Number(req.query.level.trim())) ? Number(req.query.level.trim()): 1;
  const account = typeof(req.query.account) == 'string' ? req.query.account.trim() : false;

  if(account){
    Account.findById(account,(err,accountData) => {
      if(!err && accountData){
        Ranking.findById(accountData.miningPower,(err,ranking) => {
          if(!err && ranking){
            if(ranking.rankLevel >= level){
              res.write('Can\'t set downgrade ranking level');
              res.end();
            } else {
              Ranking.findOne({rankLevel: level},(err,rankingFound) => {
                if(!err && rankingFound){
                  UpgradeHistory.create({prevRank: ranking._id,upgradedRank: rankingFound._id},(err,upgradeCreated) => {
                    if(!err && upgradeCreated){
                      MiningEngine.findById(accountData.miningEngineId,(err,miningEngineData) => {
                        if(!err && miningEngineData){
                          if(miningEngineData.upgradeHistory){
                            miningEngineData.upgradeHistory.push(upgradeCreated._id);
                          } else {
                            miningEngineData.upgradeHistory = [upgradeCreated._id];
                          }
                          miningEngineData.save(err => {
                            if(err){
                              console.log('Error when upgrading mining power');
                            }
                          });
                        } else {
                          console.log('Error when finding mining engine');
                        }
                      });
                    } else {
                      console.log('Error when creating upgrade history');
                    }
                  });
                  accountData.miningPower = rankingFound._id;
                  accountData.save(err => {
                    if(err){
                      console.log('Error when upgrading mining power');
                    }
                  });
                  res.write('Success');
                  res.end();
                } else {
                  res.write('Invalid ranking level specified');
                  res.end();
                }
              });
            }
          } else {
            res.write('Internal error happens');
            res.end();
          }
        });
      } else {
        res.write('Invalid account');
        res.end();
      }
    });
  } else {
    res.write('Invalid account');
    res.end();
  }
});

module.exports = router;