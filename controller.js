var path = require('path');
var express = require('express');
var router = express.Router();

module.exports.index =  function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
};

module.exports.login = function (req, res) {
  res.sendFile(path.join(__dirname, 'login.html'));
};

module.exports.sign = function (req, res) {
  res.sendFile(path.join(__dirname, 'sign.html'));
};
