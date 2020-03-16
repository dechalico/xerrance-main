const express = require('express');
const path = require('path');

const server = {};

server.app = express();

server.load = () => {
  server.app.use(express.static(path.join(__dirname,"public")));
  server.app.set("view engine","ejs");

  server.app.get('*',(req,res) => {
    res.render('index',{dateEnd: new Date(2020,5,16), currentDate: new Date()});
  });

  // starting the server to listen
  server.app.listen(3000,(err) => {
    if(!err){
      console.log('Server running');
    } else {
      console.log(err);
    }
  });
}

server.load();

module.exports = server;