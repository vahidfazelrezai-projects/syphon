var randtoken = require('rand-token');
var request = require('request');
var storage = require('./storage');
var utils = require('./utils');
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
      storage.set('event-ts', body.event.ts, true);
      utils.slack_get_info(body, function (source, direct) {
        var message = source + ' ' + body.event.text;
        body.authed_users.forEach(function (sid) {
          if (sid != body.event.user) {
            if (direct || body.event.text.indexOf('<@' + sid + '>') >= 0) {
              storage.get('sid-to-mid', sid, function (err, mid) {
                // TODO: replace mentions <> with name
                // TODO detect @here and @channel mentions
                utils.messenger_send(mid, message);
              });
            }
          }
        });
      })
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
        utils.messenger_send(mid, 'Awesome! You\'re all set up :)');
      } else {
        utils.messenger_send(mid, 'Invalid token--try a new one!');
      }
    });
  } else {
    utils.messenger_send(mid, 'Hello friend!');
  }
}

module.exports = {
  'slack_command': slack_command,
  'slack_receive': slack_receive,
  'messenger_receive': messenger_receive
};
