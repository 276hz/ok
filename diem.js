'use strict';
/* ═══════════════════════════════════════════════════════
   THPT Cẩm Bình · diem.js
   Chứa: tab Điểm (load, render, HOF, genius, TVTT, theo môn, modal điểm cá nhân)
═══════════════════════════════════════════════════════ */


let _diemQ    = '';
let _diemTab  = 'table';
let _diemSearchTimer = null;

/* ── Helpers ─────────────────────────────────────────── */
function fmtScore(n) {
  const v = parseFloat(n);
  if (isNaN(v))  return { txt: '–', cls: '' };
  if (v >= 9)    return { txt: v.toFixed(1), cls: 'ds-xuat-sac' };
  if (v >= 8)    return { txt: v.toFixed(1), cls: 'ds-gioi' };
  if (v >= 6.5)  return { txt: v.toFixed(1), cls: 'ds-kha' };
  if (v >= 5)    return { txt: v.toFixed(1), cls: 'ds-tb' };
  return { txt: v.toFixed(1), cls: 'ds-yeu' };
}

function fmtScoreLabel(xepLoai) {
  const map = {
    'Xuất sắc':  { emoji: '🌟', cls: 'ds-xuat-sac' },
    'Giỏi':      { emoji: '🏆', cls: 'ds-gioi' },
    'Khá':       { emoji: '👍', cls: 'ds-kha' },
    'Trung bình':{ emoji: '📘', cls: 'ds-tb' },
    'Yếu':       { emoji: '⚠️', cls: 'ds-yeu' },
  };
  return map[xepLoai] || { emoji: '–', cls: '' };
}

function fmtDateISO(iso) {
  if (!iso) return '';
  const p = String(iso).split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
}

function vToast(msg) { if (typeof toast === 'function') toast(msg); }

/* ── Augment student objects with diem reference ─────── */
function augmentIndexWithDiem() {
  if (!AppState?.diemData?.diemHocSinh?.length || !AppState.ALL?.length) return;
  const map = {};
  AppState.diemData.diemHocSinh.forEach(d => { map[d.stt] = d; });
  AppState.ALL.forEach(s => { s._diemRef = map[s.stt] || null; });
}

function getDiemForStudent(stt) {
  return AppState.diemData?.diemHocSinh?.find(d => d.stt === stt) || null;
}

/* ── Load ─────────────────────────────────────────────── */
async function loadDiem() {
  if (AppState.diemData) { renderDiem(); return; }
  const view = document.getElementById('viewDiem');
  if (view) view.innerHTML = '<div class="v3-loading"><div class="v3-spinner"></div><span>Đang tải điểm số…</span></div>';
  try {
    const r = await fetch('diem.json');
    if (!r.ok) throw new Error('fetch failed');
    AppState.diemData = await r.json();
  } catch {
    AppState.diemData = null;
  }
  augmentIndexWithDiem();
  renderDiem();
}

/* ── Router ─────────────────────────────────────────── */
function renderDiem() {
  const view = document.getElementById('viewDiem'); if (!view) return;
  if (!AppState.diemData?.diemHocSinh?.length) { renderDiemEmpty(view); return; }
  renderDiemFull(view);
}

function renderDiemEmpty(view) {
  view.innerHTML = `<div class="v3-page">
    <div class="v3-ph"><div class="v3-ph-left"><span class="v3-ph-ico">🎯</span>
      <div class="v3-ph-text"><div class="v3-ph-h">Điểm học kỳ</div>
      <div class="v3-ph-sub">Chưa có dữ liệu</div></div></div></div>
    <div class="v3-diem-empty-wrap">
      <div class="v3-diem-rings-ani">
        <div class="v3-ring r1"></div><div class="v3-ring r2"></div><div class="v3-ring r3"></div>
        <div class="v3-diem-center-ico">🎯</div>
      </div>
      <div class="v3-diem-empty-title">Chưa có dữ liệu điểm</div>
      <div class="v3-diem-empty-sub">Khi admin tải lên file <code>diem.json</code>, bảng điểm sẽ hiển thị tại đây.</div>
      <label class="v3-upload-lbl" for="v3DiemIn">📂 Tải lên file diem.json</label>
      <input type="file" id="v3DiemIn" accept=".json" style="display:none" onchange="v3HandleDiem(this)">
    </div>
  </div>`;
}

