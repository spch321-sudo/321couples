/* 321夫妻成長營（繁／简／EN 三個頁面共用同一份）· 一起共讀適配器
   頁面＝這個 App 自己的導覽狀態；個人頁面（今天、我們、愛的存款、習慣、評估、溝通之手、立約書、珍珠、小家、設定、筆記、小智、美圖工作室…）回 null＝不同步。 */
(function () {
  var D = document;
  function $(id) { return D.getElementById(id); }
  function act(id) { var e = $(id); return !!(e && e.classList.contains('active')); }
  var NOSYNC = ['bankview', 'assessview', 'habitview', 'handview', 'covenantview', 'pearlsview', 'groupview'];
  var TABS = ['page-journey', 'page-learn', 'page-practice', 'page-grow', 'page-followup'];
  var OV = '#gxaov.on,#gxaxz.on,#gxaroot .gxpage.on,#gxaroot .gxz.on,#gxaroot #gxs.on,#gxaroot .gxsmain.on,.gxs-ov.on,.xz-mask.on,#xz-mask.on,.an-mask.on,.note-sheet.open,#hlsheet-mask,#gxbs,.rw-mask';
  function overlay() {
    try { if (D.querySelector(OV)) return true; } catch (e) { }
    try { if (D.documentElement.classList.contains('gxa-lock')) return true; } catch (e) { }
    return false;
  }
  function g(name) { try { return (0, eval)('typeof ' + name + '!=="undefined"?' + name + ':undefined'); } catch (e) { return undefined; } }
  function msgOpen(i) { var w = $('msg-wrap-' + i); return !!(w && w.classList.contains('on')); }
  function fupIndex() {
    var F = g('FOLLOWUPS'), t = $('fup-ttl'); if (!F || !t) return -1;
    for (var i = 0; i < F.length; i++) if (F[i].title === t.textContent) return i;
    return -1;
  }
  function page() {
    if (overlay()) return null;
    var i;
    if (act('detail')) { i = g('curTopic') || 0; return { t: 'topic', i: i, m: msgOpen(i) ? 1 : 0 }; }
    for (i = 0; i < NOSYNC.length; i++) if (act(NOSYNC[i])) return null;
    if (act('actionsview')) {
      var s = g('actionScreen') || 'list', p = { t: 'act', s: s };
      if (s !== 'list') p.a = g('curAction') || 0;
      if (s === 'guide') p.g = g('guideStep') || 0;
      return p;
    }
    if (act('prepview')) return { t: 'prep' };
    if (act('campview')) return { t: 'camp' };
    if (act('followupview')) { i = fupIndex(); return i < 0 ? null : { t: 'fup', i: i }; }
    for (i = 0; i < TABS.length; i++) if (act(TABS[i])) return { t: 'tab', id: TABS[i] };
    return null;
  }
  function stop() { try { if (window.msgStopAll) msgStopAll(); } catch (e) { } try { if (window.xzSpeakStop) xzSpeakStop(); } catch (e) { } try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { } }
  /* 底部分頁按鈕的點擊會把所有內頁（含跟進聚會頁）一併關掉；goTab 少關了 followupview */
  function base(id) { var b = D.querySelector('.tab[data-target="' + id + '"]'); if (b) b.click(); else goTab(id); }
  function go(p) {
    var t = p.t, i;
    if (t === 'tab') { base(p.id); return; }
    if (t === 'topic') {
      if (!act('detail') || g('curTopic') !== p.i) { base('page-learn'); openTopic(p.i); }
      if (!!p.m !== msgOpen(p.i)) { try { msgToggle(p.i); } catch (e) { } }
      return;
    }
    if (t === 'act') {
      if (!act('actionsview')) { base('page-practice'); openActions(); }
      if (p.s === 'detail') showAction(p.a);
      else if (p.s === 'guide') { guideStep = p.g || 0; showGuide(p.a); }
      else if (g('actionScreen') !== 'list') showActionsList();
      return;
    }
    if (t === 'prep') { base('page-journey'); openPrep(); return; }
    if (t === 'camp') { base('page-journey'); openCamp(); return; }
    if (t === 'fup') { base('page-followup'); openFollowup(p.i); return; }
  }
  function closeOverlay() {
    try { if (window.SAGE321 && SAGE321.close) SAGE321.close(); } catch (e) { }
    try { if (window.GXA && GXA.close) GXA.close(); } catch (e) { }
    try { if (window.closeNote) closeNote(); } catch (e) { }
    var m = D.querySelectorAll('.xz-mask.on,#xz-mask.on,.an-mask.on'), i; for (i = 0; i < m.length; i++) m[i].classList.remove('on');
    var h = $('hlsheet-mask'); if (h && h.parentNode) h.parentNode.removeChild(h);
  }
  /* 講章逐字稿的句子：用「第幾個 .sen」定位（繁／简／EN 句數不同時按比例對應） */
  function sens(ti) { var b = $('msg-body-' + ti); return b ? b.querySelectorAll('.sen') : []; }
  function markOf(el) {
    var b = el; while (b && b !== D && !(b.id && /^msg-body-\d+$/.test(b.id))) b = b.parentNode;
    if (!b || b === D) return null;
    var ti = +b.id.replace('msg-body-', ''), l = sens(ti), k = 0;
    for (var i = 0; i < l.length; i++) if (l[i] === el) { k = i; return { ti: ti, s: k, k: l.length }; }
    return null;
  }
  function findMark(mk) {
    var l = sens(mk.ti); if (!l.length) return null;
    if (l.length === mk.k) return l[Math.min(mk.s, l.length - 1)];
    return l[Math.min(l.length - 1, Math.round(mk.k > 1 ? mk.s / (mk.k - 1) * (l.length - 1) : 0))];
  }
  var lg = (D.documentElement.getAttribute('lang') || 'zh').toLowerCase();
  var LANG = /^en/.test(lg) ? 'en' : (/hans|cn/.test(lg) ? 'zs' : 'zh');
  window.CR_VER = window.APPVER || '1';
  window.CR_AD = {
    pfx: 'cp321-',
    names: { zh: '321夫妻成長營', zs: '321夫妻成长营', en: '321 Couples Growth Camp' },
    theme: { brand: '#B0345A', bg: '#FFFFFF', ink: '#2B2730', line: '#EDE3DC' },
    lang: function () { return LANG; },
    baseUrl: function () { return location.origin + location.pathname.replace(/[^\/]*$/, ''); },
    page: page, go: go, stop: stop, overlay: overlay, closeOverlay: closeOverlay,
    markOf: markOf, findMark: findMark,
    watchRoot: function () { return D.body; },
    mountTop: function (b) {
      var bar = D.querySelector('.brandbar'); if (!bar) return false;
      b.style.cssText = 'position:absolute;left:auto;right:122px;top:calc(env(safe-area-inset-top) + 6px);width:34px;height:34px;z-index:6';
      bar.appendChild(b); return true;
    }
  };
})();
/* ===== 一起共讀 · 共用核心（帶領者開房間／加入者跟隨） =====
   傳輸：peerjs.min.js（相容 PeerJS 介面的 Cloudflare 中繼站連線層）。
   只同步「畫面識別」：哪一頁、捲到幾成、哪一句；個人填寫的內容（心得、互動紀錄、設定）完全不傳。
   各 App 的差異放在 window.CR_AD（適配器）。ES5。 */
