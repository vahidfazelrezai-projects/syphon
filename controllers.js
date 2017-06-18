var randtoken = require('rand-token');
var request = require('request');
var storage = require('./storage');
var FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN || require('./tokens').FB_ACCESS_TOKEN;
var TOKEN_PREFIX = 'syphon_enable_';

var slack_command = function (command) {

  // ENABLE
  if (command.text == 'enable') {
    var token = TOKEN_PREFIX + randtoken.generate(12);
    var sid = command.user_id;
    storage.set('token-to-sid', token, sid);
    return '\
In order to pair Slack with Messenger, please send "*' + token + '*" as a message using your Messenger account to this link:\n\
https://m.me/syphonbot';

  // DISABLE
  } else if (command.text == 'disable') {
    var sid = command.user_id;
    storage.get('sid-to-mid', command.user_id, function (err, mid) {
      storage.del('sid-to-mid', sid);
      storage.del('mid-to-sid', mid);
    });
    return '\
Your notification relaying has been disabled.';

  // HELP
  } else {
    return '\
Available commands:\n\
- "/syphon enable" --- activate notification relaying to Messenger\n\
- "/syphon disable" --- turn off notification relaying to Messenger\n';
  }
}

var slack_receive = function (body) {
  storage.get('event-ts', body.event.ts, function (err, ts) {
    if (!ts) {
      storage.set('event-ts', body.event.ts, true)
      storage.get('sid-to-mid', body.event.user, function (err, mid) {
        messenger_send(mid, body.event.text);
      });
    }
  })
}

var messenger_receive = function (event) {
  var token = event.message.text.trim();
  var mid = event.sender.id;
  if (token.substring(0, TOKEN_PREFIX.length) == TOKEN_PREFIX) {
    storage.get('token-to-sid', token, function (err, sid) {
      if (sid) {
        storage.set('mid-to-sid', mid, sid);
        storage.set('sid-to-mid', sid, mid);
        storage.del('token-to-sid', token);
        messenger_send(mid, 'Awesome! You\'re all set up :)');
      } else {
        messenger_send(mid, 'Invalid token--try a new one!');
      }
    });
  } else {
    messenger_send(mid, 'echo: ' + event.message.text);
  }
}

var messenger_send = function (userId, text) {
  var options = {
    uri: 'https://graph.facebook.com/v2.6/me/messages?access_token=' + FB_ACCESS_TOKEN,
    method: 'POST',
    json: {
      'recipient': {
        'id': userId
      },
      'message': {
        'text': text
      }
    }
  };
  request(options);
}

module.exports = {
  'slack_command': slack_command,
  'slack_receive': slack_receive,
  'messenger_receive': messenger_receive
};