function renderDiemFull(view) {
  const mon  = AppState.diemData.monHoc || [];
  const ds   = AppState.diemData.diemHocSinh || [];
  const meta = AppState.diemData.meta || {};
  const nd   = typeof stripDiacritics === 'function' ? stripDiacritics : s => s.toLowerCase();

  let disp = _diemQ ? ds.filter(s =>
    nd(s.hoTen || '').includes(nd(_diemQ)) ||
    (s.lop || '').toLowerCase().includes(_diemQ.toLowerCase()) ||
    String(s.stt) === _diemQ.trim()
  ) : ds;

  if (_diemTab === 'hof' || _diemTab === 'genius' || _diemTab === 'tvtt') {
    disp = [...disp].sort((a, b) => (parseFloat(b.tbHocKy) || 0) - (parseFloat(a.tbHocKy) || 0));
  }

  const counts = {};
  ds.forEach(s => { const x = s.xepLoai; if (x) counts[x] = (counts[x] || 0) + 1; });
  const allAvg = ds.length ? ds.reduce((a, s) => a + (parseFloat(s.tbHocKy) || 0), 0) / ds.length : 0;
  const geniusStudents = ds.filter(s => Object.values(s.diem || {}).some(v => parseFloat(v) >= 9));
  const sorted = [...ds].sort((a, b) => (parseFloat(b.tbHocKy) || 0) - (parseFloat(a.tbHocKy) || 0));
  const top10  = sorted.slice(0, 10);
  const lowStudents = [...ds].filter(s => parseFloat(s.tbHocKy) < 5)
    .sort((a, b) => (parseFloat(a.tbHocKy) || 0) - (parseFloat(b.tbHocKy) || 0));
  const subjAvg = {};
  mon.forEach(m => {
    const vals = ds.map(s => parseFloat(s.diem?.[m])).filter(v => !isNaN(v));
    subjAvg[m] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  });

  view.innerHTML = `<div class="v3-page">
    <div class="v3-ph">
      <div class="v3-ph-left"><span class="v3-ph-ico">🎯</span>
        <div class="v3-ph-text">
          <div class="v3-ph-h">Điểm ${meta.hocKy || ''} · ${meta.namHoc || ''}</div>
          <div class="v3-ph-sub">Cập nhật: ${fmtDateISO(meta.capNhat)} · ${ds.length} học sinh · ${meta.ghiChu || ''}</div>
        </div>
      </div>
      <label class="v3-icon-act" for="v3DiemIn2" title="Cập nhật file điểm">🔄</label>
      <input type="file" id="v3DiemIn2" accept=".json" style="display:none" onchange="v3HandleDiem(this)">
    </div>
    <div class="diem-summary-row">
      ${buildSumChip(ds.length,'📋','Tổng HS','#4a90e2','.00s')}
      ${buildSumChip((counts['Xuất sắc']||0),'🌟','Xuất sắc','#e8a020','.05s')}
      ${buildSumChip((counts['Giỏi']||0),'🏆','Giỏi','#1a6a30','.10s')}
      ${buildSumChip((counts['Khá']||0),'👍','Khá','var(--blue)','.15s')}
      ${buildSumChip((counts['Trung bình']||0),'📘','TB','#8a7000','.20s')}
      ${buildSumChip((counts['Yếu']||0),'⚠️','Yếu','#fd79a8','.25s')}
      <div class="diem-sum-chip" style="animation-delay:.30s">
        <span class="dsc-val" style="color:var(--red)">${allAvg.toFixed(2)}</span>
        <span class="dsc-lbl">TB chung</span>
      </div>
    </div>
    <div class="diem-tabs">
      <button class="diem-tab${_diemTab==='table'?' on':''}" onclick="switchDiemTab('table',this)">📋 Bảng điểm</button>
      <button class="diem-tab${_diemTab==='hof'?' on':''}"   onclick="switchDiemTab('hof',this)">🏆 Học bá (Top 10)</button>
      <button class="diem-tab${_diemTab==='genius'?' on':''}" onclick="switchDiemTab('genius',this)">🌟 Thiên tài (≥9đ)</button>
      <button class="diem-tab${_diemTab==='tvtt'?' on':''}"  onclick="switchDiemTab('tvtt',this)">🧠 Thông minh VTĐ</button>
      <button class="diem-tab${_diemTab==='subj'?' on':''}"  onclick="switchDiemTab('subj',this)">📊 Theo môn</button>
    </div>
    <div id="diemContentArea">
      ${buildDiemContent(_diemTab, disp, mon, ds, top10, geniusStudents, lowStudents, sorted, subjAvg, meta)}
    </div>
  </div>`;
}

