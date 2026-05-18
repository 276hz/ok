'use strict';
/* ═══════════════════════════════════════════════════════
   THPT Cẩm Bình · ui.js
   Chứa: disclaimer popup, ripple, mouse trail, magnetic hover,
         confetti, scroll-to-top, compare, search history,
         clip history, region chips, share, BD hover, filter pill
═══════════════════════════════════════════════════════ */

/* ── Confetti burst (shared) ────────────────────────── */
function burst(x, y) {
  const colors = ['#ff6b6b','#feca57','#48dbfb','#ff9ff3','#4eff91','#54a0ff'];
  for (let i = 0; i < 20; i++) {
    const el = document.createElement('div'); el.className = 'xconf';
    el.style.cssText = `left:${x-3}px;top:${y-3}px;background:${colors[i%colors.length]};`;
    const angle = Math.random() * Math.PI * 2, dist = 35 + Math.random() * 65;
    el.animate([
      { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
      { transform: `translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist}px) rotate(${720+Math.random()*360}deg)`, opacity: 0 }
    ], { duration: 700 + Math.random()*400, easing: 'cubic-bezier(.17,.67,.83,.67)', fill: 'forwards' });
    document.body.appendChild(el); setTimeout(() => el.remove(), 1200);
  }
}

/* ── Scroll to top (single unified button, id=scrollTopBtn) ── */
// Fix: original had two buttons (#scrollTop in HTML + #scrollTopBtn from JS).
// We keep #scrollTop in HTML and just hook up the JS logic to it.
function initScrollTop() {
  // Prefer the existing #scrollTop button from HTML; create only if missing
  let btn = document.getElementById('scrollTop');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'scrollTop'; btn.title = 'Lên đầu (↑)'; btn.innerHTML = '↑';
    document.body.appendChild(btn);
  }
  btn.onclick = () => {
    ['tblScroll','viewNews','viewDiem','viewClass','viewStats','viewPotd'].forEach(id => {
      const e = document.getElementById(id); if (e) e.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Bounce animation
    btn.style.animation = 'none';
    void btn.offsetWidth;
    btn.style.animation = 'clickBounce .3s cubic-bezier(.34,1.56,.64,1) both';
    const r = btn.getBoundingClientRect();
    burst(r.left + r.width/2, r.top + r.height/2);
  };
  const ids = ['tblScroll','viewNews','viewDiem','viewClass','viewStats'];
  const check = () => btn.classList.toggle('on',
    ids.some(id => { const e = document.getElementById(id); return e && e.scrollTop > 180; }) || window.scrollY > 180
  );
  ids.forEach(id => { const e = document.getElementById(id); if (e) e.addEventListener('scroll', check, { passive: true }); });
  window.addEventListener('scroll', check, { passive: true });
}

/* ── Disclaimer popup ───────────────────────────────── */
(function initDisclaimer() {
  const dov = document.getElementById('dov');
  const dbtn = document.getElementById('dbtn');
  // Show popup on next frame
  requestAnimationFrame(() => requestAnimationFrame(() => { if (dov) dov.classList.add('on'); }));

  // Populate system info
  const ua = navigator.userAgent;
  function getOS() {
    if (/iPhone OS ([\d_]+)/.test(ua))  return 'iOS ' + RegExp.$1.replace(/_/g,'.');
    if (/Android ([\d.]+)/.test(ua))    return 'Android ' + RegExp.$1;
    if (/Windows NT 10/.test(ua))       return 'Win 10/11';
    if (/Mac OS X ([\d_]+)/.test(ua))   return 'macOS ' + RegExp.$1.replace(/_/g,'.');
    return 'Unknown';
  }
  function getDev() {
    if (/iPhone/.test(ua)) return 'iPhone';
    if (/iPad/.test(ua))   return 'iPad';
    if (/Android/.test(ua)) { const m = ua.match(/;\s*([^)]+)\)/); return m ? m[1].trim().slice(0,14) : 'Android'; }
    if (/Mac/.test(ua))    return 'Mac';
    return 'PC';
  }
  function getBr() {
    if (/Edg\/([\d]+)/.test(ua))     return 'Edge '    + RegExp.$1;
    if (/Firefox\/([\d]+)/.test(ua)) return 'Firefox ' + RegExp.$1;
    if (/Chrome\/([\d]+)/.test(ua))  return 'Chrome '  + RegExp.$1;
    const isSafari = /Safari\//.test(ua) && !/Chrome/.test(ua);
    if (isSafari) { const v = ua.match(/Version\/([\d]+)/); return 'Safari ' + (v ? v[1] : ''); }
    return 'Browser';
  }
  function getNet() {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return 'Online';
    return [c.effectiveType ? c.effectiveType.toUpperCase() : '', c.downlink ? c.downlink+'Mbps' : ''].filter(Boolean).join(' ') || 'Online';
  }
  const _$ = id => document.getElementById(id);
  _$('si-dev')  && (_$('si-dev').textContent  = getDev());
  _$('si-os')   && (_$('si-os').textContent   = getOS());
  _$('si-br')   && (_$('si-br').textContent   = getBr());
  _$('si-lang') && (_$('si-lang').textContent = navigator.language || 'vi');
  _$('si-sc')   && (_$('si-sc').textContent   = screen.width + '×' + screen.height);
  _$('si-tz')   && (_$('si-tz').textContent   = Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop());
  _$('si-net')  && (_$('si-net').textContent  = getNet());
  _$('si-cpu')  && (_$('si-cpu').textContent  = (navigator.hardwareConcurrency || '?') + ' cores');
  // Fix: RAM only shown when real data is available (was hardcoded "36GB")
  if (performance.memory && _$('si-ram')) {
    _$('si-ram').textContent = (performance.memory.usedJSHeapSize/1048576).toFixed(0) + '/' + (performance.memory.jsHeapSizeLimit/1048576).toFixed(0) + 'MB';
  } else if (_$('si-ram')) {
    _$('si-ram').textContent = 'N/A';
  }
  const nav = performance.getEntriesByType('navigation')[0];
  _$('si-load') && (_$('si-load').textContent = (nav ? Math.round(nav.loadEventEnd - nav.startTime) : Math.round(performance.now())) + 'ms');
  const now = new Date();
  _$('d-date') && (_$('d-date').textContent = now.toLocaleDateString('vi-VN'));
  _$('d-ref')  && (_$('d-ref').textContent  = 'REF·' + now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0'));
  _$('d-ver')  && (_$('d-ver').textContent  = 'build·' + Math.floor(now/86400000));
  function tick() { _$('si-time') && (_$('si-time').textContent = new Date().toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit',second:'2-digit'})); }
  tick(); setInterval(tick, 1000);

  // FPS counter
  let ff = 0, fr = 0, fl = performance.now();
  (function fL(ts) {
    fr++;
    if (ts - fl >= 700) {
      ff = Math.round(fr * 1000 / (ts - fl)); fr = 0; fl = ts;
      const e = _$('si-fps'), b = _$('fps-fill');
      if (e) e.textContent = ff + ' fps';
      if (b) { b.style.width = Math.min(ff/120*100, 100) + '%'; b.style.background = ff>=55?'#4eff91':ff>=30?'#feca57':'#ff6b6b'; }
    }
    requestAnimationFrame(fL);
  })(performance.now());

  // IP / Geo (multiple fallback APIs)
  (function() {
    const ipEl = _$('si-ip'), geoEl = _$('si-geo');
    if (ipEl) ipEl.innerHTML = '<span style="opacity:.5;font-size:5px;letter-spacing:.5px">ĐANG TẢI...</span>';
    function setIP(ip) { if (ipEl) ipEl.textContent = ip || 'N/A'; }
    function setGeo(city, country, org) { if (geoEl) geoEl.textContent = [city, country].filter(Boolean).join(', ') + (org ? ' · ' + org.slice(0,18) : ''); }
    const apis = [
      () => fetch('https://ipapi.co/json/',{signal:AbortSignal.timeout(4000)}).then(r=>r.json()).then(d=>{if(!d.ip)throw 0;setIP(d.ip);setGeo(d.city,d.country_name,d.org);}),
      () => fetch('https://ip-api.com/json/?fields=query,city,country,org',{signal:AbortSignal.timeout(4000)}).then(r=>r.json()).then(d=>{if(!d.query)throw 0;setIP(d.query);setGeo(d.city,d.country,d.org);}),
      () => fetch('https://ipwho.is/',{signal:AbortSignal.timeout(4000)}).then(r=>r.json()).then(d=>{if(!d.ip)throw 0;setIP(d.ip);setGeo(d.city,d.country,d.connection&&d.connection.isp);}),
      () => fetch('https://api.ipify.org?format=json',{signal:AbortSignal.timeout(4000)}).then(r=>r.json()).then(d=>{if(!d.ip)throw 0;setIP(d.ip);}),
      () => fetch('https://ipinfo.io/json',{signal:AbortSignal.timeout(4000)}).then(r=>r.json()).then(d=>{if(!d.ip)throw 0;setIP(d.ip);setGeo(d.city,d.country,d.org);}),
    ];
    let idx = 0;
    function tryNext() { if (idx >= apis.length) { if (ipEl) ipEl.textContent = 'N/A'; return; } apis[idx++]().catch(tryNext); }
    tryNext();
  })();

  // Close button — confetti + dismiss
  if (dbtn) {
    dbtn.addEventListener('click', function () {
      const r = dbtn.getBoundingClientRect();
      burst(r.left + r.width/2, r.top + r.height/2);
      dov.classList.remove('on'); dov.classList.add('off');
      setTimeout(() => { dov.style.display = 'none'; }, 320);
    }, { once: true });
  }
})();

/* ── Ripple on buttons ──────────────────────────────── */
document.addEventListener('click', function (e) {
  const b = e.target.closest('.h-btn,.mabtn,.tab,.pg-btn,.dm-btn');
  if (!b) return;
  const s = document.createElement('span'); s.className = 'xrpl';
  const r = b.getBoundingClientRect();
  s.style.left = (e.clientX - r.left) + 'px'; s.style.top = (e.clientY - r.top) + 'px';
  b.appendChild(s); setTimeout(() => s.remove(), 520);
});

/* ── Dark mode button shake ─────────────────────────── */
const _dmBtn = document.querySelector('.dm-btn');
if (_dmBtn) _dmBtn.addEventListener('click', () => { _dmBtn.classList.add('xs'); setTimeout(() => _dmBtn.classList.remove('xs'), 380); });

/* ── Click bounce on tiles/cards ────────────────────── */
document.addEventListener('click', function (e) {
  const tile = e.target.closest('.stile,.cls-card,.chart-card');
  if (!tile) return;
  tile.style.animation = 'none'; void tile.offsetWidth;
  tile.style.animation = 'clickBounce .28s cubic-bezier(.34,1.56,.64,1) both';
});
document.addEventListener('click', function (e) {
  const ico = e.target.closest('.h-icon');
  if (!ico) return;
  ico.style.animation = 'none'; void ico.offsetWidth;
  ico.style.animation = 'iconBounce .4s cubic-bezier(.34,1.56,.64,1) both';
});
// Fix: added .diem-tab to selector (was missing in app3 version)
document.addEventListener('click', function (e) {
  const tab_ = e.target.closest('.modal-tab,.tuvi-tab,.sgt-btn,.diem-tab');
  if (!tab_) return;
  tab_.style.animation = 'none'; void tab_.offsetWidth;
  tab_.style.animation = 'clickBounce .25s cubic-bezier(.34,1.56,.64,1) both';
});

/* ── Confetti burst when search finds exactly 1 result ─ */
(function () {
  const si = document.getElementById('SI'); if (!si) return;
  let prev = 0;
  si.addEventListener('input', function () {
    const cnt = document.querySelectorAll('#TB tr').length;
    if (cnt > 0 && cnt !== prev && cnt === 1) {
      const r = si.getBoundingClientRect();
      burst(r.left + r.width/2, r.bottom + 10);
    }
    prev = cnt;
  });
})();

/* ── Chip hover sparkle ─────────────────────────────── */
(function () {
  document.addEventListener('mouseenter', function (e) {
    const chip = e.target.closest && e.target.closest('.chip');
    if (!chip) return;
    chip.style.boxShadow = '0 0 0 2px rgba(232,160,32,.35),0 4px 12px rgba(192,57,43,.2)';
  }, true);
  document.addEventListener('mouseleave', function (e) {
    const chip = e.target.closest && e.target.closest('.chip');
    if (!chip) return;
    chip.style.boxShadow = '';
  }, true);
})();

/* ── Animate health bars on fortune tab open ──────────── */
(function () {
  const origSwitch = window.switchTuviTab;
  if (origSwitch) window.switchTuviTab = function (name, btn) {
    origSwitch(name, btn);
    if (name === 'fortune') {
      setTimeout(() => {
        document.querySelectorAll('.bio-fill').forEach((el, i) => {
          const w = el.style.width; el.style.width = '0';
          setTimeout(() => { el.style.width = w; }, 50 + i * 80);
        });
      }, 80);
    }
  };
})();

/* ── Mouse trail particles ──────────────────────────── */
(function () {
  let last = 0;
  const COLORS = ['#ff6b6b','#ffd700','#48dbfb','#ff9ff3','#4eff91','#a29bfe','#fd79a8','#fdcb6e'];
  document.addEventListener('mousemove', function (e) {
    const now = Date.now(); if (now - last < 38) return; last = now;
    const p = document.createElement('div');
    const sz = 4 + Math.random() * 5;
    p.style.cssText = `position:fixed;left:${e.clientX-sz/2}px;top:${e.clientY-sz/2}px;width:${sz}px;height:${sz}px;border-radius:50%;background:${COLORS[Math.floor(Math.random()*COLORS.length)]};pointer-events:none;z-index:9999;`;
    document.body.appendChild(p);
    p.animate([
      { opacity: .8, transform: 'scale(1) translate(0,0)' },
      { opacity: 0,  transform: `scale(0) translate(${(Math.random()-.5)*18}px,${-10-Math.random()*14}px)` }
    ], { duration: 500 + Math.random()*200, easing: 'ease-out', fill: 'forwards' });
    setTimeout(() => p.remove(), 720);
  });
})();

/* ── Magnetic hover on stat pills ───────────────────── */
(function () {
  function addMagnet(selector) {
    document.addEventListener('mousemove', function (e) {
      document.querySelectorAll(selector).forEach(el => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width/2, cy = r.top + r.height/2;
        const dx = e.clientX - cx, dy = e.clientY - cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 110) {
          const str = 1 - dist/110;
          el.style.transform = `translateX(${dx*str*.18}px) translateY(${dy*str*.18-4*str}px) scale(${1+.022*str})`;
          el.style.transition = 'transform .12s ease';
        } else {
          el.style.transform = '';
          el.style.transition = 'transform .35s cubic-bezier(.34,1.56,.64,1)';
        }
      });
    });
  }
  addMagnet('.stat-pill');
  addMagnet('.qs-pill');
})();

/* ── Animate stat tile numbers on renderStats ────────── */
(function () {
  function animateNumber(el, target, dur) {
    const start = performance.now();
    function step(ts) {
      const p = Math.min((ts - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(ease * target).toLocaleString('vi');
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString('vi');
    }
    requestAnimationFrame(step);
  }
  const origRS = window.renderStats;
  if (origRS) window.renderStats = function () {
    origRS.apply(this, arguments);
    setTimeout(() => {
      document.querySelectorAll('.stile-n').forEach(el => {
        const v = parseInt(el.textContent.replace(/\D/g, ''), 10);
        if (isNaN(v)) return; el.textContent = '0'; animateNumber(el, v, 700);
      });
    }, 60);
  };
})();

/* ── Keyboard shortcuts ─────────────────────────────── */
function initKeyboard() {
  document.addEventListener('keydown', e => {
    if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) {
      if (e.key === 'Escape') e.target.blur(); return;
    }
    const sm = document.getElementById('SM_OV');
    const ov = document.getElementById('OV');
    const cp_ = document.getElementById('v3CmpPanel');
    switch (e.key) {
      case '/': e.preventDefault(); { const si = document.getElementById('SI'); if (si) { si.focus(); si.select(); } } break;
      case 'Escape':
        if (cp_ && cp_.classList.contains('on')) { cp_.classList.remove('on'); break; }
        if (sm && sm.classList.contains('on'))  { sm.classList.remove('on'); break; }
        if (ov && ov.classList.contains('on'))  { ov.classList.remove('on'); break; }
        if (typeof resetAll === 'function') resetAll(); break;
      case '1': tabClick(0); break; case '2': tabClick(1); break;
      case '3': tabClick(2); break; case '4': tabClick(3); break;
      case '5': tabClick(4); break; case '6': tabClick(5); break;
      case '7': tabClick(6); break;
      case 'd': case 'D': if (!e.ctrlKey && !e.metaKey && typeof toggleDark === 'function') toggleDark(); break;
      case 'r': case 'R': e.preventDefault(); openRandomStudent(); break;
      case 'F': e.preventDefault(); toggleFullscreen(); break;
    }
  });
}
function tabClick(idx) { const tabs = document.querySelectorAll('.tab'); if (tabs[idx]) tabs[idx].click(); }
function toggleFullscreen() {
  if (!document.fullscreenElement) { document.documentElement.requestFullscreen?.().catch(() => {}); toast('⛶ Toàn màn hình · Esc để thoát'); }
  else document.exitFullscreen?.();
}

/* ── Tab tooltips ───────────────────────────────────── */
function initTabTooltips() {
  const map = { '📋':'1·Danh sách','🪪':'2·Card','🏫':'3·Lớp','📊':'4·Thống kê','🎯':'5·Điểm','⭐':'7·Nổi bật','📰':'6·Tin tức' };
  document.querySelectorAll('.tab').forEach(t => {
    const ico = [...t.textContent.trim()][0];
    if (map[ico]) t.title = map[ico];
  });
}

/* ── Compare panel ──────────────────────────────────── */
let _compareList = [null, null];

function initCompare() {
  if (document.getElementById('v3CmpPanel')) return;
  const fab = document.createElement('button');
  fab.id = 'v3CmpFab'; fab.className = 'v3-cmp-fab'; fab.title = 'cỏ lúa bằng nhau?'; fab.innerHTML = '⚖️';
  fab.onclick = () => document.getElementById('v3CmpPanel')?.classList.toggle('on');
  document.body.appendChild(fab);

  const panel = document.createElement('div'); panel.id = 'v3CmpPanel'; panel.className = 'v3-cmp-panel';
  panel.innerHTML = `<div class="v3-cmp-hdr"><span class="v3-cmp-title">🌾 cỏ lúa bằng nhau?</span>
    <button class="v3-cmp-close" onclick="document.getElementById('v3CmpPanel').classList.remove('on')">✕</button></div>
    <div class="v3-cmp-slots">
      <div class="v3-slot v3-slot-empty" id="v3Slot1" onclick="v3CmpSearch(0)"><div class="v3-slot-ico">👤</div><div class="v3-slot-lbl">Chọn học sinh 1</div></div>
      <div class="v3-cmp-vs">VS</div>
      <div class="v3-slot v3-slot-empty" id="v3Slot2" onclick="v3CmpSearch(1)"><div class="v3-slot-ico">👤</div><div class="v3-slot-lbl">Chọn học sinh 2</div></div>
    </div>
    <div id="v3CmpResult"></div>
    <button class="mabtn mabtn-out" style="margin:10px 16px 14px;font-size:11px" onclick="v3ClearCmp()">🗑 Xóa hết</button>`;
  document.body.appendChild(panel);
}

function v3CmpSearch(idx) {
  const q = prompt(`Nhập tên học sinh ${idx+1} (hoặc STT):`);
  if (!q || !AppState) return;
  const nd = typeof stripDiacritics === 'function' ? stripDiacritics : s => s.toLowerCase();
  const found = AppState.ALL.filter(s => nd(s.hoTen||'').includes(nd(q)) || String(s.stt) === q.trim());
  if (!found.length) { toast('⚠️ Không tìm thấy'); return; }
  _compareList[idx] = found[0]; renderCmpSlots();
  if (_compareList[0] && _compareList[1]) renderCmpResult();
}

function v3ClearCmp() {
  _compareList = [null, null]; renderCmpSlots();
  const res = document.getElementById('v3CmpResult'); if (res) res.innerHTML = '';
}

function renderCmpSlots() {
  for (let i = 0; i < 2; i++) {
    const slot = document.getElementById(`v3Slot${i+1}`), s = _compareList[i];
    if (!slot) continue;
    if (s) {
      slot.className = 'v3-slot v3-slot-filled';
      slot.innerHTML = `<div class="v3-slot-emo">${s.gioiTinh==='Nam'?'👦':'👧'}</div><div class="v3-slot-name">${s.hoTen}</div><div class="v3-slot-lop">${s.lop}</div>
        <button onclick="event.stopPropagation();_compareList[${i}]=null;renderCmpSlots();document.getElementById('v3CmpResult').innerHTML=''" class="v3-slot-rm">✕</button>`;
      slot.onclick = null;
    } else {
      slot.className = 'v3-slot v3-slot-empty';
      slot.innerHTML = `<div class="v3-slot-ico">👤</div><div class="v3-slot-lbl">Chọn học sinh ${i+1}</div>`;
      slot.onclick = () => v3CmpSearch(i);
    }
  }
}

function renderCmpResult() {
  const [s1, s2] = _compareList;
  const res = document.getElementById('v3CmpResult');
  if (!s1 || !s2 || !res) return;
  const rows = [['Lớp',s1.lop,s2.lop],['Ngày sinh',s1.ngaySinh,s2.ngaySinh],
    ['Giới tính',s1.gioiTinh,s2.gioiTinh],['Quê quán',s1.queQuan,s2.queQuan],
    ['Địa chỉ',s1.xaPhuongThuongTru,s2.xaPhuongThuongTru],['Tên bố',s1.tenBo,s2.tenBo],['Tên mẹ',s1.tenMe,s2.tenMe]];
  let compat = null;
  try { if (typeof calcCompatScore === 'function') compat = calcCompatScore(s1, s2); } catch (e) {}
  res.innerHTML = `${compat ? `<div class="v3-cmp-compat">
    <div class="v3-cmp-compat-lbl">💞 Tương hợp: <strong>${compat.score}%</strong></div>
    <div class="v3-cmp-compat-track"><div class="v3-cmp-compat-fill" style="width:${compat.score}%"></div></div>
  </div>` : ''}
  <table class="v3-cmp-tbl"><thead><tr>
    <th>Trường</th><th>${s1.hoTen.split(' ').pop()}</th><th>${s2.hoTen.split(' ').pop()}</th>
  </tr></thead><tbody>
    ${rows.map(([l,v1,v2]) => `<tr class="${String(v1)===String(v2)&&v1?'v3-cmp-same':''}">
      <td class="v3-cmp-field">${l}</td><td>${v1||'–'}</td><td>${v2||'–'}</td>
    </tr>`).join('')}
  </tbody></table>`;
}

/* ── Random student ─────────────────────────────────── */
function openRandomStudent() {
  if (!AppState?.ALL?.length) return;
  const s = AppState.ALL[Math.floor(Math.random() * AppState.ALL.length)];
  toast(`🎲 Ngẫu nhiên: ${s.hoTen} · ${s.lop}`);
  if (typeof showDetail === 'function') showDetail(s.stt);
}

/* ── Search history (localStorage) ──────────────────── */
let _searchHist = [];
function initSearchHistory() {
  try { _searchHist = JSON.parse(localStorage.getItem('thpt-sh') || '[]'); } catch (e) {}
  const si = document.getElementById('SI'); if (!si) return;
  si.addEventListener('keydown', e => {
    if (e.key === 'Enter' && si.value.trim()) {
      const q = si.value.trim();
      _searchHist = [q, ..._searchHist.filter(h => h !== q)].slice(0, 10);
      try { localStorage.setItem('thpt-sh', JSON.stringify(_searchHist)); } catch (e) {}
    }
    if (e.key === 'ArrowUp' && !si.value.trim() && _searchHist.length) {
      si.value = _searchHist[0]; si.dispatchEvent(new Event('input')); toast('⏫ Khôi phục: ' + _searchHist[0]);
    }
  });
}

/* ── Clip history ────────────────────────────────────── */

function initClipHistory() {
  const btn = document.createElement('button');
  btn.className = 'v3-clip-hist-btn'; btn.title = 'Lịch sử copy'; btn.innerHTML = '📋';
  btn.onclick = () => {
    if (!AppState.clipHist.length) { toast('📋 Chưa sao chép gì'); return; }
    const msg = AppState.clipHist.map((t, i) => `${i+1}. ${t}`).join('\n');
    const pick = prompt('Lịch sử:\n\n' + msg + '\n\nNhập 1-3 để copy lại:');
    const idx = parseInt(pick) - 1;
    if (!isNaN(idx) && AppState.clipHist[idx]) navigator.clipboard.writeText(AppState.clipHist[idx]).then(() => toast('📋 Đã copy: ' + AppState.clipHist[idx]));
  };
  document.body.appendChild(btn);
}

/* ── Same-region chips in modal ──────────────────────── */
function injectSameRegion(stt) {
  setTimeout(() => {
    const pane = document.getElementById('mPane-info');
    if (!pane || !AppState || pane.querySelector('.v3-region-sec')) return;
    const s = AppState.ALL.find(x => x.stt === stt); if (!s) return;
    const region = s.xaPhuongThuongTru || s.queQuan; if (!region) return;
    const same = AppState.ALL.filter(x => x.stt !== stt && (x.xaPhuongThuongTru === region || x.queQuan === region)).slice(0, 8);
    if (!same.length) return;
    const sec = document.createElement('div'); sec.className = 'msec v3-region-sec';
    sec.innerHTML = `<h4>📍 Cùng ${region} <span style="color:var(--t4);font-size:11px">(${same.length}+)</span></h4>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">
        ${same.map(x => `<button onclick="closeModal();setTimeout(()=>typeof showDetail==='function'&&showDetail(${x.stt}),80)" class="v3-region-chip">
          ${x.gioiTinh==='Nam'?'👦':'👧'} ${x.hoTen.split(' ').slice(-1)[0]} <span style="opacity:.5;font-size:9.5px">${x.lop}</span>
        </button>`).join('')}
      </div>`;
    pane.appendChild(sec);
  }, 160);
}

/* ── Share profile ───────────────────────────────────── */
function shareProfile(stt) {
  if (!AppState) return;
  const s = AppState.ALL.find(x => x.stt === stt); if (!s) return;
  const text = `${s.hoTen} · Lớp ${s.lop||'–'} · Sinh ${s.ngaySinh||'–'} · THPT Cẩm Bình`;
  if (navigator.share) navigator.share({ title: 'THPT Cẩm Bình', text }).catch(() => {});
  else navigator.clipboard.writeText(text).then(() => toast('📋 Đã copy thông tin'));
}

function injectShareBtn(stt) {
  setTimeout(() => {
    const actions = document.getElementById('MOD')?.querySelector('.mactions');
    if (!actions || actions.querySelector('[data-v3share]')) return;
    const btn = document.createElement('button');
    btn.className = 'mabtn mabtn-out'; btn.setAttribute('data-v3share', '1'); btn.innerHTML = '🔗 Chia sẻ';
    btn.onclick = () => shareProfile(stt);
    actions.insertBefore(btn, actions.lastElementChild);
  }, 90);
}

/* ── BD hover badge in table ─────────────────────────── */
function initBdHover() {
  const tbody = document.getElementById('TB'); if (!tbody) return;
  tbody.addEventListener('mouseover', e => {
    const tr = e.target.closest('tr[onclick]');
    if (!tr || tr.querySelector('.v3-bdcd') || !AppState) return;
    const m = tr.getAttribute('onclick')?.match(/showDetail\((\d+)\)/);
    const s = m ? AppState.ALL.find(x => x.stt === +m[1]) : null; if (!s) return;
    const bd = s.ngaySinh?.split('/');
    if (!bd || bd.length < 3) return;
    const now = new Date();
    let next = new Date(now.getFullYear(), +bd[1]-1, +bd[0]);
    if (next <= now) next = new Date(now.getFullYear()+1, +bd[1]-1, +bd[0]);
    const d = Math.ceil((next - now) / 86400000);
    const age = (() => { let a = now.getFullYear() - +bd[2]; if (now.getMonth()+1 < +bd[1] || (now.getMonth()+1 === +bd[1] && now.getDate() < +bd[0])) a--; return a; })();
    const span = document.createElement('span'); span.className = 'v3-bdcd';
    span.textContent = d === 0 ? '🎂 Hôm nay!' : `(${age}t·${d}d)`;
    tr.querySelector('.td-name')?.appendChild(span);
  });
  tbody.addEventListener('mouseout', e => {
    e.target.closest('tr[onclick]')?.querySelector('.v3-bdcd')?.remove();
  });
}

/* ── Filter pill (count active filters) ─────────────── */
function initFilterPill() {
  const rc = document.getElementById('RC'); if (!rc || document.getElementById('v3FilterPill')) return;
  const pill = document.createElement('span'); pill.id = 'v3FilterPill';
  pill.style.cssText = 'display:none;background:var(--red);color:#fff;font-size:9.5px;font-weight:800;padding:1.5px 8px;border-radius:100px;margin-left:8px;vertical-align:middle';
  rc.appendChild(pill);
}

function updateFilterPill() {
  const pill = document.getElementById('v3FilterPill'); if (!pill) return;
  let n = 0;
  if (document.getElementById('FK')?.value)    n++;
  if (document.getElementById('FL')?.value)    n++;
  if (document.getElementById('FG')?.value)    n++;
  if (document.getElementById('SI')?.value.trim()) n++;
  if (document.getElementById('DSDay')?.value || document.getElementById('DSMon')?.value || document.getElementById('DSYear')?.value) n++;
  if (typeof AppState.addrQ !== 'undefined' && AppState.addrQ) n++;
  pill.style.display = n > 0 ? '' : 'none';
  pill.textContent = `${n} bộ lọc`;
  pill.style.animation = 'none'; void pill.offsetWidth; pill.style.animation = 'popIn .2s ease';
}

/* ── Address filter row ─────────────────────────────── */
// addrQ lives in AppState.addrQ
function initAddrFilter() {
  const filterRow = document.querySelector('.hbar-filters');
  if (!filterRow || document.getElementById('v3AddrRow')) return;
  const togBtn = document.createElement('button');
  togBtn.className = 'h-btn h-btn-ghost'; togBtn.id = 'v3AddrBtn'; togBtn.innerHTML = '📍'; togBtn.title = 'Tìm theo địa chỉ';
  togBtn.onclick = () => {
    const row = document.getElementById('v3AddrRow'); if (!row) return;
    const open = row.style.display !== 'none';
    row.style.display = open ? 'none' : 'flex'; togBtn.classList.toggle('on', !open);
    if (!open) document.getElementById('v3AddrInp')?.focus();
  };
  filterRow.appendChild(togBtn);
  const row = document.createElement('div'); row.id = 'v3AddrRow';
  row.style.cssText = 'display:none;align-items:center;gap:6px;padding:4px 16px 5px;background:rgba(0,0,0,.18);flex-wrap:wrap';
  row.innerHTML = `<span style="font-size:11px;color:rgba(255,255,255,.5);white-space:nowrap">📍 Địa chỉ:</span>
    <input id="v3AddrInp" autocomplete="off" placeholder="Xã, thôn, phường…"
      style="flex:1;min-width:140px;max-width:300px;height:28px;padding:0 12px;border-radius:100px;border:none;background:rgba(255,255,255,.9);font-size:12px;outline:none;color:#333"
      oninput="v3OnAddr()">
    <button onclick="v3ClearAddr()" style="background:none;border:none;color:rgba(255,255,255,.5);cursor:pointer;font-size:13px;line-height:1">✕</button>`;
  const dateRow = document.querySelector('.date-search-row');
  if (dateRow) dateRow.parentNode.insertBefore(row, dateRow.nextSibling);
  else document.querySelector('#header')?.appendChild(row);
}

function v3OnAddr() {
  AppState.addrQ = document.getElementById('v3AddrInp')?.value.trim() || '';
  if (typeof page !== 'undefined') page = 1;
  if (typeof renderAll === 'function') renderAll();
  updateFilterPill();
}
function v3ClearAddr() {
  AppState.addrQ = ''; const inp = document.getElementById('v3AddrInp'); if (inp) inp.value = '';
  if (typeof renderAll === 'function') renderAll(); updateFilterPill();
}

/* ── Dark mode smooth transition patch ──────────────── */
function patchDarkMode() {
  const _orig = window.toggleDark;
  window.toggleDark = function () {
    document.documentElement.style.transition = 'background .3s,color .3s';
    _orig && _orig();
    setTimeout(() => { document.documentElement.style.transition = ''; }, 400);
  };
}
