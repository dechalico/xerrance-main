const mongoose = require('mongoose');

// mining engine, store of all mines history
const miningEngine = new mongoose.Schema({
  mining:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'mining'
    }
  ],
  upgradeHistory:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'upgradeHistory'
    }
  ],
  currentGrossIncome:{
    type: Number,
    default: 0
  },
  dateCreated: {
    type: Date,
    default: Date.now
  },
  dateLastUpdated: Date
});

module.exports = mongoose.model('miningEngine',miningEngine);