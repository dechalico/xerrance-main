const mongoose = require('mongoose');

const upgradeHistory = new mongoose.Schema({
  dateUpgraded: {
    type: Date,
    default: Date.now
  },
  prevRank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ranking'
  },
  upgradedRank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ranking'
  }
});

module.exports = mongoose.model('upgradeHistory',upgradeHistory);