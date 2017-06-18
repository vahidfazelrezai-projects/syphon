var express = require('express');
var bodyParser = require('body-parser');
var controllers = require('./controllers');
var app = express();
var PORT = process.env.PORT || 8000;
var FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || require('./tokens').FB_VERIFY_TOKEN;
var SLACK_VERIFY_TOKEN = process.env.SLACK_VERIFY_TOKEN || require('./tokens').SLACK_VERIFY_TOKEN;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.post('/slack_command', function (req, res) {
  if (req.body.token == SLACK_VERIFY_TOKEN) {
    res.send(controllers.slack_command(req.body));
  }
});

app.post('/slack_webhook', function (req, res) {
  if (req.body.token == SLACK_VERIFY_TOKEN) {
    if (req.body.challenge) {
      res.send(req.body.challenge);
    } else {
      controllers.slack_receive(req.body);
    }
  }
})

app.get('/messenger_webhook', function (req, res) {
	if (req.query['hub.verify_token'] === FB_VERIFY_TOKEN) {
		res.send(req.query['hub.challenge'])
	} else {
    res.send('Error, wrong token')
  }
});

app.post('/messenger_webhook', function (req, res) {
  var messaging_events = req.body.entry[0].messaging;
  for (var i = 0; i < messaging_events.length; i++) {
    var event = messaging_events[i];
    if (event.message && event.message.text) {
      controllers.messenger_receive(event);
    }
  }
  res.sendStatus(200);
});

app.listen(PORT, function() {
  console.log("running at port " + PORT);
});
