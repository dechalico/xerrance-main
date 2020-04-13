const mongoose = require('mongoose');

const ranking = new mongoose.Schema({
  gpuImagePath: String,
  gpuModel: String,
  gpuRelease: String,
  hashRate: Number,
  hashRateStr: String,
  power: Number,
  noise: Number,
  algorithm: String,
  investment: Number,
  rankLevel: Number,
  incomePerDay: Number,
  rankName: String
});

module.exports=  mongoose.model('ranking',ranking);