/* ── Switch diem tab ─────────────────────────────────── */
function switchDiemTab(name, btn) {
  _diemTab = name;
  document.querySelectorAll('.diem-tab').forEach(t => t.classList.remove('on'));
  if (btn) btn.classList.add('on');
  if (!AppState.diemData?.diemHocSinh) return;
  const ds  = AppState.diemData.diemHocSinh;
  const mon = AppState.diemData.monHoc || [];
  const nd  = typeof stripDiacritics === 'function' ? stripDiacritics : s => s.toLowerCase();
  let disp  = _diemQ ? ds.filter(s =>
    nd(s.hoTen||'').includes(nd(_diemQ)) ||
    (s.lop||'').toLowerCase().includes(_diemQ.toLowerCase()) ||
    String(s.stt) === _diemQ.trim()
  ) : ds;
  if (name === 'hof' || name === 'genius' || name === 'tvtt') {
    disp = [...disp].sort((a,b) => (parseFloat(b.tbHocKy)||0) - (parseFloat(a.tbHocKy)||0));
  }
  const sorted = [...ds].sort((a,b) => (parseFloat(b.tbHocKy)||0) - (parseFloat(a.tbHocKy)||0));
  const top10  = sorted.slice(0, 10);
  const genius = ds.filter(s => Object.values(s.diem||{}).some(v => parseFloat(v) >= 9));
  const tvtt   = ds.filter(s => parseFloat(s.tbHocKy) < 5).sort((a,b) => (parseFloat(a.tbHocKy)||0)-(parseFloat(b.tbHocKy)||0));
  const subjAvg = {};
  mon.forEach(m => {
    const vals = ds.map(s => parseFloat(s.diem?.[m])).filter(v => !isNaN(v));
    subjAvg[m] = vals.length ? vals.reduce((a,b) => a+b, 0)/vals.length : 0;
  });
  const area = document.getElementById('diemContentArea');
  if (area) area.innerHTML = buildDiemContent(name, disp, mon, ds, top10, genius, tvtt, sorted, subjAvg, AppState.diemData.meta||{});
}

/* ── Search within diem (debounced, keeps focus) ──────── */
function diemSearch(val) {
  _diemQ = val.trim();
  clearTimeout(_diemSearchTimer);
  _diemSearchTimer = setTimeout(() => {
    if (!AppState.diemData?.diemHocSinh) return;
    const nd  = typeof stripDiacritics === 'function' ? stripDiacritics : s => s.toLowerCase();
    const ds  = AppState.diemData.diemHocSinh;
    const mon = AppState.diemData.monHoc || [];
    let disp  = _diemQ ? ds.filter(s =>
      nd(s.hoTen||'').includes(nd(_diemQ)) ||
      (s.lop||'').toLowerCase().includes(_diemQ.toLowerCase()) ||
      String(s.stt) === _diemQ
    ) : ds;
    if (_diemTab === 'hof' || _diemTab === 'genius' || _diemTab === 'tvtt') {
      disp = [...disp].sort((a,b) => (parseFloat(b.tbHocKy)||0)-(parseFloat(a.tbHocKy)||0));
    }
    const sorted = [...ds].sort((a,b) => (parseFloat(b.tbHocKy)||0)-(parseFloat(a.tbHocKy)||0));
    const top10  = sorted.slice(0, 10);
    const genius = ds.filter(s => Object.values(s.diem||{}).some(v => parseFloat(v) >= 9));
    const tvtt   = ds.filter(s => parseFloat(s.tbHocKy) < 5).sort((a,b) => (parseFloat(a.tbHocKy)||0)-(parseFloat(b.tbHocKy)||0));
    const subjAvg = {};
    mon.forEach(m => {
      const vals = ds.map(s => parseFloat(s.diem?.[m])).filter(v => !isNaN(v));
      subjAvg[m] = vals.length ? vals.reduce((a,b) => a+b,0)/vals.length : 0;
    });
    const area = document.getElementById('diemContentArea');
    const cnt  = document.getElementById('diemResCount');
    if (area) area.innerHTML = buildDiemContent(_diemTab, disp, mon, ds, top10, genius, tvtt, sorted, subjAvg, AppState.diemData.meta||{});
    if (cnt)  cnt.textContent = disp.length + ' kết quả';
    // Restore input focus
    const inp = document.getElementById('diemSearchInp');
    if (inp) { inp.focus(); const l = inp.value.length; inp.setSelectionRange(l, l); }
  }, 80);
}

