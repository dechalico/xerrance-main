const user = require('./models/users');
const registrationToken = require('./models/registrationToken');

const test = {}

test.init = () => {
  user.create({
    firstname: "dexter",
    lastname: "echalico",
    address: "Davao City",
    email: "admin@gmail.com"
  },(err) => {
    console.log(err);
  });
};

test.clear = () => {
  user.deleteMany({},(err) => {
    if(!err){
      test.init();
    }
  });
  registrationToken.deleteMany({},(err) => {
    console.log(err);
  });
  
};

module.exports = test;