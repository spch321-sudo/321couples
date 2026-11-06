/* 321 夫妻成長營 — 繁體中文版
   部署網址：https://spch321-sudo.github.io/321couples/
   Service Worker（自動更新版，依 321 App 規格）
   ‧ VER 每次發佈都不同 → 瀏覽器發現 sw.js 改變就安裝新 SW
   ‧ install：skipWaiting；預載用 cache:'reload' 繞過 GitHub Pages 約 10 分鐘的 HTTP 快取
   ‧ activate：只刪這個 App 自己的舊快取（同網域還有其他 321 App）、clients.claim，
     通知所有頁面有新版；背景中的舊頁面直接重新導向到新版（連沒有更新程式的舊版頁面也會換新）
   ‧ fetch：網頁、JS、JSON 網路優先（no-cache），離線才用快取；圖示快取優先；
     version.json 永不快取；影音與 Range 請求不攔截
   ※ 每次改版：index.html 的 APPVER、這裡的 VER、version.json 三處要一致。 */
var VER = 'v2026.1103.0010-cr1-fs1103-xz1103-au1103-xzm1103-rf1105h';
var PFX = 'couples321-tw-';
var CACHE = PFX + VER;
var SHELL = ['./', './index.html','./xz2.js', './xzm.js', './sc.html', './en.html', './manifest.webmanifest', './manifest-sc.webmanifest', './manifest-en.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './icon-512-maskable.png', './coread.js', './peerjs.min.js'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(SHELL.map(function (u) {
      return fetch(new Request(u, { cache: 'reload' })).then(function (r) { if (r && r.ok) return c.put(u, r); })['catch'](function () {});
    }));
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf(PFX) === 0 && k !== CACHE; }).map(function (k) { return caches['delete'](k); }));
  }).then(function () { return self.clients.claim(); }).then(function () {
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  }).then(function (cs) {
    cs.forEach(function (c) {
      try { if (c.url.indexOf(self.registration.scope) === 0) c.postMessage({ t: 'sw-updated', v: VER }); } catch (x) {}
      if (c.visibilityState === 'hidden' && c.navigate) { try { c.navigate(c.url); } catch (x) {} }
    });
  }));
});

self.addEventListener('message', function (e) { if (e.data === 'skip' || e.data === 'SKIP_WAITING') self.skipWaiting(); });

/* rf1105（互動聖經 v2.58.3）：網路優先，但慢網路（超過 SHELL_WAIT 毫秒沒回）先用完全相同的快取開；網路那份繼續下載並更新快取。
   只有導覽請求才可以退回 index.html（程式檔退回 HTML 會造成 Unexpected token '<'）。 */
var SHELL_WAIT = 1000;
function shellFetch(e, req, key, url, nav) {
  var net = fetch(url, { cache: 'no-cache', credentials: 'same-origin' }).then(function (resp) {
    if (resp && resp.ok) { var cp = resp.clone(); caches.open(CACHE).then(function (c) { c.put(key, cp); }); }
    return resp;
  });
  e.waitUntil(net.then(function () { }, function () { }));
  function fallback() {
    return caches.match(key).then(function (h) { return h || caches.match(req, { ignoreSearch: true }); })
      .then(function (h) { return h || (nav ? caches.match('./index.html') : undefined); });
  }
  return new Promise(function (resolve) {
    var done = false;
    var t = setTimeout(function () { fallback().then(function (h) { if (h && !done) { done = true; resolve(h); } }); }, SHELL_WAIT);
    net.then(function (resp) { if (!done) { done = true; clearTimeout(t); resolve(resp); } }, function () {
      clearTimeout(t);
      if (done) return;
      fallback().then(function (h) { if (!done) { done = true; resolve(h || Response.error()); } });
    });
  });
}
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET') return;
  var u; try { u = new URL(r.url); } catch (x) { return; }
  if (u.origin !== self.location.origin) return;
  var p = u.pathname;
  if (/\.(mp3|m4a|aac|wav|ogg|opus|mp4|mov|webm)$/i.test(p) || r.headers.get('range')) return;
  if (/version\.json$/.test(p)) {
    e.respondWith(fetch(p + '?t=' + Date.now(), { cache: 'no-store' })['catch'](function () { return new Response('{}', { headers: { 'Content-Type': 'application/json' } }); }));
    return;
  }
  var nav = r.mode === 'navigate' || /\.html$/.test(p) || /\/$/.test(p);
  var key = nav ? './index.html' : (/\.(json|js|webmanifest|css)$/.test(p) ? u.origin + p : r);
  if (nav || /\.(json|js|css|webmanifest)$/.test(p)) {
    e.respondWith(shellFetch(e, r, key, nav ? u.origin + p + u.search : r.url, nav));
    return;
  }
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(function (h) {
    return h || fetch(r).then(function (resp) { if (resp && resp.ok) { var cp = resp.clone(); caches.open(CACHE).then(function (c) { c.put(r, cp); }); } return resp; });
  }));
});
