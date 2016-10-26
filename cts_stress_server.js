var path = require('path');
var express = require('express');
var app = express();

app.use('/static', express.static('js'));
app.use('/static', express.static('css'));

app.get('/', function (req, res) {
  // res.send('Hello World!');
  res.sendFile(path.join(__dirname + '/cts_stress_page.html'));
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});