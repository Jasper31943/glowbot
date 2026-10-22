// share.js — 破關分享。只打開玩家自己的分享選單或 X 發文頁，不會替任何人發文。
// 手機／平板：系統分享選單（navigator.share）。電腦：把分享文字＋連結複製到剪貼簿，並在新分頁打開 X 發文頁。
// 每條路都會在畫面上顯示提示，讓玩家知道按鈕有反應。
(function () {
  var CLEAR = {
    text: '🗼 我點亮了 Glowbot 小光的 15 盞燈塔燈！🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡',
    url: 'https://jasper31943.github.io/glowbot/share-clear.html',
    hashtags: 'GlowbotGame,pixelart,indiegame'
  };
  var GAME_URL = 'https://jasper31943.github.io/glowbot/';
  var box = null, timer = 0;
  // 畫面下方的提示框（蓋在結尾畫布 z-index 1000 之上）。manual=true 時顯示可選取的文字，讓玩家自己複製。
  function toast(msg, manual) {
    if (!box) {
      box = document.createElement('div');
      box.id = 'sharetoast';
      box.setAttribute('role', 'status');
      box.style.cssText = 'position:fixed;left:50%;bottom:18%;transform:translateX(-50%);z-index:2000;max-width:88vw;' +
        'background:#1a1c2c;color:#f4f4f4;border:3px solid #41a6f6;padding:10px 16px;font:16px/1.5 Cubic11,monospace,sans-serif;' +
        'text-align:center;white-space:pre-line;box-shadow:0 4px 0 #000;pointer-events:none';
      document.body.appendChild(box);
    }
    box.textContent = msg;
    box.style.pointerEvents = 'none';
    if (manual) {
      var t = document.createElement('textarea');
      t.readOnly = true; t.value = manual; t.rows = 3;
      t.style.cssText = 'display:block;width:70vw;max-width:420px;margin:8px auto 0;font:14px/1.4 monospace;background:#f4f4f4;color:#1a1c2c;border:0;padding:6px;resize:none;user-select:text;-webkit-user-select:text';
      box.appendChild(t); box.style.pointerEvents = 'auto';
      t.addEventListener('click', function (e) { e.stopPropagation(); t.select(); });
      setTimeout(function () { try { t.focus(); t.select(); } catch (e) {} }, 0);
    }
    box.style.display = 'block';
    clearTimeout(timer);
    timer = setTimeout(function () { box.style.display = 'none'; }, manual ? 12000 : 3500);
  }
  // 同步複製（要在點擊當下呼叫，所有電腦瀏覽器都支援）
  function copySync(s) {
    var t = document.createElement('textarea'), ok = false;
    t.value = s; t.setAttribute('readonly', '');
    t.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(t); t.select();
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(t);
    return ok;
  }
  function copyAsync(s) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(s);
    return Promise.reject(new Error('no clipboard'));
  }
  function fullText(d) { return d.text + '\n' + GAME_URL; }
  function openX(d) {
    var u = 'https://x.com/intent/post?text=' + encodeURIComponent(d.text) +
      '&url=' + encodeURIComponent(d.url) +
      (d.hashtags ? '&hashtags=' + encodeURIComponent(d.hashtags) : '');
    var w = null;
    try { w = window.open(u, '_blank'); if (w) w.opener = null; } catch (e) { w = null; }
    return !!w;
  }
  // 電腦：先複製（趁還在點擊事件裡），再開 X 發文頁。
  function desktop(d) {
    var s = fullText(d), copied = copySync(s), opened = openX(d);
    function done(c) {
      if (c && opened) toast('已複製連結\nX 發文頁已在新分頁打開');
      else if (c) toast('已複製連結\n貼到任何地方就能分享');
      else if (opened) toast('X 發文頁已在新分頁打開\n也可以複製下面的文字分享', s);
      else toast('複製下面的文字就能分享', s);
    }
    if (copied) { done(true); return Promise.resolve(); }
    return copyAsync(s).then(function () { done(true); }, function () { done(false); });
  }
  // 系統分享失敗（不是玩家自己取消）時：複製連結＋提示。
  function afterShareFail(d) {
    var s = fullText(d);
    return copyAsync(s).then(function () { toast('已複製連結\n貼到任何地方就能分享'); },
      function () { toast('複製下面的文字就能分享', s); });
  }
  function share(d) {
    var touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    var data = { title: 'Glowbot 小光', text: d.text, url: d.url };
    if (touch && navigator.share && (!navigator.canShare || navigator.canShare(data))) {
      var p;
      try { p = navigator.share(data); } catch (e) { return afterShareFail(d); }
      return Promise.resolve(p).catch(function (e) {
        if (e && e.name === 'AbortError') return; // 玩家自己關掉分享選單：什麼都不做
        return afterShareFail(d);
      });
    }
    return desktop(d);
  }
  // 必須在使用者點擊的事件裡呼叫（瀏覽器規定）。
  window.Share = { clear: function () { return share(CLEAR); }, _toast: toast };
})();
