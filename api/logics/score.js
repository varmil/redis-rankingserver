module.exports = {

  // rankingListを整形する: [{ name, score, rank }, { name, score, rank }]
  prettyRankingList: function(rankingList, startRank) {
    var result = [], i = 0;
    _.each(rankingList, function(value, key){
      if (key % 2 !== 0) return;

      result.push({ name: rankingList[key], score: rankingList[key + 1], rank: (startRank + 1) + i }); // rankは1originに
      i++;
    });

    return result;
  }

};