// share.js — 破關分享。只打開玩家自己的分享選單或 X 發文頁，不會替任何人發文。
(function () {
  var CLEAR = {
    text: '🗼 我點亮了 Glowbot 小光的 15 盞燈塔燈！🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡',
    url: 'https://jasper31943.github.io/glowbot/share-clear.html',
    hashtags: 'GlowbotGame,pixelart,indiegame'
  };
  function openX(d) {
    var u = 'https://x.com/intent/post?text=' + encodeURIComponent(d.text) +
      '&url=' + encodeURIComponent(d.url) +
      (d.hashtags ? '&hashtags=' + encodeURIComponent(d.hashtags) : '');
    window.open(u, '_blank', 'noopener');
  }
  function share(d) {
    var touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (touch && navigator.share) {
      return navigator.share({ title: 'Glowbot 小光', text: d.text, url: d.url })
        .catch(function (e) { if (e && e.name !== 'AbortError') openX(d); });
    }
    openX(d);
    return Promise.resolve();
  }
  // 必須在使用者點擊的事件裡呼叫（瀏覽器規定）。
  window.Share = { clear: function () { return share(CLEAR); } };
})();
