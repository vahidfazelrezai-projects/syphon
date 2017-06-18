var redis = require("redis");
var SEPARATOR = '###'
client = redis.createClient(process.env.REDIS_URL);

var set = function (table, key, value, callback) {
  if (!callback) { callback = function () {} }
  var full_key = table + SEPARATOR + key;
  client.set(full_key, value, function (err, res) {
    callback(err, res);
  });
}

var get = function (table, key, callback) {
  if (!callback) { callback = function () {} }
  var full_key = table + SEPARATOR + key;
  client.get(full_key, function (err, res) {
    callback(err, res);
  });
}

var del = function (table, key, callback) {
  if (!callback) { callback = function () {} }
  var full_key = table + SEPARATOR + key;
  client.del(full_key, function (err, res) {
    callback(err, res);
  });
}

module.exports = {
  'set': set,
  'get': get,
  'del': del
}