(function () {
  var AD = window.CR_AD; if (!AD) return;
  var PEER_JS = ['peerjs.min.js?v=' + (window.CR_VER || '1')];
  var QR_JS = ['https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js', 'https://unpkg.com/qrcode-generator@1.4.4/qrcode.js', 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'];
  var PFX = AD.pfx, SSK = 'cr321-' + PFX, FOLLOW_COOL = 8000;
  var TX = {
    zh: { title: '一起共讀', desc: '開一個共讀房間，把共讀碼或連結傳給弟兄姊妹。他們打開後，畫面會跟著你翻到同一頁、捲到同一個位置；你朗讀到哪一句，大家也一起亮起來。', priv: '只同步「翻到哪一頁」，你們填寫的內容（心得、互動紀錄、個人設定）完全不會傳出去。', host: '開共讀房間（我來帶領）', join: '加入', codePH: '輸入 6 位數共讀碼', orJoin: '或加入別人的共讀', code: '共讀碼', people: '已有 {0} 人加入', waiting: '等待弟兄姊妹加入…', invite: '傳送邀請', copyLink: '複製連結', copied: '已複製', end: '結束共讀', leave: '離開共讀', inviteMsg: '📡 一起來共讀《{2}》！\n點連結加入：{0}\n或打開 App 按上方「📡」輸入共讀碼：{1}', following: '跟著帶領共讀', paused: '你自己操作了 · 點這裡回到帶領處', connecting: '連線中…', hostChip: '共讀 {0} · {1} 人', ended: '共讀已結束', joined: '已加入共讀，畫面會跟著帶領者', loadErr: '共讀功能載入失敗，請確認網路後再試', badCode: '請輸入 6 位數共讀碼', notFound: '找不到這個共讀房間，請確認共讀碼，或請帶領者重新開房間', followOnly: '你正在跟著共讀', back2: '回到帶領處', close: '關閉', tip: '提示：帶領者的手機請保持 App 開著、螢幕不要關，大家才會一直同步。', qrTip: '用手機相機掃描加入', btn: '共讀', joinedOne: '有一位弟兄姊妹加入共讀', hostLeft: '帶領者暫時離線，正在重新連線…', elsewhere: '帶領者在個人頁面（不同步）', mine: '你在個人頁面 · 點這裡回到帶領處', onbFirst: '請先完成開頭設定，之後會自動跟上共讀', hostElse: '你在個人頁面，大家的畫面先不動' },
    zs: { title: '一起共读', desc: '开一个共读房间，把共读码或链接传给弟兄姊妹。他们打开后，画面会跟着你翻到同一页、滚到同一个位置；你朗读到哪一句，大家也一起亮起来。', priv: '只同步“翻到哪一页”，你们填写的内容（心得、互动记录、个人设置）完全不会传出去。', host: '开共读房间（我来带领）', join: '加入', codePH: '输入 6 位数共读码', orJoin: '或加入别人的共读', code: '共读码', people: '已有 {0} 人加入', waiting: '等待弟兄姊妹加入…', invite: '发送邀请', copyLink: '复制链接', copied: '已复制', end: '结束共读', leave: '离开共读', inviteMsg: '📡 一起来共读《{2}》！\n点链接加入：{0}\n或打开 App 按上方“📡”输入共读码：{1}', following: '跟着带领共读', paused: '你自己操作了 · 点这里回到带领处', connecting: '连线中…', hostChip: '共读 {0} · {1} 人', ended: '共读已结束', joined: '已加入共读，画面会跟着带领者', loadErr: '共读功能载入失败，请确认网络后再试', badCode: '请输入 6 位数共读码', notFound: '找不到这个共读房间，请确认共读码，或请带领者重新开房间', followOnly: '你正在跟着共读', back2: '回到带领处', close: '关闭', tip: '提示：带领者的手机请保持 App 开着、屏幕不要关，大家才会一直同步。', qrTip: '用手机相机扫描加入', btn: '共读', joinedOne: '有一位弟兄姊妹加入共读', hostLeft: '带领者暂时离线，正在重新连线…', elsewhere: '带领者在个人页面（不同步）', mine: '你在个人页面 · 点这里回到带领处', onbFirst: '请先完成开头设置，之后会自动跟上共读', hostElse: '你在个人页面，大家的画面先不动' },
    en: { title: 'Read together', desc: 'Open a room and send the room code or link to others. When they open it, their screens follow you to the same page and scroll position; as you read aloud, the sentence lights up for everyone.', priv: 'Only “which page you are on” is shared. What you write (notes, couple records, personal settings) is never sent.', host: 'Open a room (I’ll lead)', join: 'Join', codePH: 'Enter the 6-digit room code', orJoin: 'Or join someone else’s room', code: 'Room code', people: '{0} joined', waiting: 'Waiting for others to join…', invite: 'Send invite', copyLink: 'Copy link', copied: 'Copied', end: 'End session', leave: 'Leave', inviteMsg: '📡 Come read “{2}” together with me!\nTap to join: {0}\nOr open the app, tap “📡” at the top and enter code {1}', following: 'Following the leader', paused: 'You moved on your own · tap to return to the leader', connecting: 'Connecting…', hostChip: 'Room {0} · {1}', ended: 'Reading session ended', joined: 'Joined — your screen will follow the leader', loadErr: 'Could not load reading-together. Check your connection and try again.', badCode: 'Please enter the 6-digit room code', notFound: 'Room not found. Check the code, or ask the leader to open a new room.', followOnly: 'You are following', back2: 'Back to leader', close: 'Close', tip: 'Tip: the leader should keep the app open with the screen on so everyone stays in sync.', qrTip: 'Scan with a phone camera to join', btn: 'Together', joinedOne: 'Someone joined the room', hostLeft: 'The leader is offline for a moment — reconnecting…', elsewhere: 'Leader is on a personal page (not shared)', mine: 'You are on a personal page · tap to return to the leader', onbFirst: 'Finish the first-time setup and you will catch up automatically', hostElse: 'You are on a personal page; others stay where they are' }
  };
  function LG() { var l = 'zh'; try { l = AD.lang(); } catch (e) { } return TX[l] ? l : 'zh'; }
  function X(k) { var s = TX[LG()][k] || TX.zh[k] || k; for (var i = 1; i < arguments.length; i++) s = s.split('{' + (i - 1) + '}').join(arguments[i]); return s; }
  function NAME() { return (AD.names && AD.names[LG()]) || ''; }
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ss(k, v) { try { if (v === undefined) return JSON.parse(sessionStorage.getItem(k) || 'null'); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function now() { return new Date().getTime(); }

  /* ---------- 樣式 ---------- */
  var th = AD.theme || {};
  var css = '#crTop{border:0;cursor:pointer;font:inherit;font-size:17px;line-height:1;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.28);color:#fff;display:inline-flex;align-items:center;justify-content:center;padding:0;position:relative;-webkit-tap-highlight-color:transparent}' +
    '#crTop.on::after{content:"";position:absolute;right:3px;top:3px;width:9px;height:9px;border-radius:50%;background:#5BD38A;border:1.5px solid #fff}' +
    '.crchip{position:fixed;right:10px;bottom:calc(88px + env(safe-area-inset-bottom));z-index:9000;border:0;border-radius:999px;padding:8px 14px 8px 10px;font:inherit;font-size:14px;line-height:1.3;background:' + (th.brand || '#B0345A') + ';color:#fff;box-shadow:0 6px 18px rgba(0,0,0,.25);max-width:84vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}' +
    '.crchip .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#5BD38A;margin-right:6px;vertical-align:1px;animation:crp 1.6s infinite}' +
    '.crchip.wait .dot{background:#F2C14E}.crchip.off{background:#8A6800}.crchip.off .dot{background:#fff;animation:none}' +
    '@keyframes crp{0%,100%{opacity:1}50%{opacity:.35}}' +
    '.cr-pt{outline:3px solid #c9962b!important;outline-offset:2px;background:rgba(201,150,43,.18)!important;border-radius:6px;animation:crpt 1.2s ease-out 1}@keyframes crpt{0%{background:rgba(201,150,43,.5)}100%{background:rgba(201,150,43,.18)}}' +
    '#crmask{position:fixed;left:0;top:0;right:0;bottom:0;z-index:9500;background:rgba(0,0,0,.45);display:none}#crmask.on{display:block}' +
    '#crsheet{position:fixed;left:0;right:0;bottom:0;z-index:9600;background:' + (th.bg || '#fff') + ';color:' + (th.ink || '#2B2730') + ';border-radius:20px 20px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -8px 30px rgba(0,0,0,.25);max-height:88vh;overflow-y:auto;transform:translateY(105%);transition:transform .22s ease;max-width:560px;margin:0 auto;font-size:16px;line-height:1.6;text-align:left;font-weight:400}#crsheet.on{transform:none}' +
    '#crsheet .cr-h{font-size:1.2em;font-weight:800;text-align:center;margin-bottom:10px}' +
    '#crsheet .cr-k{font-size:.88em;color:#7a7280;text-align:center;margin-top:6px}#crsheet .cr-code{font-size:2.3em;font-weight:800;letter-spacing:.12em;text-align:center;color:' + (th.brand || '#B0345A') + ';margin:2px 0 8px;font-variant-numeric:tabular-nums}' +
    '#crsheet .cr-qr{display:flex;justify-content:center;margin:4px 0}#crsheet .cr-qr img{width:180px;height:180px;image-rendering:pixelated;background:#fff;border-radius:10px;padding:4px}' +
    '#crsheet .cr-count{text-align:center;font-weight:700;margin:10px 0 4px}#crsheet .cr-acts{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:8px}' +
    '#crsheet .cr-desc{margin-bottom:10px;line-height:1.7}#crsheet .cr-priv{font-size:.88em;color:#6b6470;background:rgba(0,0,0,.05);border-radius:10px;padding:8px 10px;margin:8px 0;line-height:1.6}#crsheet .cr-tip{font-size:.86em;color:#7a7280;margin-top:10px;line-height:1.6;text-align:center}' +
    '#crsheet .cr-join{display:flex;gap:8px;margin-top:6px}#crsheet .cr-join input{flex:1;min-width:0;font:inherit;font-size:1.15em;letter-spacing:.1em;padding:10px 12px;border:1px solid ' + (th.line || '#ddd') + ';border-radius:12px;background:#fff;color:#2B2730;text-align:center}' +
    '#crsheet button.crb{font:inherit;font-weight:700;border-radius:12px;border:1.5px solid ' + (th.brand || '#B0345A') + ';background:#fff;color:' + (th.brand || '#B0345A') + ';padding:10px 14px;cursor:pointer}#crsheet button.crb.pri{background:' + (th.brand || '#B0345A') + ';color:#fff}#crsheet button.crb.blk{display:block;width:100%;margin-top:6px}' +
    '#crtoast{position:fixed;left:50%;bottom:calc(100px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:9800;background:rgba(30,30,40,.92);color:#fff;border-radius:999px;padding:9px 16px;font-size:15px;line-height:1.4;max-width:86vw;opacity:0;pointer-events:none;transition:opacity .2s;text-align:center}#crtoast.on{opacity:1}' +
    '.crScr #crTop,.crScr .crchip{display:none!important}';
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);
  if (window.CR_SCREEN) document.documentElement.className += ' crScr';

  function toast(m) { var t = document.getElementById('crtoast'); if (!t) { t = document.createElement('div'); t.id = 'crtoast'; document.body.appendChild(t); } t.textContent = m; t.className = 'on'; clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = ''; }, 2600); }
  function copyText(txt, ok) {
    function fb() { try { var a = document.createElement('textarea'); a.value = txt; a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); document.execCommand('copy'); document.body.removeChild(a); if (ok) ok(); } catch (e) { } }
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok || function () { }, fb); else fb(); } catch (e) { fb(); }
  }
  function shareText(txt) { try { if (navigator.share) { navigator.share({ text: txt })['catch'](function () { }); return; } } catch (e) { } copyText(txt, function () { toast(X('copied')); }); }
  var loaded = {};
  function loadJs(urls, test, cb) {
    if (test()) { cb(true); return; } var i = 0;
    (function nx() {
      if (i >= urls.length) { cb(false); return; } var u = urls[i++];
      if (loaded[u]) { setTimeout(function () { cb(test()); }, 0); return; }
      var s = document.createElement('script'); s.src = u; s.async = true;
      s.onload = function () { loaded[u] = 1; if (test()) cb(true); else nx(); }; s.onerror = function () { nx(); };
      document.head.appendChild(s);
    })();
  }

  /* ---------- 狀態 ---------- */
  var C = { role: '', code: '', scr: 0, peer: null, conns: [], host: null, last: null, lastKey: '', retry: 0, rt: null, manualAt: 0, status: '', want: null, pkey: '', mk: null, appliedMk: '', settleUntil: 0 };
  function joinUrl(code) { return (AD.baseUrl ? AD.baseUrl() : location.origin + location.pathname.replace(/[^\/]*$/, '')) + '?join=' + code; }
  function newCode() { var c = ''; for (var i = 0; i < 6; i++) c += Math.floor(Math.random() * 10); return c.charAt(0) === '0' ? '1' + c.slice(1) : c; }
  function live() { var o = [], i; for (i = 0; i < C.conns.length; i++) if (C.conns[i].open) o.push(C.conns[i]); return o; }
  function pkeyOf(p) { try { return p ? JSON.stringify(p) : ''; } catch (e) { return ''; } }
  function ratio() { var mx = document.documentElement.scrollHeight - (window.innerHeight || 600); var y = window.pageYOffset || document.documentElement.scrollTop || 0; return mx > 0 ? Math.round(Math.max(0, Math.min(1, y / mx)) * 1000) / 1000 : 0; }

  /* ---------- 帶領者 ---------- */
  function host(code, quiet) {
    loadJs(PEER_JS, function () { return !!window.Peer; }, function (ok) {
      if (!ok) { toast(X('loadErr')); return; }
      teardown(); C.role = 'host'; C.code = code || newCode(); C.status = 'connecting'; ss(SSK, { r: 'host', c: C.code }); chip(); top();
      var p = C.peer = new Peer(PFX + C.code, { debug: 0 });
      p.on('open', function () { C.retry = 0; C.status = 'ok'; chip(); if (!quiet) sheet(); snap(true); });
      p.on('connection', function (c) {
        C.conns.push(c);
        c.on('open', function () { chip(); toast(X('joinedOne')); paintCount(); if (C.last) try { c.send(C.last); } catch (e) { } });
        c.on('close', function () { drop(c); }); c.on('error', function () { drop(c); });
      });
      p.on('disconnected', function () { if (C.role === 'host' && !p.destroyed) setTimeout(function () { try { p.reconnect(); } catch (e) { } }, 1500); });
      p.on('error', function (e) {
        if (C.role !== 'host') return;
        if (e && e.type === 'unavailable-id') { if (C.retry++ < 25) { C.status = 'connecting'; chip(); clearTimeout(C.rt); C.rt = setTimeout(function () { host(C.code, true); }, 3000); } else { toast(X('loadErr')); end(); } return; }
        if (e && (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error' || e.type === 'socket-closed')) { clearTimeout(C.rt); C.rt = setTimeout(function () { if (C.role === 'host') host(C.code, true); }, 4000); }
      });
    });
  }
  function drop(c) { var o = [], i; for (i = 0; i < C.conns.length; i++) if (C.conns[i] !== c) o.push(C.conns[i]); C.conns = o; chip(); paintCount(); }
  function bcast(m) { m.t = 'st'; C.last = m; var cs = live(), i; for (i = 0; i < cs.length; i++) try { cs[i].send(m); } catch (e) { } }
  /* 帶領者：把「目前在哪一頁、捲到哪裡、哪一句」整包送出（內容相同就不重送） */
  function snap(force) {
    if (C.role !== 'host') return;
    var p = null; try { p = AD.page(); } catch (e) { p = null; }
    var k = pkeyOf(p); if (k !== C.pkey) { C.pkey = k; C.mk = null; }
    var m = p ? { p: p, f: ratio(), mk: C.mk } : { p: null };
    var key = JSON.stringify(m);
    if (!force && key === C.lastKey) return;
    C.lastKey = key; m.ts = now(); bcast(m);
  }
  var scT = null;
  window.addEventListener('scroll', function () { if (C.role === 'host') { if (scT) return; scT = setTimeout(function () { scT = null; snap(); }, 220); } }, { passive: true });
  function userMove(e) {
    if (C.role !== 'follow') return;
    var n = e && e.target; while (n && n !== document) { if (n.id === 'crsheet' || n.id === 'crchip' || n.id === 'crTop') return; n = n.parentNode; }
    C.manualAt = now(); chip();
  }
  window.addEventListener('touchmove', userMove, { passive: true }); window.addEventListener('wheel', userMove, { passive: true });
  document.addEventListener('pointerdown', userMove, true); document.addEventListener('keydown', function (e) { if (e && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'PageDown' || e.key === 'PageUp' || e.key === ' ')) userMove(e); }, true);

  /* ---------- 跟隨者 ---------- */
  function join(code, scr) {
    code = String(code || '').replace(/\D/g, ''); if (code.length !== 6) { toast(X('badCode')); return; }
    loadJs(PEER_JS, function () { return !!window.Peer; }, function (ok) {
      if (!ok) { toast(X('loadErr')); return; }
      teardown(); C.role = 'follow'; C.code = code; C.scr = scr ? 1 : (window.CR_SCREEN ? 1 : 0); C.status = 'connecting'; C.first = true; C.misses = 0; C.manualAt = 0; ss(SSK, { r: 'follow', c: code, s: C.scr }); chip(); top(); closeSheet();
      try { if (AD.onboarding && AD.onboarding()) toast(X('onbFirst')); } catch (e) { }
      var p = C.peer = new Peer({ debug: 0 });
      p.on('open', function () { dial(); });
      p.on('disconnected', function () { if (C.role === 'follow' && !p.destroyed) setTimeout(function () { try { p.reconnect(); } catch (e) { } }, 1500); });
      p.on('error', function (e) {
        if (C.role !== 'follow') return;
        if (e && e.type === 'peer-unavailable') { C.misses++; if (C.first && C.misses >= 3) { toast(X('notFound')); leave(true); return; } C.status = 'connecting'; chip(); redial(4000); return; }
        redial(4000);
      });
    });
  }
  function redial(ms) { clearTimeout(C.rt); C.rt = setTimeout(function () { if (C.role === 'follow') dial(); }, ms || 3000); }
  function dial() {
    var p = C.peer; if (!p || p.destroyed || C.role !== 'follow') return;
    if (p.disconnected) { try { p.reconnect(); } catch (e) { } redial(3000); return; }
    try { if (C.host) C.host.close(); } catch (e) { }
    var c = C.host = p.connect(PFX + C.code, { reliable: true });
    var to = setTimeout(function () { if (!c.open && C.role === 'follow' && C.host === c) { try { c.close(); } catch (e) { } redial(1000); } }, 12000);
    c.on('open', function () { clearTimeout(to); C.misses = 0; C.lastRx = now(); C.status = 'ok'; if (C.first) { C.first = false; toast(X('joined')); } chip(); });
    c.on('data', function (m) { C.lastRx = now(); if (C.status !== 'ok') { C.status = 'ok'; chip(); } if (!m) return; if (m.t === 'st') apply(m); else if (m.t === 'end') leave(); });
    c.on('close', function () { clearTimeout(to); if (C.role === 'follow' && C.host === c) { C.status = 'lost'; chip(); redial(2500); } });
    c.on('error', function () { });
  }
  function cooling() { return C.manualAt && now() - C.manualAt < FOLLOW_COOL; }
  function overlayOpen() { try { return !!(AD.overlay && AD.overlay()); } catch (e) { return false; } }
  function apply(m, force) {
    C.want = m; C.blocked = false; C.elsewhere = false;
    if (!m.p) { C.elsewhere = true; chip(); return; }
    var cur = null; try { cur = AD.page(); } catch (e) { }
    var same = pkeyOf(cur) === pkeyOf(m.p);
    if (!same) {
      if (!force && cooling()) { chip(); return; }
      if (overlayOpen()) { if (force && AD.closeOverlay) { try { AD.closeOverlay(); } catch (e) { } } else { C.blocked = true; chip(); return; } }
      if (AD.onboarding && AD.onboarding()) { chip(); return; }
      try { if (AD.stop) AD.stop(); } catch (e) { }
      C.appliedMk = ''; clearPt();
      try { AD.go(m.p); } catch (e) { }
      later();
      chip(); return;
    }
    if (force) C.manualAt = 0;
    settle(force);
    chip();
  }
  function later() { C.settleUntil = now() + 3000; var d = [90, 350, 900, 1800, 2800], i; for (i = 0; i < d.length; i++) setTimeout(function () { if (C.role === 'follow') settle(); }, d[i]); }
  function clearPt() { var o = document.querySelectorAll('.cr-pt'), i; for (i = 0; i < o.length; i++) o[i].className = String(o[i].className).replace(/\s*cr-pt\b/g, ''); }
  function scrollRatio(f) { var mx = document.documentElement.scrollHeight - (window.innerHeight || 600); try { window.scrollTo(0, Math.round(Math.max(0, mx) * (f || 0))); } catch (e) { window.scrollTo(0, 0); } }
  function settle(force) {
    var m = C.want; if (C.role !== 'follow' || !m || !m.p) return;
    var cur = null; try { cur = AD.page(); } catch (e) { }
    if (pkeyOf(cur) !== pkeyOf(m.p)) return;
    if (!force && cooling()) return;
    var mkk = m.mk ? JSON.stringify(m.mk) : '', el = null;
    if (m.mk) { try { el = AD.findMark(m.mk); } catch (e) { el = null; } }
    if (el) {
      var had = / cr-pt\b/.test(' ' + el.className);
      if (!had) { clearPt(); el.className += ' cr-pt'; }
      if (mkk !== C.appliedMk || force) { C.appliedMk = mkk; try { el.scrollIntoView({ block: 'center' }); } catch (e) { el.scrollIntoView(); } }
      else if (Math.abs(ratio() - m.f) > .004) scrollRatio(m.f);
      return;
    }
    if (!m.mk) clearPt();
    if (Math.abs(ratio() - m.f) > .004) scrollRatio(m.f);
  }
  function back() { C.manualAt = 0; if (C.want) apply(C.want, true); chip(); }

  /* 心跳：帶領者每 5 秒報平安；跟隨者 15 秒沒收到就重新連線 */
  setInterval(function () {
    if (C.role === 'host') { var cs = live(), i; for (i = 0; i < cs.length; i++) try { cs[i].send({ t: 'hb' }); } catch (e) { } }
    else if (C.role === 'follow' && C.host && C.lastRx && now() - C.lastRx > 15000) { C.lastRx = 0; C.status = 'lost'; chip(); dial(); }
  }, 5000);
  window.addEventListener('pagehide', function () { if (C.role === 'host') { var cs = live(), i; for (i = 0; i < cs.length; i++) try { cs[i].send({ t: 'hb' }); } catch (e) { } } });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && C.role === 'follow' && C.status !== 'ok') dial(); if (!document.hidden && C.role === 'host' && C.peer && C.peer.disconnected) try { C.peer.reconnect(); } catch (e) { } });

  /* ---------- 結束 ---------- */
  function teardown() { clearTimeout(C.rt); try { if (C.peer) C.peer.destroy(); } catch (e) { } C.peer = null; C.conns = []; C.host = null; C.want = null; C.appliedMk = ''; clearPt(); }
  function end() { var cs = live(), i; for (i = 0; i < cs.length; i++) try { cs[i].send({ t: 'end' }); } catch (e) { }
    setTimeout(endNow, cs.length ? 300 : 0); }
  function endNow() { teardown(); C.role = ''; C.code = ''; C.last = null; C.lastKey = ''; ss(SSK, null); chip(); top(); closeSheet(); toast(X('ended')); }
  function leave(quiet) { teardown(); C.role = ''; C.code = ''; ss(SSK, null); chip(); top(); closeSheet(); if (!quiet) toast(X('ended')); }

  /* ---------- 畫面 ---------- */
  function top() { var b = document.getElementById('crTop'); if (b) b.className = C.role ? 'on' : ''; }
  function mountTop() {
    if (document.getElementById('crTop')) return;
    var b = document.createElement('button'); b.id = 'crTop'; b.type = 'button'; b.setAttribute('aria-label', 'co-read'); b.innerHTML = '📡'; b.title = X('title');
    b.onclick = function (e) { if (e && e.stopPropagation) e.stopPropagation(); b.title = X('title'); if (C.role === 'follow' && (C.blocked || cooling())) { back(); return; } sheet(); };
    if (!AD.mountTop || !AD.mountTop(b)) { b.style.cssText = 'position:fixed;right:8px;top:calc(8px + env(safe-area-inset-top));z-index:9000;background:' + (th.brand || '#B0345A'); document.body.appendChild(b); }
    top();
  }
  function chip() {
    var el = document.getElementById('crchip');
    if (!C.role) { if (el) el.parentNode.removeChild(el); return; }
    if (!el) { el = document.createElement('button'); el.id = 'crchip'; el.type = 'button'; el.className = 'crchip'; el.onclick = function () { if (C.role === 'follow' && (C.manualAt || C.blocked)) { back(); return; } sheet(); }; document.body.appendChild(el); }
    var t, cls = 'crchip';
    if (C.role === 'host') {
      if (C.status !== 'ok') t = X('connecting');
      else { t = X('hostChip', C.code, live().length); var hp = null; try { hp = AD.page(); } catch (e) { } if (!hp) t = X('hostElse'); }
    }
    else if (C.status !== 'ok') { t = C.status === 'lost' ? X('hostLeft') : X('connecting'); cls += ' wait'; }
    else if (C.blocked) { t = X('mine'); cls += ' off'; }
    else if (C.elsewhere) { t = X('elsewhere'); cls += ' off'; }
    else if (cooling()) { t = X('paused'); cls += ' off'; }
    else t = X('following');
    el.className = cls; el.innerHTML = '<span class="dot"></span>📡 ' + E(t);
  }
  setInterval(function () { if (C.role === 'follow' && C.manualAt && !cooling()) { chip(); if (C.want) apply(C.want); } }, 1500);
  function qrInto(id, text) {
    loadJs(QR_JS, function () { return typeof window.qrcode === 'function'; }, function (ok) {
      var box = document.getElementById(id); if (!box || !ok) { if (box) box.style.display = 'none'; return; }
      try { var q = qrcode(0, 'M'); q.addData(text); q.make(); box.innerHTML = q.createImgTag(5, 10); } catch (e) { box.style.display = 'none'; }
    });
  }
  function paintCount() { var e = document.getElementById('crcount'); if (e) { var n = live().length; e.textContent = n ? X('people', n) : X('waiting'); } }
  function closeSheet() { var s = document.getElementById('crsheet'), m = document.getElementById('crmask'); if (s) s.className = ''; if (m) m.className = ''; }
  function openSheet(h) {
    var s = document.getElementById('crsheet'), m = document.getElementById('crmask');
    if (!m) { m = document.createElement('div'); m.id = 'crmask'; m.onclick = closeSheet; document.body.appendChild(m); }
    if (!s) { s = document.createElement('div'); s.id = 'crsheet'; s.setAttribute('role', 'dialog'); document.body.appendChild(s); }
    s.innerHTML = h; s.className = 'on'; m.className = 'on'; return s;
  }
  function sheet() {
    var h = '<div class="cr-h">📡 ' + E(X('title')) + '</div>';
    if (C.role === 'host') {
      var u = joinUrl(C.code);
      h += '<div class="cr-k">' + E(X('code')) + '</div><div class="cr-code">' + E(C.code.slice(0, 3) + ' ' + C.code.slice(3)) + '</div>' +
        '<div class="cr-qr" id="crqr"></div><div class="cr-k">' + E(X('qrTip')) + '</div>' +
        '<div class="cr-count" id="crcount"></div>' +
        '<div class="cr-acts"><button class="crb pri" data-act="crinvite" type="button">↗ ' + E(X('invite')) + '</button><button class="crb" data-act="crcopy" type="button">⧉ ' + E(X('copyLink')) + '</button></div>' +
        (window.CR_SCR_UI ? CR_SCR_UI(function () { return X('title'); }, '') : '') +
        '<div class="cr-priv">' + E(X('priv')) + '</div><div class="cr-tip">' + E(X('tip')) + '</div>' +
        '<div class="cr-acts" style="margin-top:12px"><button class="crb" data-act="crend" type="button">■ ' + E(X('end')) + '</button><button class="crb" data-act="crclose" type="button">' + E(X('close')) + '</button></div>';
      window.__crScrU = u + '&screen=1'; openSheet(h); paintCount(); qrInto('crqr', u); return;
    }
    if (C.role === 'follow') {
      h += '<div class="cr-k">' + E(X('followOnly')) + '</div><div class="cr-code">' + E(C.code.slice(0, 3) + ' ' + C.code.slice(3)) + '</div>' +
        '<div class="cr-priv">' + E(X('priv')) + '</div>' +
        '<div class="cr-acts"><button class="crb pri" data-act="crback" type="button">' + E(X('back2')) + '</button><button class="crb" data-act="crleave" type="button">' + E(X('leave')) + '</button></div>' +
        '<div class="cr-acts"><button class="crb" data-act="crclose" type="button">' + E(X('close')) + '</button></div>';
      openSheet(h); return;
    }
    h += '<div class="cr-desc">' + E(X('desc')) + '</div><div class="cr-priv">' + E(X('priv')) + '</div>' +
      '<button class="crb pri blk" data-act="crhost" type="button">📡 ' + E(X('host')) + '</button>' +
      '<div class="cr-k" style="margin-top:16px">' + E(X('orJoin')) + '</div>' +
      '<div class="cr-join"><input id="crin" type="tel" inputmode="numeric" maxlength="7" autocomplete="off" placeholder="' + E(X('codePH')) + '"><button class="crb pri" data-act="crjoin" type="button">' + E(X('join')) + '</button></div>' +
      '<div class="cr-acts" style="margin-top:12px"><button class="crb" data-act="crclose" type="button">' + E(X('close')) + '</button></div>';
    openSheet(h); var inp = document.getElementById('crin');
    if (inp) inp.onkeydown = function (e) { if (e.keyCode === 13) join(inp.value); };
  }
  document.addEventListener('click', function (e) {
    var n = e.target; while (n && n !== document && !(n.getAttribute && n.getAttribute('data-act') && n.className.indexOf('crb') >= 0)) n = n.parentNode; if (!n || n === document) return;
    var a = n.getAttribute('data-act');
    if (a === 'crhost') { closeSheet(); host(); }
    else if (a === 'crjoin') { var i = document.getElementById('crin'); join(i ? i.value : ''); }
    else if (a === 'crinvite') { shareText(X('inviteMsg', joinUrl(C.code), C.code, NAME())); }
    else if (a === 'crcopy') { copyText(joinUrl(C.code), function () { toast(X('copied')); }); }
    else if (a === 'crend') end();
    else if (a === 'crleave') leave();
    else if (a === 'crback') { closeSheet(); back(); }
    else if (a === 'crclose') closeSheet();
  }, false);

  /* ---------- 給 App 呼叫的接口 ---------- */
  window.CR = {
    on: function () { return !!C.role; },
    role: function () { return C.role; },
    sheet: sheet, join: join, host: host, end: end, leave: leave, snap: function () { snap(); },
    state: function () { return { role: C.role, code: C.code, status: C.status, blocked: !!C.blocked, elsewhere: !!C.elsewhere, manual: !!cooling(), want: C.want }; },
    /* 帶領者：朗讀走到哪一句 */
    tts: function (el) { if (C.role !== 'host' || !el) return; var mk = null; try { mk = AD.markOf(el); } catch (e) { } if (mk) { C.mk = mk; snap(); } },
    /* 每次畫面重畫之後 */
    rendered: function () { if (C.role === 'host') { snap(); chip(); } else if (C.role === 'follow') { if (now() < C.settleUntil) settle(); } }
  };
  /* 重畫鉤子：主內容容器有東西變動（子節點／class）就補一次 */
  var moT = null;
  function watch() {
    var root = null; try { root = AD.watchRoot ? AD.watchRoot() : document.body; } catch (e) { } root = root || document.body;
    if (!window.MutationObserver) return;
    try {
      new MutationObserver(function () { clearTimeout(moT); moT = setTimeout(function () { if (C.role) CR.rendered(); }, 150); })
        .observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    } catch (e) { }
  }
  function init() {
    mountTop(); watch();
    var q = location.search, mj = q.match(/[?&]join=(\d{6})/), scr = /[?&]screen=1/.test(q) ? 1 : 0;
    if (mj) { try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { } setTimeout(function () { join(mj[1], scr); }, 600); return; }
    var keep = ss(SSK);
    if (keep && keep.c) setTimeout(function () { if (keep.s) window.CR_SCREEN = true; if (keep.r === 'host') host(keep.c, true); else join(keep.c, keep.s); }, 600);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
