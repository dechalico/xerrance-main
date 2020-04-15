const Account = require('../../../models/account');
const MiningEngine = require('../../../models/miningEngine');
const Ranking = require('../../../models/ranking');
const helper = require('../../helpers');

module.exports = function(accountId,limit,page,callback){
  // check if accountID is valid
  Account.findById(accountId,(err,account) => {
    if(!err && account){
      // account is valid, then get the needed informations
      const data = {
        totalMiningIncome: '0.00',
        rank: '',
        dailyIncome: '0.00',
        hashRate: '',
        power: '',
        algo: '',
        device: '',
        minings: [],
        purchases: [],
        withdrawals: []
      };
      // get account ranking information
      Ranking.findById(account.miningPower,(err,ranking) => {
        if(!err && ranking){
          // if ranking id is valid and have result data
          data.rank = ranking.rankName;
          data.dailyIncome = ranking.incomePerDay;
          data.hashRate = ranking.hashRate + " " + ranking.hashRateStr;
          data.power = ranking.power + " W";
          data.algo = ranking.algorithm;
          data.device = ranking.gpuModel;
        }
        // get the minings data and purchase upgrades history
        // options getting the data in minings
        const miningOptions = {
          path: 'mining',
          options:{
            limit: limit,
            sort: {_id:-1},
            skip: limit * (page - 1)
          }
        };
        const upgradeHistOption = {
          path: 'upgradeHistory',
          populate:[
            {path: 'upgradedRank'},
            {path: 'prevRank'}
          ]
        };
        MiningEngine.findById(account.miningEngineId).populate(miningOptions).populate(upgradeHistOption).exec((err,miningEngine) => {
          if(!err && miningEngine){
            data.minings = miningEngine.mining;
            data.purchases = miningEngine.upgradeHistory;
            data.totalMiningIncome = helper.formatDecimalToString(miningEngine.currentGrossIncome);
          }
          callback(true,data);
        });
      });
    } else {
      callback(false);
    }
  });
}
