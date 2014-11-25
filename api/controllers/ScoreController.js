/**
 * ScoreController
 *
 * @description :: Server-side logic for managing scores
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var redisClient = require('redis').createClient();
var logicScore = require('../logics/score');

var KEY_RANKING = 'ranking';

redisClient.on('error', function (err) {
  console.log('Error ' + err);
});

module.exports = {

  /**
   * スコアを登録する
   */
  postScore: function (req, res) {
    var name = req.param('name');
    var score = req.body.score;

    redisClient.zadd(KEY_RANKING, score, name);

    return res.json({
      name: name,
      score: score
    });
  },

  /**
   * 指定された名前のScoreとRankを返す。
   */
  getScore: function (req, res) {
    var name = req.param('name');
    var rank, score;

    async.parallel([
      // Get Rank
      function(cb) {
        redisClient.zrevrank(KEY_RANKING, name, function(err, rank) {
          if (err) return cb(err);
          cb(null, rank + 1); // 0 origin To 1 origin
        });
      },
      // Get Score
      function(cb) {
        redisClient.zscore(KEY_RANKING, name, function(err, score) {
          if (err) return cb(err);
          cb(null, score);
        });
      }
    ], function(err, results) {
      if (err) {
        console.log(err);
        return res.json({ error: err });
      }

      rank = results[0];
      score = results[1];

      if (!rank || !score) {
        // TODO スコアが存在しない
        console.log('No Score :', name);
      }

      return res.json({
        rank: rank,
        score: score
      });
    });
  },

  /**
   * 指定の範囲のランキングリストを取る（0 origin）
   * /score/range/0/0 だと全リストを取得
   * TODO ランクを返す。 { name, score, rank } の配列という感じ。
   */
  getScoreRange: function (req, res) {
    var start = parseInt(req.param('start'), 10);
    var num = parseInt(req.param('num'), 10);

    redisClient.zrevrange(KEY_RANKING, start, start + num - 1, 'withscores', function(err, rankingList) {
      if (err) {
        console.log(err);
        return res.json({ error: err });
      }

      if (!rankingList) {
        // TODO スコアが存在しない
        console.log('No Score :', start, num);
      }

      // rankingListを整形する(Rank To 1 origin)
      var result = logicScore.prettyRankingList(rankingList, start);

      return res.json({
        rankingList: result
      });
    });
  },

  /**
   * 名前を元に、相対ランキングを取る
   * TODO ランクを返す。 { name, score, rank } の配列という感じ。
   */
  getScoreRangeByName: function (req, res) {
    var name = req.param('name');
    var higher = parseInt(req.param('higher'), 10); // 自分より上位のランクをいくつ取るか
    var lower = parseInt(req.param('lower'), 10); // 自分より下位のランクをいくつ取るか

    var start; // zrevrangeとrankingListの整形に用いる

    // 該当ユーザーのランクを取得後、その周辺のランキングを習得
    async.waterfall([
      function(cb) {
        redisClient.zrevrank(KEY_RANKING, name, function(err, rank) {
          if (err) return cb(err);
          cb(null, rank);
        });
      },
      function(rank, cb) {
        if (rank === null) {
          rank = 0; // rankが取れなかった場合は取り敢えず０から
        }
        start = rank - higher;
        var end = rank + lower;
        if (start < 0) start = 0; // オフセットが不正なときは修正
        redisClient.zrevrange(KEY_RANKING, start, end, 'withscores', function(err, rankingList) {
          if (err) return cb(err);
          cb(null, rank, rankingList);
        });
      }
    ], function(err, rank, rankingList) {
      if (err) {
        console.log(err);
        return res.json({ error: err });
      }

      if (!rankingList) {
        // TODO スコアが存在しない
        console.log('No Score :', name, higher, lower);
      }

      // rankingListを整形する(Rank To 1 origin)
      var result = logicScore.prettyRankingList(rankingList, start);

      return res.json({
        rankingList: result
      });
    });
  },
};