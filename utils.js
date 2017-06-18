var request = require('request');
var FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN || require('./tokens').FB_ACCESS_TOKEN;
var SLACK_ACCESS_TOKEN = process.env.SLACK_ACCESS_TOKEN || require('./tokens').SLACK_ACCESS_TOKEN;

var slack_get_user = function (sid, cb) {
  var options = {
    uri: 'https://slack.com/api/users.info',
    method: 'GET',
    qs: {
      'token': SLACK_ACCESS_TOKEN,
      'user': sid
    }
  };
  request(options).on('response', function (response) {
    raw = '';
    response.on('data', function (chunk) {
      raw += chunk;
    });
    response.on('end', function () {
      var data = JSON.parse(raw);
      var user = data.user.name;
      cb(user);
    })
  })
}

var slack_get_team = function (cb) {
  var options = {
    uri: 'https://slack.com/api/team.info',
    method: 'GET',
    qs: {
      'token': SLACK_ACCESS_TOKEN
    }
  };
  request(options).on('response', function (response) {
    raw = '';
    response.on('data', function (chunk) {
      raw += chunk;
    });
    response.on('end', function () {
      var data = JSON.parse(raw);
      var team = data.team.name;
      cb(team);
    })
  })
}

var try_channel = function (method, channel, cb) {
  var options = {
    uri: 'https://slack.com/api/' + method,
    method: 'GET',
    qs: {
      'token': SLACK_ACCESS_TOKEN,
      'channel': channel
    }
  };
  request(options).on('response', function (response) {
    raw = '';
    response.on('data', function (chunk) {
      raw += chunk;
    });
    response.on('end', function () {
      var data = JSON.parse(raw);
      cb(data);
    })
  })
}

var slack_get_info = function (body, cb) {
  slack_get_user(body.event.user, function (user) {
    slack_get_team(function (team) {
      try_channel('channels.info', body.event.channel, function (data) {
        if (data.ok == true) {
          cb('#️⃣ [' + team + '/#' + data.channel.name + '] @' + user + ':');
        }
      });
      try_channel('groups.info', body.event.channel, function (data) {
        if (data.ok == true) {
          cb('🔒 [' + team + '/' + data.group.name + '] @' + user + ':');
        }
      });
      // TODO: distinguish between MPIM and group
      try_channel('mpim.history', body.event.channel, function (data) {
        if (data.ok == true) {
          cb('👪 [' + team + '~MPIM] @' + user + ':');
        }
      });
      try_channel('im.history', body.event.channel, function (data) {
        if (data.ok == true) {
          cb('🗣 [' + team + '~DM] @' + user + ':');
        }
      });
    });
  });
}

var messenger_send = function (userId, text) {
  var options = {
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    method: 'POST',
    qs: {
      'access_token': FB_ACCESS_TOKEN
    },
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
  'slack_get_info': slack_get_info,
  'messenger_send': messenger_send
};
