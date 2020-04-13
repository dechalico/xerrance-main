const Account = require('../../models/account');
const Mining = require('../../models/mining');
const MiningEngine = require('../../models/miningEngine');
const Ranking = require('../../models/ranking');
const AccountSummary = require('../../models/accountSummary');

module.exports = async function(isForce){
  try{
    const accounts = await Account.find({});
    if(accounts){
      for(let i = 0; i < accounts.length; i++){
        checkMining(accounts[i],isForce);
      }
    }
  } catch(err){
    console.log(err);
  }
}

function checkMining(account,isForce){
  // find the mining engine of the account
  MiningEngine.findById(account.miningEngineId,(err,miningEngine) => {
    if(!err && miningEngine){
      if(miningEngine.dateLastUpdated){
        if(isForce){
          // force to create mining earnings
          createMining(miningEngine,account.miningPower,account.accountSummaryId);
        } else {
          const currentDate = new Date();
          const dateLastUpdated = new Date(miningEngine.dateLastUpdated);

          // previous date
          const prevDate = new Date(currentDate.getTime);
          prevDate.setDate(prevDate.getDate() -1);

          if(dateLastUpdated.getTime() <= prevDate.getTime()){
            // if last update Date is less than 1 day behind then create mining
            createMining(miningEngine,account.miningPower,account.accountSummaryId);
          }
        }
      } else {
        // force to create mining earnings
        createMining(miningEngine,account.miningPower,account.accountSummaryId);
      }
    }
  });
}

function createMining(miningEngine,miningPowerId,accountSummaryId){
  Ranking.findById(miningPowerId,(err,rank) => {
    if(!err && rank){
      const currentMiningGrossIncome = miningEngine.currentGrossIncome + rank.incomePerDay;
      const miningData = {
        miningIncome: rank.incomePerDay,
        rank: rank.rankName,
        power: rank.hashRate + ' ' + rank.hashRateStr,
        grossIncome: currentMiningGrossIncome
      }
      Mining.create(miningData,(err,mining) => {
        if(!err && mining){
          // save and update Mining engine and push new created mining
          miningEngine.currentGrossIncome = currentMiningGrossIncome;
          miningEngine.dateLastUpdated = Date.now();
          miningEngine.mining.push(mining._id);
          miningEngine.save(err => {
            if(err){
              console.log('Error when updating Mining Engine');
            }
          });

          // update Account summary
          AccountSummary.findById(accountSummaryId,(err,summary) => {
            if(!err && summary){
              summary.miningIncome = currentMiningGrossIncome;
              summary.grossIncome = summary.referralCommission + summary.miningIncome + 
                summary.pairingCommission + summary.networkBonus;
              // save and update account summary
              summary.save(err => {
                if(err){
                  console.log('Error when update accountSummary');
                }
              });
            }
          });
        } else {
          console.log(err);
        }
      });
    }
  });
}