/* ── Build content area ─────────────────────────────── */
function buildSumChip(n, ico, lbl, color, delay) {
  return `<div class="diem-sum-chip" style="animation-delay:${delay}">
    <span class="dsc-ico">${ico}</span>
    <span class="dsc-val" style="color:${color}">${n}</span>
    <span class="dsc-lbl">${lbl}</span>
  </div>`;
}

function buildDiemContent(tab, disp, mon, ds, top10, genius, tvtt, sorted, subjAvg, meta) {
  const searchBar = `<div class="diem-search-row">
    <input id="diemSearchInp" class="diem-search-inp" type="search" autocomplete="off"
      placeholder="🔍 Tìm học sinh, lớp, STT…" value="${_diemQ}"
      oninput="diemSearch(this.value)">
    <span id="diemResCount" style="font-size:11px;color:var(--t4);white-space:nowrap">${disp.length} kết quả</span>
  </div>`;

  if (tab === 'hof')    return searchBar + buildHofSection(top10, genius, mon, ds, subjAvg);
  if (tab === 'genius') return searchBar + buildGeniusSection(genius, mon, ds);
  if (tab === 'tvtt')   return searchBar + buildTvttSection(tvtt);
  if (tab === 'subj')   return searchBar + buildSubjSection(mon, ds, subjAvg);
  return searchBar + buildDiemTable(disp, mon, meta);
}

