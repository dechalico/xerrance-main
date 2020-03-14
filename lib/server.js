// declare dependencies
const express = require('express');
const mongoose = require('mongoose');
const env = require('dotenv').config();

const server = {};

server.app = express();

server._setup = () => {
  // mongoose configurations
  mongoose.connect("mongodb://" + process.env.DB_USER + ":" + process.env.DB_PASSWORD + "@" + 
    process.env.DB_HOST + ":" + process.env.DB_PORT + "/" + process.env.DB_NAME + 
    "?authSource=admin&w=1",{useNewUrlParser: true, useUnifiedTopology: true},(err) => {
      if(!err){
        console.log("Database Connected");
      } else {
        console.log(err);
      }
    });
  mongoose.set('useCreateIndex',true);

  // express configurations
  server.app.use(express.static(__dirname + "../public"));
  server.app.set("view engine","ejs");

  // starting the server to listen
  server.app.listen(process.env.PORT,(err) => {
    if(!err){
      console.log('Server running at port:',process.env.PORT);
    } else {
      console.log(err);
    }
  });
};

server.init = () => {
  server._setup();
};

module.exports = server;