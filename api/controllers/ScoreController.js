/**
 * ScoreController
 *
 * @description :: Server-side logic for managing scores
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var async = require('async');
var redisClient = require('redis').createClient();

var KEY_RANKING = 'ranking';

redisClient.on('error', function (err) {
  console.log('Error ' + err);
});

module.exports = {

  /**
   *
   */
  postScore: function (req, res) {
    var name = req.body.name;
    var score = req.body.score;

    redisClient.zadd(KEY_RANKING, score, name);

    return res.json({
      todo: 'postScore() is not implemented yet!',
      name: name,
      score: score
    });
  },

  /**
   * nameのScoreとRankを返す
   */
  getScore: function (req, res) {
    var name = req.param('name');
    var rank, score;

    async.parallel([
      function(cb) {
        redisClient.zrevrank(KEY_RANKING, name, function(err, reply) {
          if (err) return console.log(err);
          var rank = reply + 1; // 0 origin
          cb(null, rank); // rank
        });
      },
      function(cb) {
        redisClient.zscore(KEY_RANKING, name, function(err, reply) {
          if (err) return console.log(err);
          cb(null, reply); // score
        });
      }
    ], function(err, results) {
      rank = results[0];
      score = results[1];

      if (!rank || !score) {
        // TODO スコアが存在しない
        console.log('No Score :', name);
      }

      return res.json({
        todo: 'getScore() is not implemented yet!',
        rank: rank,
        score: score
      });
    });
  },

  /**
   * 0 origin
   */
  getScoreRange: function (req, res) {
    var start = req.param('start');
    var num = req.param('num');

    var sortedSet;
    redisClient.zrevrange(KEY_RANKING, start, start + num - 1, 'withscores', function(err, reply) {
      if (err) return console.log(err);
      sortedSet = reply;

      if (!sortedSet) {
        // TODO スコアが存在しない
        console.log('No Score :', start, num);
      }

      return res.json({
        todo: 'getScoreRange() is not implemented yet!',
        sortedSet: sortedSet
      });
    });
  },

  /**
   * TODO
   */
  getScoreRangeName: function (req, res) {
    var name = req.param('name');
    var offset = req.param('offset');
    var num = req.param('num');

    // zrevrank(name) -> zrevrange(resRank + offset, num)

    return res.json({
      todo: 'getScoreRangeMe() is not implemented yet!',
      offset: offset,
      num: num
    });
  },

};