/* ── Table view ─────────────────────────────────────── */
function buildDiemTable(disp, mon, meta) {
  if (!disp.length) return '<div class="v3-empty"><div class="v3-empty-ico">🔍</div><div class="v3-empty-t">Không tìm thấy học sinh</div></div>';
  return `<div class="diem-tbl-wrap">
    <table class="diem-tbl">
      <thead><tr>
        <th>STT</th><th>Họ tên</th><th>Lớp</th>
        ${mon.map(m => `<th>${m}</th>`).join('')}
        <th>TB HK</th><th>Xếp loại</th>
      </tr></thead>
      <tbody>
        ${disp.map((s, i) => {
          const sc  = fmtScore(s.tbHocKy);
          const lbl = fmtScoreLabel(s.xepLoai);
          return `<tr class="anim-row" onclick="typeof showDetail==='function'&&showDetail(${s.stt})" style="animation-delay:${Math.min(i*.015,.3)}s">
            <td style="color:var(--t4);font-size:11px">${s.stt}</td>
            <td style="font-weight:700;font-size:12.5px">${s.hoTen||'–'}</td>
            <td><span class="b b${(s.lop||'').substring(0,2)}">${s.lop||'–'}</span></td>
            ${mon.map(m => { const ms = fmtScore(s.diem?.[m]); return `<td><span class="diem-score ${ms.cls}">${ms.txt}</span></td>`; }).join('')}
            <td><span class="diem-score ${sc.cls}" style="font-size:13px;font-weight:900">${sc.txt}</span></td>
            <td><span class="diem-score ${lbl.cls}" style="font-size:10.5px">${lbl.emoji} ${s.xepLoai||'–'}</span></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>`;
}

/* ── HOF Section ─────────────────────────────────────── */
function buildHofSection(top10, genius, mon, ds, subjAvg) {
  const bySubj = {};
  mon.forEach(m => {
    bySubj[m] = [...ds].filter(s => s.diem?.[m] != null)
      .sort((a, b) => parseFloat(b.diem?.[m]||0) - parseFloat(a.diem?.[m]||0))
      .filter(s => parseFloat(s.diem?.[m]) >= 9);
  });
  return `
    <div class="hof-section" style="animation-delay:.05s">
      <div class="hof-hdr"><span class="hof-ico">🏆</span><span class="hof-title">Học bá Top 10</span><span class="hof-sub">Điểm TB cao nhất</span></div>
      <div class="hof-list">${top10.map((s, i) => {
        const sc = fmtScore(s.tbHocKy);
        const topSubj = mon.reduce((best, m) => parseFloat(s.diem?.[m]||0) > parseFloat(s.diem?.[best]||0) ? m : best, mon[0]);
        return `<div class="hof-row" onclick="typeof showDetail==='function'&&showDetail(${s.stt})">
          <span class="hof-rank ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span>
          <span class="hof-name">${s.hoTen}</span>
          <span class="hof-lop">${s.lop}</span>
          <span class="hof-score top"><span class="diem-score ${sc.cls}">${sc.txt}</span></span>
          <span class="hof-subj">${topSubj||''}</span>
        </div>`;
      }).join('')}</div>
    </div>
    <div class="hof-section" style="animation-delay:.08s">
      <div class="hof-hdr"><span class="hof-ico">🌟</span><span class="hof-title">Thiên tài (≥9đ môn nào đó)</span><span class="hof-sub">${genius.length} học sinh</span></div>
      <div class="gp-grid">${genius.slice(0, 30).map((s, i) => {
        const topSubj = mon.reduce((best, m) => parseFloat(s.diem?.[m]||0) > parseFloat(s.diem?.[best]||0) ? m : best, mon[0]);
        return `<div class="gp-card anim-fade" style="animation-delay:${i*.03}s" onclick="typeof showDetail==='function'&&showDetail(${s.stt})">
          <span class="gp-emo">${s.gioiTinh==='Nam'?'👦':'👧'}</span>
          <span class="gp-name">${s.hoTen}</span>
          <span class="gp-score">${parseFloat(s.tbHocKy).toFixed(1)}</span>
          <span class="gp-subject">${topSubj||''}</span>
        </div>`;
      }).join('')}
      ${genius.length > 30 ? `<div style="font-size:11px;color:var(--t3);padding:4px 12px;align-self:center">+${genius.length-30} nữa…</div>` : ''}
      </div>
    </div>
    ${mon.map((m, mi) => {
      const top = bySubj[m].slice(0, 5);
      if (!top.length) return '';
      return `<div class="hof-section" style="animation-delay:${.08+mi*.04}s">
        <div class="hof-hdr">
          <span class="hof-ico">📚</span>
          <span class="hof-title">Top môn ${m}</span>
          <span class="hof-sub">${bySubj[m].length} HS đạt ≥9đ</span>
        </div>
        <div class="hof-list">
          ${top.map((s, i) => `<div class="hof-row" onclick="typeof showDetail==='function'&&showDetail(${s.stt})">
            <span class="hof-rank ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span>
            <span class="hof-name">${s.hoTen}</span>
            <span class="hof-lop">${s.lop}</span>
            <span class="hof-score top">${parseFloat(s.diem?.[m]).toFixed(1)}</span>
          </div>`).join('')}
        </div>
      </div>`;
    }).join('')}`;
}

/* ── Genius Section ─────────────────────────────────── */
function buildGeniusSection(genius, mon, ds) {
  if (!genius.length) return '<div class="v3-empty"><div class="v3-empty-ico">🔍</div><div class="v3-empty-t">Không có học sinh nào đạt ≥9đ</div></div>';
  return `<div class="hof-section">
    <div class="hof-hdr"><span class="hof-ico">🌟</span><span class="hof-title">Thiên tài (≥9đ)</span><span class="hof-sub">${genius.length} học sinh</span></div>
    <div class="gp-grid">${genius.map((s, i) => {
      const topSubj = mon.reduce((best, m) => parseFloat(s.diem?.[m]||0) > parseFloat(s.diem?.[best]||0) ? m : best, mon[0]);
      const sc = fmtScore(s.tbHocKy);
      return `<div class="gp-card anim-fade" style="animation-delay:${i*.025}s" onclick="typeof showDetail==='function'&&showDetail(${s.stt})">
        <span class="gp-emo">${s.gioiTinh==='Nam'?'👦':'👧'}</span>
        <span class="gp-name">${s.hoTen}</span>
        <span class="gp-score">${parseFloat(s.tbHocKy).toFixed(1)}</span>
        <span class="gp-subject">${topSubj||''}</span>
      </div>`;
    }).join('')}</div>
  </div>`;
}

/* ── TVTT Section ─────────────────────────────────────── */
function buildTvttSection(tvtt) {
  if (!tvtt.length) return '<div class="v3-empty"><div class="v3-empty-ico">🎉</div><div class="v3-empty-t">Không có học sinh nào dưới 5 điểm TB!</div></div>';
  return `
    <div class="tvtt-card">
      <div class="tvtt-title">🧠 Thông Minh Vượt Thời Đại
        <span style="font-size:10px;font-weight:600;color:rgba(253,121,168,.7)">(TB &lt; 5 · ${tvtt.length} học sinh)</span>
      </div>
      <div class="tvtt-grid">
        ${tvtt.map((s, i) => {
          const sc = fmtScore(s.tbHocKy);
          return `<div class="tvtt-row" style="animation-delay:${i*.03}s" onclick="typeof showDetail==='function'&&showDetail(${s.stt})">
            <span style="font-size:14px">${i<3?['🥇','🥈','🥉'][i]:'🤔'}</span>
            <span style="flex:1;font-size:12px;font-weight:700">${s.hoTen}</span>
            <span style="font-size:9.5px;color:var(--t4)">${s.lop}</span>
            <span class="diem-score ${sc.cls}">${sc.txt}</span>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="hof-section" style="animation-delay:.1s">
      <div class="hof-hdr">
        <span class="hof-ico">💪</span>
        <span class="hof-title">Cần cố gắng thêm (TB &lt; 5)</span>
        <span class="hof-sub">${tvtt.length} học sinh</span>
      </div>
      <div class="hof-list">
        ${tvtt.map((s, i) => {
          const sc = fmtScore(s.tbHocKy);
          return `<div class="hof-row" onclick="typeof showDetail==='function'&&showDetail(${s.stt})">
            <span class="hof-rank low" style="font-size:10px">${i+1}</span>
            <span class="hof-name">${s.hoTen}</span>
            <span class="hof-lop">${s.lop}</span>
            <span class="diem-score ${sc.cls}">${sc.txt}</span>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

/* ── Theo môn Section ─────────────────────────────────── */
function buildSubjSection(mon, ds, subjAvg) {
  const maxAvg = Math.max(...Object.values(subjAvg), 0.1);
  const colors = ['#ffd700','#4eff91','#74b9ff','#fd79a8','#a29bfe','#fdcb6e','#48dbfb','#ff6b9d','#55efc4','#fab1a0','#6c5ce7','#e17055','#0984e3'];
  const ICONS  = ['📐','📝','🌍','🔬','⚗️','🌱','🏛️','🌏','⚖️','💻','🔧','🏃','🎖️'];
  return `
    <div class="hof-section">
      <div class="hof-hdr"><span class="hof-ico">📊</span><span class="hof-title">Điểm trung bình theo môn</span></div>
      <div style="padding:12px 14px">
        <div class="subj-dist">
          ${mon.map((m, i) => {
            const avg = subjAvg[m] || 0;
            const sc  = fmtScore(avg);
            return `<div class="subj-dist-row">
              <span class="subj-dist-lbl">${m}</span>
              <div class="subj-dist-bar">
                <div class="subj-dist-fill" style="width:${(avg/10*100).toFixed(1)}%;background:${colors[i%colors.length]}"></div>
              </div>
              <span class="subj-dist-num"><span class="diem-score ${sc.cls}" style="font-size:10px;padding:1px 5px">${avg.toFixed(2)}</span></span>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin-top:10px">
      ${mon.map((m, i) => {
        const top3 = [...ds].filter(s => s.diem?.[m] != null)
          .sort((a, b) => parseFloat(b.diem?.[m]||0) - parseFloat(a.diem?.[m]||0))
          .slice(0, 3);
        return `<div class="hof-section">
          <div class="hof-hdr" style="padding:8px 10px">
            <span style="font-size:14px">${ICONS[i%13]}</span>
            <span class="hof-title" style="font-size:11.5px">Môn ${m}</span>
            <span class="hof-sub" style="font-size:9.5px">TB: ${(subjAvg[m]||0).toFixed(2)}</span>
          </div>
          <div class="hof-list" style="max-height:120px">
            ${top3.map((s, ri) => `<div class="hof-row" style="padding:5px 8px" onclick="typeof showDetail==='function'&&showDetail(${s.stt})">
              <span class="hof-rank ${ri===0?'gold':ri===1?'silver':'bronze'}">${ri===0?'🥇':ri===1?'🥈':'🥉'}</span>
              <span class="hof-name" style="font-size:11.5px">${s.hoTen.split(' ').slice(-2).join(' ')}</span>
              <span class="hof-score top" style="font-size:12px">${parseFloat(s.diem?.[m]).toFixed(1)}</span>
            </div>`).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

/* ── Modal: điểm cá nhân (injected into detail modal) ── */
function injectDiemModalTab(stt) {
  if (!AppState.diemData?.diemHocSinh?.length) return;
  setTimeout(() => {
    const row = document.querySelector('.modal-tabs');
    if (!row || row.querySelector('[data-v3diem]')) return;
    const btn = document.createElement('button');
    btn.className = 'modal-tab'; btn.setAttribute('data-v3diem', '1');
    btn.innerHTML = '📊 Điểm';
    btn.onclick = () => {
      document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('on'));
      document.querySelectorAll('.modal-pane').forEach(p => p.classList.remove('on'));
      btn.classList.add('on');
      let pane = document.getElementById('v3PaneDiem');
      if (!pane) {
        pane = document.createElement('div');
        pane.id = 'v3PaneDiem'; pane.className = 'modal-pane';
        const act = document.getElementById('MOD')?.querySelector('.mactions');
        if (act) document.getElementById('MOD').insertBefore(pane, act);
        else document.getElementById('MOD')?.appendChild(pane);
      }
      pane.classList.add('on');
      buildDiemPane(stt, pane);
    };
    row.appendChild(btn);
  }, 80);
}

function buildDiemPane(stt, pane) {
  const s   = AppState.diemData.diemHocSinh?.find(x => x.stt === stt);
  const mon = AppState.diemData.monHoc || [];
  if (!s) {
    pane.innerHTML = '<div style="padding:24px;text-align:center;color:var(--t4);font-size:12px">Chưa có dữ liệu điểm cho học sinh này</div>';
    return;
  }
  const sc = fmtScore(s.tbHocKy);
  pane.innerHTML = `<div style="padding:14px 16px">
    <div style="display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:14px;padding:12px;background:var(--surface2);border-radius:var(--rs)">
      <div class="diem-score ${sc.cls}" style="font-size:28px;padding:5px 20px;font-weight:900">${sc.txt}</div>
      <div>
        <div style="font-size:13px;font-weight:800;color:var(--t1)">${s.xepLoai || '–'}</div>
        <div style="font-size:10px;color:var(--t4)">${AppState.diemData.meta?.hocKy||''} · ${AppState.diemData.meta?.namHoc||''}</div>
      </div>
    </div>
    <div class="v3-modal-scores">${mon.map(m => {
      const ms = fmtScore(s.diem?.[m]);
      return `<div class="v3-msc"><div class="v3-msc-m">${m}</div><div class="v3-msc-v ${ms.cls}">${ms.txt}</div></div>`;
    }).join('')}</div>
  </div>`;
}

/* ── Upload handler ─────────────────────────────────── */
function v3HandleDiem(input) {
  const file = input.files?.[0]; if (!file) return;
  const fr = new FileReader();
  fr.onload = e => {
    try {
      AppState.diemData = JSON.parse(e.target.result);
      _diemQ = ''; _diemTab = 'table';
      augmentIndexWithDiem();
      vToast(`✅ Đã tải ${(AppState.diemData.diemHocSinh||[]).length} HS`);
      renderDiem();
    } catch { vToast('❌ File JSON không hợp lệ'); }
  };
  fr.readAsText(file, 'utf-8');
}
