var path = require('path');
var express = require('express');
var app = express();

// below has following behavior locally vs production.
// local: /css/cts_stress_styles.css, server: /stress/css/cts_stress_styles.css
app.use(express.static('public'));

// will adding /stress to app.use fix this? or will it
// make the production url /stress/stress/css/cts_stress_styles.css
// app.use('/stress', express.static('public'));

app.get('/', function (req, res) {
  // res.send('Hello World!');
  res.sendFile(path.join(__dirname + '/cts_stress_page.html'));
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
