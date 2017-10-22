var express = require('express');
var path = require('path');
var app = express();
var route = require('./route');

app.use('/public', express.static(path.join(__dirname, 'public')));

app.use('/', route);

app.listen(3000, function () {
  console.log('Running on port 3000');
})
