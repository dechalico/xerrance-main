// declare dependencies
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

// creating user model
const user = new mongoose.Schema({
  firstname: String,
  initial: String,
  lastname: String,
  address: String,
  email: String,
  password: String,
  isValidated: {
    type: Boolean,
    default: false
  },
  dateAdded: {
    type: Date,
    default: Date.now
  }
});

user.plugin(passportLocalMongoose);

module.exports = mongoose.model("user",user);