'use strict';
/* ═══════════════════════════════════════════════════════
   THPT Cẩm Bình · core.js
   State duy nhất: window.AppState — không dùng window.tab/page/filtered
═══════════════════════════════════════════════════════ */

/* ── AppState ─────────────────────────────────────────── */
window.AppState = {
  ALL: [], filtered: [],
  tab: 'table', page: 1,
  sField: 'stt', sDir: 1,
  density: 'dense',
  addrQ: '',
  clipHist: [],
  diemData: null,
  newsData: null,
  newsUnread: 0,
};

/* ── Helpers ─────────────────────────────────────────── */
function stripDiacritics(s) {
  if (!s) return '';
  return String(s).normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[đĐ]/g, c => c==='đ'?'d':'D')
    .toLowerCase();
}

function buildIndex(s) {
  const n = stripDiacritics;
  const parts = String(s.hoTen||'').trim().split(/\s+/);
  s._nameTokens = parts.map(n);
  s._lastWord   = s._nameTokens[s._nameTokens.length-1]||'';
  s._nameFull   = n(s.hoTen);
  s._numIdx     = [s.soCMND,s.sdtBo,s.sdtMe].filter(Boolean).join('\0').toLowerCase();
  s._addrIdx    = n((s.diaChiChiTiet||'')+(s.thonXom||'')+(s.xaPhuongThuongTru||''));
}

function isNumQuery(q){ return /^\d+$/.test(q); }

function matchSearch(s, normQ){
  if(!normQ) return true;
  if(isNumQuery(normQ)) return s._numIdx.includes(normQ);
  const qt = normQ.split(/\s+/).filter(Boolean);
  if(qt.length>1) return qt.every(q=>s._nameTokens.some(t=>t.startsWith(q)));
  if(s._lastWord.startsWith(normQ)) return true;
  return s._nameTokens.some(t=>t.startsWith(normQ));
}

function matchScore(s, normQ){
  if(!normQ) return 0;
  if(s._lastWord.startsWith(normQ)) return 3;
  if(s._lastWord.includes(normQ))   return 2;
  if(s._nameTokens.some(t=>t.startsWith(normQ))) return 1;
  if(s._nameTokens.some(t=>t.includes(normQ)))   return 0.5;
  return 0;
}

function getSimilar(normQ, exclude){
  const ex=new Set(exclude.map(s=>s.stt));
  const f2=normQ.slice(0,2);
  const scored=[];
  for(const s of AppState.ALL){
    if(ex.has(s.stt)) continue;
    if(s._lastWord.startsWith(f2)||(normQ.length>=2&&s._lastWord.includes(normQ.slice(0,1))))
      scored.push({s, sc:s._lastWord.startsWith(f2)?2:1});
  }
  scored.sort((a,b)=>b.sc-a.sc);
  return scored.slice(0,5).map(x=>x.s);
}

function hlName(fullName, normQ){
  if(!fullName||!normQ) return fullName||'';
  const str=String(fullName), parts=str.split(/(\s+)/);
  const qt=normQ.split(/\s+/).filter(Boolean);
  const np=parts.map(p=>stripDiacritics(p));
  return parts.map((part,i)=>{
    if(!part.trim()) return part;
    const q=qt.find(q=>np[i].startsWith(q)); if(!q) return part;
    return `<mark>${part.slice(0,q.length)}</mark>${part.slice(q.length)}`;
  }).join('');
}

function hlSubstr(text, q){
  if(!text||!q) return text||'';
  const str=String(text); let res='',last=0,pos;
  while((pos=str.indexOf(q,last))!==-1){
    res+=str.slice(last,pos)+'<mark>'+str.slice(pos,pos+q.length)+'</mark>';
    last=pos+q.length;
  }
  return res+str.slice(last)||str;
}

function getSuggestions(rawQ){
  if(!rawQ||rawQ.length<1) return {main:[],similar:[]};
  const normQ=stripDiacritics(rawQ.trim());
  if(isNumQuery(normQ)) return {main:[],similar:[]};
  const seen=new Set(), scored=[];
  for(const s of AppState.ALL){
    if(!matchSearch(s,normQ)) continue;
    const key=s.lop+':'+s.hoTen;
    if(seen.has(key)) continue; seen.add(key);
    scored.push({s, sc:matchScore(s,normQ)});
  }
  scored.sort((a,b)=>b.sc-a.sc);
  const main=scored.slice(0,7).map(x=>x.s);
  if(main.length<3&&normQ.length>=2) return {main, similar:getSimilar(normQ,main)};
  return {main, similar:[]};
}

/* ── Score search (shared với diem.js) ────────────────── */
function parseScoreQuery(q){
  if(!q) return null;
  const nq=stripDiacritics(q.trim());
  if(/^(xuat|xuatsac|xsac)/.test(nq))       return {type:'xep',xep:'Xuất sắc'};
  if(/^(gioi)/.test(nq))                     return {type:'xep',xep:'Giỏi'};
  if(/^(kha)/.test(nq))                      return {type:'xep',xep:'Khá'};
  if(/^(tb|trungbinh|trung)/.test(nq))       return {type:'xep',xep:'Trung bình'};
  if(/^(yeu|kem)/.test(nq))                  return {type:'xep',xep:'Yếu'};
  const am=nq.match(/^(?:diem|tb)([><=!]+)([\d.]+)$/);
  if(am) return {type:'avg', op:am[1], val:parseFloat(am[2])};
  const sm=nq.match(/^([a-z]+)[><=:!]+([\d.]+)$/);
  if(sm){
    const M={toan:'Toán',van:'Văn',anh:'Anh',ly:'Lý',hoa:'Hóa'};
    const subj=M[sm[1]]; if(subj) return {type:'subj', subj, op:'>=', val:parseFloat(sm[2])};
  }
  return null;
}

function compareScore(val, op, thr){
  if(op==='>='||op==='=>') return val>=thr;
  if(op==='>') return val>thr;
  if(op==='<='||op==='=<') return val<=thr;
  if(op==='<') return val<thr;
  if(op==='='||op==='==') return Math.abs(val-thr)<0.05;
  return false;
}

/* ── DOM shorthand ──────────────────────────────────── */
const $ = id => document.getElementById(id);
const dash = () => '<span style="color:var(--t4)">—</span>';

/* ── Dark mode ──────────────────────────────────────── */
function toggleDark(){
  const html=document.documentElement;
  const dark=html.getAttribute('data-theme')!=='dark';
  html.style.transition='background .3s,color .3s';
  html.setAttribute('data-theme',dark?'dark':'light');
  $('dmBtn').innerHTML=dark?'☀️ <span>Light</span>':'🌙 <span>Dark</span>';
  setTimeout(()=>{html.style.transition='';},400);
  try{localStorage.setItem('thpt-theme',dark?'dark':'light');}catch(e){}
}
(function initTheme(){
  try{
    if(localStorage.getItem('thpt-theme')==='dark'){
      document.documentElement.setAttribute('data-theme','dark');
      window.addEventListener('DOMContentLoaded',()=>{
        if($('dmBtn')) $('dmBtn').innerHTML='☀️ <span>Light</span>';
      });
    }
  }catch(e){}
})();

/* ── Skeleton ───────────────────────────────────────── */
function buildSkeleton(){
  $('skRows').innerHTML=Array.from({length:14},(_,i)=>`
    <div class="sk-row" style="animation-delay:${i*.04}s">
      <div class="sk sk-n"></div>
      <div class="sk sk-nm" style="width:${140+(i%5)*26}px"></div>
      <div class="sk sk-dt"></div>
      <div class="sk sk-ba" style="width:44px"></div>
      <div class="sk sk-ba" style="width:54px"></div>
      <div class="sk sk-ad" style="max-width:${110+(i%3)*36}px"></div>
      <div class="sk sk-ph"></div>
    </div>`).join('');
}

/* ══════════════════════════════════════════════════════
   TAB SWITCHING — sử dụng AppState.tab, không window.tab
══════════════════════════════════════════════════════ */
const ALL_VIEW_IDS=['viewTable','viewCard','viewClass','viewStats','viewDiem','viewPotd','viewNews'];

function switchTab(name, btn){
  AppState.tab  = name;   // cập nhật STATE TRƯỚC
  AppState.page = 1;

  ALL_VIEW_IDS.forEach(id=>{
    const e=document.getElementById(id); if(e) e.style.display='none';
  });
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('on'));
  if(btn) btn.classList.add('on');

  const MAP={table:'viewTable',card:'viewCard',class:'viewClass',
             stats:'viewStats',diem:'viewDiem',potd:'viewPotd',news:'viewNews'};
  const viewId=MAP[name];
  if(viewId){const e=document.getElementById(viewId);if(e) e.style.display='';}

  switch(name){
    case 'table': case 'card': case 'class':
      renderAll(); break;
    case 'stats':
      renderAll();
      if(typeof renderStatsExtra==='function') setTimeout(renderStatsExtra,80);
      break;
    case 'diem':
      if(typeof loadDiem==='function') loadDiem(); break;
    case 'news':
      if(typeof loadNews==='function') loadNews(); break;
    case 'potd':
      if(typeof renderPOTD==='function') renderPOTD(); break;
  }
}

// Expose — HTML inline onclick dùng cả hai tên
window.__tab  = switchTab;
window.setTab = switchTab;

/* ══════════════════════════════════════════════════════
   FILTER / SORT
══════════════════════════════════════════════════════ */
function getFiltered(){
  const rawQ=$('SI').value.trim();
  const normQ=stripDiacritics(rawQ);
  const kh=$('FK').value, lp=$('FL').value, gn=$('FG').value;
  const df=getDateFilter();
  const scoreQ=parseScoreQuery(rawQ);
  const addrQ=AppState.addrQ?stripDiacritics(AppState.addrQ):'';

  let results=AppState.ALL.filter(s=>{
    if(kh&&!s.lop?.startsWith(kh))  return false;
    if(lp&&s.lop!==lp)              return false;
    if(gn&&s.gioiTinh!==gn)         return false;
    if(!matchDateFilter(s,df))       return false;
    if(addrQ&&(!s._addrIdx||!s._addrIdx.includes(addrQ))) return false;
    if(scoreQ){
      const d=s._diemRef; if(!d) return false;
      if(scoreQ.type==='xep')  return d.xepLoai===scoreQ.xep;
      if(scoreQ.type==='avg')  return compareScore(parseFloat(d.tbHocKy)||0, scoreQ.op, scoreQ.val);
      if(scoreQ.type==='subj'){
        const sv=d.diem?.[scoreQ.subj];
        return sv!=null&&compareScore(parseFloat(sv), scoreQ.op, scoreQ.val);
      }
      return false;
    }
    if(normQ&&!matchSearch(s,normQ)) return false;
    return true;
  });

  if(normQ&&!isNumQuery(normQ)&&!scoreQ){
    results=results.map(s=>({s,sc:matchScore(s,normQ)}))
      .sort((a,b)=>b.sc-a.sc).map(x=>x.s);
  }
  return results;
}

function getSorted(arr){
  const f=$('SB').value||AppState.sField;
  return [...arr].sort((a,b)=>{
    const va=a[f]??'', vb=b[f]??'';
    if(f==='stt') return ((parseInt(va)||0)-(parseInt(vb)||0))*AppState.sDir;
    return String(va).localeCompare(String(vb),'vi')*AppState.sDir;
  });
}

function sortBy(field){
  if(AppState.sField===field) AppState.sDir*=-1;
  else{AppState.sField=field; AppState.sDir=1;}
  $('SB').value=field;
  document.querySelectorAll('thead th').forEach(th=>{
    th.classList.remove('sorted');
    const a=th.querySelector('.sarr');if(a) a.textContent='↕';
  });
  const th=document.querySelector(`thead th[data-col="${field}"]`);
  if(th){th.classList.add('sorted');const a=th.querySelector('.sarr');if(a) a.textContent=AppState.sDir===1?'↑':'↓';}
  AppState.filtered=getSorted(getFiltered());
  const rawQ=$('SI').value.trim(), normQ=stripDiacritics(rawQ), isNum=isNumQuery(normQ);
  const c=AppState.filtered.length;
  let rc=`Hiển thị <strong>${c.toLocaleString('vi')}</strong> / ${AppState.ALL.length.toLocaleString('vi')} học sinh`;
  if(rawQ) rc+=` <span class="tb-mode-tag">🔍 ${isNum?'CCCD/SĐT':'tên'}: "${rawQ}"</span>`;
  $('RC').innerHTML=rc;
  if(AppState.tab==='table') renderTable();
  else if(AppState.tab==='card') renderCards();
}

function syncLopSel(){
  const kh=$('FK').value, sel=$('FL'), cur=sel.value;
  const lops=[...new Set(AppState.ALL.map(s=>s.lop).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  sel.innerHTML='<option value="">📋 Tất cả lớp</option>';
  lops.filter(l=>!kh||l.startsWith(kh)).forEach(l=>{
    const o=document.createElement('option');
    o.value=l; o.textContent='Lớp '+l;
    if(l===cur) o.selected=true;
    sel.appendChild(o);
  });
}

/* ══════════════════════════════════════════════════════
   RENDER ALL
══════════════════════════════════════════════════════ */
function renderAll(){
  const rawQ=$('SI').value.trim(), normQ=stripDiacritics(rawQ), isNum=isNumQuery(normQ);
  const base=getFiltered();
  AppState.filtered=(normQ&&!isNum)?base:getSorted(base);
  const c=AppState.filtered.length;
  let rc=`Hiển thị <strong>${c.toLocaleString('vi')}</strong> / ${AppState.ALL.length.toLocaleString('vi')} học sinh`;
  if(rawQ) rc+=` <span class="tb-mode-tag">🔍 ${isNum?'CCCD/SĐT':'tên'}: "${rawQ}"</span>`;
  $('RC').innerHTML=rc;

  setTimeout(()=>{
    if(typeof updateFilterPill==='function') updateFilterPill();
    if(typeof initBdHover==='function')      initBdHover();
  },60);

  switch(AppState.tab){
    case 'table': renderTable();   break;
    case 'card':  renderCards();   break;
    case 'class': renderClasses(); break;
    case 'stats': renderStats();   break;
  }
}

/* ── Pagination ─────────────────────────────────────── */
function getPage(){
  const pp=parseInt($('PP').value)||50;
  const tp=Math.max(1,Math.ceil(AppState.filtered.length/pp));
  if(AppState.page>tp) AppState.page=tp;
  return {items:AppState.filtered.slice((AppState.page-1)*pp,AppState.page*pp),tp};
}

function buildPg(){
  const {tp}=getPage(); if(tp<=1) return '';
  const p=AppState.page;
  const show=new Set([1,tp,p-1,p,p+1].filter(x=>x>=1&&x<=tp));
  let h=`<button class="pg-btn" onclick="go(${p-1})" ${p===1?'disabled':''}>‹</button>`;
  let prev=0;
  [...show].sort((a,b)=>a-b).forEach(x=>{
    if(prev&&x-prev>1) h+=`<span class="pg-dots">…</span>`;
    h+=`<button class="pg-btn${x===p?' on':''}" onclick="go(${x})">${x}</button>`;
    prev=x;
  });
  h+=`<button class="pg-btn" onclick="go(${p+1})" ${p===tp?'disabled':''}>›</button>`;
  h+=`<span class="pg-info">Trang ${p}/${tp} · ${AppState.filtered.length.toLocaleString('vi')} kết quả</span>`;
  return h;
}

function go(p){
  const {tp}=getPage();
  AppState.page=Math.max(1,Math.min(p,tp));
  renderAll();
  [$('tblScroll'),document.querySelector('.card-scroll')].forEach(e=>{if(e) e.scrollTop=0;});
}

/* ── Render: Table ─────────────────────────────────── */
function renderTable(){
  const {items}=getPage();
  const tbody=$('TB');
  const rawQ=$('SI').value.trim(), normQ=stripDiacritics(rawQ), isNum=isNumQuery(normQ);
  $('mainTable').className=AppState.density==='loose'?'tbl-loose':'';

  if(!items.length){
    let sim='';
    if(rawQ&&!isNum&&normQ.length>=2){
      const ss=getSimilar(normQ,[]);
      if(ss.length) sim=`<div class="no-similar"><div class="no-sim-lbl">Có thể bạn tìm:</div>
        <div class="no-sim-list">${ss.map(s=>`<span class="no-sim-item"
          onclick="selectSuggestion('${s.hoTen.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')">
          ${s.hoTen} <span>${s.lop||''}</span></span>`).join('')}</div></div>`;
    }
    tbody.innerHTML=`<tr><td colspan="11"><div class="no-rows">
      <div class="no-rows-ico">🔍</div><h3>Không tìm thấy học sinh nào</h3>
      <p>Thử tìm tên khác hoặc kiểm tra lại bộ lọc</p>${sim}</div></td></tr>`;
    $('pg-tbl').innerHTML=''; return;
  }

  tbody.innerHTML=items.map(s=>{
    const addr=s.diaChiChiTiet||s.thonXom||s.xaPhuongThuongTru||'';
    const gCls=s.gioiTinh==='Nam'?'bnam':'bnu';
    const kCls=`b${s.lop?.substring(0,2)||''}`;
    let nm=s.hoTen||'',cc=s.soCMND||'',sb=s.sdtBo||'',sm=s.sdtMe||'';
    if(rawQ){
      if(isNum){cc=hlSubstr(s.soCMND,normQ);sb=hlSubstr(s.sdtBo,normQ);sm=hlSubstr(s.sdtMe,normQ);}
      else nm=hlName(s.hoTen,normQ);
    }
    return `<tr class="anim-row" onclick="showDetail(${s.stt})">
      <td style="color:var(--t4);font-size:11.5px">${s.stt}</td>
      <td class="td-name">${nm||dash()}</td>
      <td style="font-size:12px">${s.ngaySinh||dash()}</td>
      <td><span class="b ${gCls}">${s.gioiTinh||''}</span></td>
      <td><span class="b ${kCls}">${s.lop||''}</span></td>
      <td title="${addr}" style="color:var(--t3)">${addr||dash()}</td>
      <td style="font-size:12px">${cc||dash()}</td>
      <td>${s.tenBo||dash()}</td>
      <td>${s.sdtBo?`<span class="cp-link" onclick="event.stopPropagation();cp('${s.sdtBo}')">${sb}</span>`:dash()}</td>
      <td>${s.tenMe||dash()}</td>
      <td>${s.sdtMe?`<span class="cp-link" onclick="event.stopPropagation();cp('${s.sdtMe}')">${sm}</span>`:dash()}</td>
    </tr>`;
  }).join('');
  $('pg-tbl').innerHTML=buildPg();
}

function setDensity(v){
  AppState.density=v;
  $('dtD').classList.toggle('on',v==='dense');
  $('dtL').classList.toggle('on',v==='loose');
  if(AppState.tab==='table') renderTable();
}

/* ── Render: Cards ─────────────────────────────────── */
function renderCards(){
  const {items}=getPage();
  const grid=$('CG');
  const rawQ=$('SI').value.trim(), normQ=stripDiacritics(rawQ), isNum=isNumQuery(normQ);
  if(!items.length){
    let sim='';
    if(rawQ&&!isNum&&normQ.length>=2){
      const ss=getSimilar(normQ,[]);
      if(ss.length) sim=`<div class="no-similar"><div class="no-sim-lbl">Có thể bạn tìm:</div>
        <div class="no-sim-list">${ss.map(s=>`<span class="no-sim-item"
          onclick="selectSuggestion('${s.hoTen.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')">
          ${s.hoTen} <span>${s.lop||''}</span></span>`).join('')}</div></div>`;
    }
    grid.innerHTML=`<div class="no-rows" style="grid-column:1/-1">
      <div class="no-rows-ico">🔍</div><h3>Không tìm thấy học sinh nào</h3>
      <p>Thử tìm tên khác hoặc kiểm tra lại bộ lọc</p>${sim}</div>`;
    $('pg-card').innerHTML=''; return;
  }
  grid.innerHTML=items.map((s,i)=>{
    let nm=s.hoTen||'–', cc=s.soCMND||'–';
    if(rawQ){if(isNum){cc=hlSubstr(s.soCMND,normQ)||'–';}else{nm=hlName(s.hoTen,normQ)||'–';}}
    return `<div class="scard anim-fade" style="animation-delay:${Math.min(i*.04,.4)}s" onclick="showDetail(${s.stt})">
      <div class="sc-name">${nm}</div><div class="sc-stt">STT #${s.stt}</div>
      <div class="sc-badges">
        <span class="b b${s.lop?.substring(0,2)||''}">${s.lop||'–'}</span>
        <span class="b ${s.gioiTinh==='Nam'?'bnam':'bnu'}">${s.gioiTinh||'–'}</span>
      </div>
      <div class="sc-grid">
        <div class="sc-f"><span class="sc-fl">Ngày sinh</span><span class="sc-fv">${s.ngaySinh||'–'}</span></div>
        <div class="sc-f"><span class="sc-fl">CCCD</span><span class="sc-fv">${cc}</span></div>
        <div class="sc-f"><span class="sc-fl">Thôn/xóm</span><span class="sc-fv">${s.thonXom||s.xaPhuongThuongTru||'–'}</span></div>
        <div class="sc-f"><span class="sc-fl">Quê quán</span><span class="sc-fv">${s.queQuan||'–'}</span></div>
      </div>
      <hr class="sc-div">
      <div class="sc-parents">
        <div class="sc-par"><div class="sc-par-l">👨 Bố</div><div class="sc-par-n">${s.tenBo||'–'}</div><div class="sc-par-j">${s.ngheNghiepBo||''}</div><div class="sc-par-s">${s.sdtBo||'—'}</div></div>
        <div class="sc-par"><div class="sc-par-l">👩 Mẹ</div><div class="sc-par-n">${s.tenMe||'–'}</div><div class="sc-par-j">${s.ngheNghiepMe||''}</div><div class="sc-par-s">${s.sdtMe||'—'}</div></div>
      </div>
    </div>`;
  }).join('');
  $('pg-card').innerHTML=buildPg();
}

/* ── Render: Classes ─────────────────────────────────── */
function renderClasses(){
  const lopMap={};
  AppState.filtered.forEach(s=>{
    if(!s.lop) return;
    if(!lopMap[s.lop]) lopMap[s.lop]={t:0,m:0,f:0};
    lopMap[s.lop].t++;
    if(s.gioiTinh==='Nam') lopMap[s.lop].m++; else lopMap[s.lop].f++;
  });
  const lops=Object.keys(lopMap).sort((a,b)=>a.localeCompare(b,'vi'));
  if(!lops.length){
    $('clsContent').innerHTML='<div class="no-rows" style="margin-top:40px"><div class="no-rows-ico">🏫</div><h3>Không có lớp nào</h3></div>';
    return;
  }
  const kCol={'10':'var(--blue)','11':'var(--green)','12':'#8a1a0a'};
  const byK={'10':[],'11':[],'12':[]};
  lops.forEach(l=>{const k=l.substring(0,2);if(byK[k]) byK[k].push(l);});
  let html='';
  ['10','11','12'].forEach(k=>{
    const kl=byK[k]; if(!kl.length) return;
    const kTot=kl.reduce((a,l)=>a+lopMap[l].t,0);
    html+=`<div class="cls-section">
      <div class="cls-khoi" style="color:${kCol[k]}">Khối ${k} · ${kl.length} lớp · ${kTot.toLocaleString('vi')} HS</div>
      <div class="cls-grid">${kl.map((l,i)=>{
        const d=lopMap[l], mp=d.t?(d.m/d.t*100).toFixed(1):0;
        return `<div class="cls-card k${k} anim-pop" style="animation-delay:${i*.04}s" onclick="goLop('${l}')">
          <div class="cls-n">${l}</div><div class="cls-t">${d.t} học sinh</div>
          <div class="cls-bar"><div class="cls-bar-m" style="width:${mp}%"></div><div class="cls-bar-f" style="flex:1"></div></div>
          <div class="cls-gd"><span>👦 <strong>${d.m}</strong></span><span>👧 <strong>${d.f}</strong></span></div>
        </div>`;
      }).join('')}</div></div>`;
  });
  $('clsContent').innerHTML=html;
}

/* ── Render: Stats ─────────────────────────────────── */
function renderStats(){
  const data=AppState.filtered;
  const lops=[...new Set(data.map(s=>s.lop).filter(Boolean))];
  const k10=data.filter(s=>s.lop?.startsWith('10')).length;
  const k11=data.filter(s=>s.lop?.startsWith('11')).length;
  const k12=data.filter(s=>s.lop?.startsWith('12')).length;
  $('sTiles').innerHTML=[
    {n:data.length,l:'Tổng học sinh',c:'var(--red)'},
    {n:lops.length,l:'Số lớp',c:'var(--gold2)'},
    {n:data.filter(s=>s.gioiTinh==='Nam').length,l:'Nam',c:'var(--blue)'},
    {n:data.filter(s=>s.gioiTinh==='Nữ').length,l:'Nữ',c:'var(--pink)'},
    {n:k10,l:'Khối 10',c:'var(--blue)'},
    {n:k11,l:'Khối 11',c:'var(--green)'},
    {n:k12,l:'Khối 12',c:'#8a1a0a'},
    {n:lops.length?Math.round(data.length/lops.length):0,l:'TB HS/lớp',c:'#666'},
  ].map((t,i)=>`<div class="stile anim-fade" style="animation-delay:${i*.05}s">
    <div class="stile-n" style="color:${t.c}">${t.n.toLocaleString('vi')}</div>
    <div class="stile-l">${t.l}</div></div>`).join('');

  const bar=(entries,color,delay=0)=>{
    const mx=Math.max(...entries.map(e=>e[1]),1);
    return entries.map(([l,c],i)=>`<div class="bc-row" style="animation:rowFadeIn .22s ${delay+i*.04}s cubic-bezier(.22,1,.36,1) both">
      <div class="bc-lbl" title="${l}">${l.length>11?l.slice(0,11)+'…':l}</div>
      <div class="bc-track"><div class="bc-fill" style="width:${(c/mx*100).toFixed(1)}%;background:${color};min-width:${c>0?'18px':'0'}">${c>4?c+'('+( c/mx*100).toFixed(0)+'%)':c>0?c:''}</div></div>
      <div class="bc-n">${c}</div></div>`).join('');
  };

  const lopMap={};data.forEach(s=>{if(s.lop) lopMap[s.lop]=(lopMap[s.lop]||0)+1;});
  const sortedL=Object.entries(lopMap).sort((a,b)=>a[0].localeCompare(b[0],'vi'));
  const kCol={'10':'var(--blue)','11':'var(--green)','12':'#8a1a0a'};
  const mxL=Math.max(...sortedL.map(e=>e[1]),1);
  const occB={};data.forEach(s=>{if(s.ngheNghiepBo) occB[s.ngheNghiepBo]=(occB[s.ngheNghiepBo]||0)+1;});
  const topB=Object.entries(occB).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const regMap={};data.forEach(s=>{const x=s.xaPhuongThuongTru||s.queQuan;if(x) regMap[x]=(regMap[x]||0)+1;});
  const topR=Object.entries(regMap).sort((a,b)=>b[1]-a[1]).slice(0,10);

  $('sCharts').innerHTML=`
    <div class="chart-card anim-fade" style="animation-delay:.1s">
      <h3>📊 Học sinh theo lớp</h3>
      <div class="bc">${sortedL.map(([l,c],i)=>`<div class="bc-row" style="animation:rowFadeIn .22s ${i*.028}s cubic-bezier(.22,1,.36,1) both">
        <div class="bc-lbl">${l}</div>
        <div class="bc-track"><div class="bc-fill" style="width:${(c/mxL*100).toFixed(1)}%;background:${kCol[l.substring(0,2)]||'var(--red)'}">${c}</div></div>
        <div class="bc-n">${c}</div></div>`).join('')}</div>
    </div>
    <div class="chart-card anim-fade" style="animation-delay:.15s">
      <h3>⚧ Giới tính theo khối</h3>
      <div class="bc" style="gap:14px">
        ${['10','11','12'].map((k,ki)=>{
          const kd=data.filter(s=>s.lop?.startsWith(k));
          const kn=kd.filter(s=>s.gioiTinh==='Nam').length, kf=kd.length-kn;
          const tot=kd.length||1, mp=(kn/tot*100).toFixed(1);
          return `<div style="animation:fadeUp .3s ${ki*.08}s ease both">
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--t3);margin-bottom:5px">
              <strong style="color:${kCol[k]}">Khối ${k}</strong><span>${kd.length} HS</span></div>
            <div class="bc-track" style="height:26px;border-radius:5px">
              <div style="display:flex;height:100%">
                <div style="width:${mp}%;background:var(--blue);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;min-width:${kn?'24px':'0'}">${kn||''}</div>
                <div style="flex:1;background:var(--pink);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;min-width:${kf?'24px':'0'}">${kf||''}</div>
              </div></div>
            <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--t3);margin-top:3px">
              <span>👦 Nam ${mp}%</span><span>Nữ ${(100-parseFloat(mp)).toFixed(1)}% 👧</span></div>
          </div>`;
        }).join('')}
        <div class="legend"><span><span class="ld" style="background:var(--blue)"></span>Nam</span><span><span class="ld" style="background:var(--pink)"></span>Nữ</span></div>
      </div>
    </div>
    <div class="chart-card anim-fade" style="animation-delay:.2s">
      <h3>💼 Nghề nghiệp bố (top 8)</h3>
      <div class="bc">${bar(topB,'#7a4a1a',.2)}</div>
    </div>
    <div class="chart-card anim-fade" style="animation-delay:.25s">
      <h3>📍 Phân bố địa bàn (top 10)</h3>
      <div class="bc">${bar(topR,'#1a5a7a',.25)}</div>
    </div>`;
}

/* ══════════════════════════════════════════════════════
   SUGGESTIONS
══════════════════════════════════════════════════════ */
let _sugIdx=-1;

function showSuggestions(rawQ){
  const box=$('sugBox');
  if(!rawQ||rawQ.trim().length<1){hideSuggestions();return;}
  const normQ=stripDiacritics(rawQ.trim());
  _sugIdx=-1;
  const {main,similar}=getSuggestions(rawQ);
  if(!main.length&&!similar.length){hideSuggestions();return;}
  let html=main.map(s=>`<div class="s-sug-item" onclick="selectSuggestion('${s.hoTen.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')">
    <span>${hlName(s.hoTen,normQ)}</span><span class="s-sug-cls">${s.lop||''}</span></div>`).join('');
  if(similar.length){
    html+='<div class="s-sug-sep">Tên tương tự</div>';
    html+=similar.map(s=>`<div class="s-sug-item s-sug-sim" onclick="selectSuggestion('${s.hoTen.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')">
      <span>${hlName(s.hoTen,normQ)||s.hoTen}</span><span class="s-sug-cls">${s.lop||''}</span></div>`).join('');
  }
  box.innerHTML=html; box.classList.add('on');
}

function hideSuggestions(){$('sugBox').classList.remove('on');_sugIdx=-1;}

function selectSuggestion(name){
  $('SI').value=name;
  $('SC').classList.add('on');
  $('smPill').classList.toggle('on',!isNumQuery(stripDiacritics(name)));
  hideSuggestions();
  AppState.page=1; renderAll(); updateChips(); updateBanner();
}

/* ══════════════════════════════════════════════════════
   BANNER / CHIPS / DATE / SEARCH CONTROL
══════════════════════════════════════════════════════ */
function updateBanner(){
  const q=$('SI').value.trim(), normQ=stripDiacritics(q), scoreQ=parseScoreQuery(q);
  const banner=$('searchBanner');
  if(q&&(!isNumQuery(normQ)||scoreQ)){
    banner.classList.add('on');
    if(scoreQ){
      banner.classList.add('score-search');
      const labels={xep:`Xếp loại: ${scoreQ.xep}`,avg:`Điểm TB ${scoreQ.op}${scoreQ.val}`,subj:`Môn ${scoreQ.subj} ${scoreQ.op}${scoreQ.val}`};
      $('sbTag').textContent=labels[scoreQ.type]||'"'+q+'"';
      $('sbCount').textContent=`· ${AppState.filtered.length.toLocaleString('vi')} HS`;
    } else {
      banner.classList.remove('score-search');
      $('sbTag').textContent='"'+q+'"';
      $('sbCount').textContent=`· ${AppState.filtered.length.toLocaleString('vi')} kết quả`;
    }
  } else {
    banner.classList.remove('on');
  }
}

function updateChips(){
  const q=$('SI').value.trim(),kh=$('FK').value,lp=$('FL').value,gn=$('FG').value;
  const df=getDateFilter();
  const c=[];
  if(q)  c.push({l:`"${q}"`,fn:'clearSearch()'});
  if(kh) c.push({l:`Khối ${kh}`,fn:`$('FK').value='';syncLopSel();AppState.page=1;renderAll();updateChips();updateBanner();`});
  if(lp) c.push({l:`Lớp ${lp}`,fn:`$('FL').value='';AppState.page=1;renderAll();updateChips();`});
  if(gn) c.push({l:gn,fn:`$('FG').value='';AppState.page=1;renderAll();updateChips();`});
  if(df.active){
    const parts=[];
    if(df.d) parts.push('Ngày '+df.d);
    if(df.m) parts.push('Tháng '+df.m);
    if(df.y) parts.push('Năm '+df.y);
    c.push({l:'🗓 '+parts.join(' / '),fn:'clearDateSearch()'});
  }
  if(AppState.addrQ) c.push({l:'📍 '+AppState.addrQ,fn:'v3ClearAddr()'});
  const w=$('chips');
  w.className='h-chips'+(c.length?' on':'');
  w.innerHTML=c.map(x=>`<span class="chip" onclick="${x.fn}">${x.l} ✕</span>`).join('')
    +(c.length>1?`<span class="chip" onclick="resetAll()">Xóa tất cả ✕</span>`:'');
}

function onDateSearch(){AppState.page=1;renderAll();updateChips();}
function clearDateSearch(){
  $('DSDay').value='';$('DSMon').value='';$('DSYear').value='';
  AppState.page=1;renderAll();updateChips();
}
function getDateFilter(){
  const d=($('DSDay')&&$('DSDay').value.trim())||'';
  const m=($('DSMon')&&$('DSMon').value.trim())||'';
  const y=($('DSYear')&&$('DSYear').value.trim())||'';
  return {d,m,y,active:!!(d||m||y)};
}
function matchDateFilter(s,df){
  if(!df.active) return true;
  const p=(s.ngaySinh||'').split('/'); if(p.length<3) return false;
  if(df.d&&parseInt(p[0])!==parseInt(df.d)) return false;
  if(df.m&&parseInt(p[1])!==parseInt(df.m)) return false;
  if(df.y&&parseInt(p[2])!==parseInt(df.y)) return false;
  return true;
}

function clearSearch(){
  $('SI').value='';
  $('SC').classList.remove('on');
  $('smPill').classList.remove('on','score-mode');
  $('smPill').textContent='TÊN';
  $('searchBanner').classList.remove('on','score-search');
  hideSuggestions();
  AppState.page=1;renderAll();updateChips();$('SI').focus();
}

function resetAll(){
  $('SI').value='';$('FK').value='';$('FG').value='';
  if($('DSDay'))  $('DSDay').value='';
  if($('DSMon'))  $('DSMon').value='';
  if($('DSYear')) $('DSYear').value='';
  AppState.addrQ='';
  const ai=document.getElementById('v3AddrInp');if(ai) ai.value='';
  $('SC').classList.remove('on');
  $('smPill').classList.remove('on','score-mode');
  $('searchBanner').classList.remove('on','score-search');
  hideSuggestions();
  syncLopSel();$('FL').value='';
  AppState.page=1;renderAll();updateChips();
  toast('✓ Đã đặt lại tất cả bộ lọc');
}

/* ══════════════════════════════════════════════════════
   QUICK STATS / FILTER
══════════════════════════════════════════════════════ */
function updateQuickStats(){
  if(!AppState.ALL.length) return;
  $('quickStatBar').style.display='flex';
  const now=new Date();
  const dd=String(now.getDate()).padStart(2,'0'), mm=String(now.getMonth()+1).padStart(2,'0');
  const bdCount=AppState.ALL.filter(s=>{const p=(s.ngaySinh||'').split('/');return p.length>=2&&p[0]===dd&&p[1]===mm;}).length;
  const k10=AppState.ALL.filter(s=>s.lop?.startsWith('10')).length;
  const k11=AppState.ALL.filter(s=>s.lop?.startsWith('11')).length;
  const k12=AppState.ALL.filter(s=>s.lop?.startsWith('12')).length;
  const nam=AppState.ALL.filter(s=>s.gioiTinh==='Nam').length;
  const nu =AppState.ALL.filter(s=>s.gioiTinh==='Nữ').length;
  function animStat(id,val){
    const el=document.getElementById(id);if(!el)return;
    const dur=650,steps=28;let i=0;
    el.style.animation='none';void el.offsetWidth;
    el.style.animation='qs-num-bounce .4s cubic-bezier(.34,1.56,.64,1) both';
    const iv=setInterval(()=>{i++;el.textContent=Math.round(val*(i/steps)).toLocaleString('vi');if(i>=steps){el.textContent=val.toLocaleString('vi');clearInterval(iv);}},dur/steps);
  }
  animStat('qs-bd',bdCount);animStat('qs-k10',k10);
  animStat('qs-k11',k11);animStat('qs-k12',k12);
  animStat('qs-nam',nam);animStat('qs-nu',nu);
}

function quickFilter(type){
  const now=new Date();
  const dd=String(now.getDate()).padStart(2,'0'), mm=String(now.getMonth()+1).padStart(2,'0');
  if(type==='birthday'){
    $('DSDay').value=parseInt(dd);$('DSMon').value=parseInt(mm);$('DSYear').value='';
    AppState.page=1;renderAll();updateChips();
  } else if(type==='k10'){$('FK').value='10';syncLopSel();AppState.page=1;renderAll();updateChips();updateBanner();}
    else if(type==='k11'){$('FK').value='11';syncLopSel();AppState.page=1;renderAll();updateChips();updateBanner();}
    else if(type==='k12'){$('FK').value='12';syncLopSel();AppState.page=1;renderAll();updateChips();updateBanner();}
    else if(type==='nam'){$('FG').value='Nam';AppState.page=1;renderAll();updateChips();updateBanner();}
    else if(type==='nu') {$('FG').value='Nữ'; AppState.page=1;renderAll();updateChips();updateBanner();}
}

/* ══════════════════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════════════════ */
function cp(txt){
  navigator.clipboard.writeText(txt).then(()=>toast('📋 Đã copy: '+txt));
  AppState.clipHist=[txt,...AppState.clipHist.filter(t=>t!==txt)].slice(0,3);
}

function toast(msg){
  const t=$('toast');t.textContent=msg;t.classList.add('on');
  clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),2700);
}

function closeModal(){$('OV').classList.remove('on');}

function goLop(lop){
  $('FK').value=lop.substring(0,2);syncLopSel();$('FL').value=lop;
  AppState.page=1;
  const firstTab=document.querySelectorAll('.tab')[0];
  switchTab('table',firstTab);
  updateChips();
}

function animCount(id,target){
  const el=$(id),dur=800,steps=35;let i=0;
  const iv=setInterval(()=>{
    i++;el.textContent=Math.round(target*(i/steps)).toLocaleString('vi');
    if(i>=steps){el.textContent=target.toLocaleString('vi');clearInterval(iv);}
  },dur/steps);
}

function printStudent(stt){
  const s=AppState.ALL.find(x=>x.stt===stt);if(!s)return;
  const w=window.open('','_blank','width=560,height=680');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${s.hoTen}</title>
  <style>body{font-family:sans-serif;padding:20px;font-size:13px;line-height:1.7}h2{color:#8b1a10;margin-bottom:12px}
  table{border-collapse:collapse;width:100%}td{padding:7px 11px;border:1px solid #ddd}
  td:first-child{font-weight:600;width:42%;background:#f9f6f0;color:#666}.ft{margin-top:16px;font-size:10.5px;color:#aaa}
  </style></head><body><h2>${s.hoTen}</h2><table>
  <tr><td>Lớp</td><td>${s.lop||'–'}</td></tr><tr><td>Ngày sinh</td><td>${s.ngaySinh||'–'}</td></tr>
  <tr><td>Giới tính</td><td>${s.gioiTinh||'–'}</td></tr><tr><td>CMND/CCCD</td><td>${s.soCMND||'–'}</td></tr>
  <tr><td>Thôn xóm</td><td>${s.thonXom||'–'}</td></tr><tr><td>Xã/phường</td><td>${s.xaPhuongThuongTru||'–'}</td></tr>
  <tr><td>Quê quán</td><td>${s.queQuan||'–'}</td></tr><tr><td>Tên bố</td><td>${s.tenBo||'–'}</td></tr>
  <tr><td>Nghề bố</td><td>${s.ngheNghiepBo||'–'}</td></tr><tr><td>SĐT bố</td><td>${s.sdtBo||'–'}</td></tr>
  <tr><td>Tên mẹ</td><td>${s.tenMe||'–'}</td></tr><tr><td>Nghề mẹ</td><td>${s.ngheNghiepMe||'–'}</td></tr>
  <tr><td>SĐT mẹ</td><td>${s.sdtMe||'–'}</td></tr></table>
  <p class="ft">THPT Cẩm Bình · Năm học 2025–2026 · In ngày ${new Date().toLocaleDateString('vi')}</p>
  <script>window.print();<\/script></body></html>`);
  w.document.close();
}

/* ══════════════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════════════ */
async function boot(){
  buildSkeleton();
  try{
    const r=await fetch('data.json');
    if(!r.ok) throw new Error('fetch failed');
    const j=await r.json();
    AppState.ALL=j.hocSinh||[];
    if(!AppState.ALL.length) throw new Error('empty');
    AppState.ALL.forEach(buildIndex);
    init(j.meta||{});
  } catch {
    $('loadEl').innerHTML=`<div style="text-align:center;padding:80px 20px;color:var(--t3)">
      <div style="font-size:50px;margin-bottom:12px">⚠️</div>
      <div style="font-size:15px;font-weight:700;color:var(--red);margin-bottom:8px">Không tải được dữ liệu</div>
      <div style="font-size:13px">Đặt file <code>data.json</code> cùng thư mục với <code>index.html</code></div>
    </div>`;
  }
}

function init(meta){
  $('loadEl').style.display='none';
  // Show table view
  ALL_VIEW_IDS.forEach(id=>{const e=document.getElementById(id);if(e) e.style.display='none';});
  const vt=document.getElementById('viewTable');if(vt) vt.style.display='';

  const lSet=new Set(AppState.ALL.map(s=>s.lop).filter(Boolean));
  const nam=AppState.ALL.filter(s=>s.gioiTinh==='Nam').length;
  animCount('hTotal',AppState.ALL.length);
  animCount('hLop',  lSet.size);
  animCount('hNam',  nam);
  animCount('hNu',   AppState.ALL.length-nam);
  syncLopSel();

  const si=$('SI'); let _deb=null;
  si.addEventListener('input',()=>{
    const v=si.value, scoreQ=parseScoreQuery(v.trim());
    $('SC').classList.toggle('on',v.length>0);
    if(scoreQ){$('smPill').classList.add('on','score-mode');$('smPill').textContent='🎯';}
    else{$('smPill').classList.remove('score-mode');$('smPill').textContent='TÊN';
      $('smPill').classList.toggle('on',v.length>0&&!isNumQuery(stripDiacritics(v.trim())));}
    clearTimeout(_deb);
    _deb=setTimeout(()=>{
      AppState.page=1;renderAll();updateChips();updateBanner();
      if(!scoreQ) showSuggestions(v); else hideSuggestions();
    },80);
  });
  si.addEventListener('keydown',e=>{
    const box=$('sugBox'), items=box.querySelectorAll('.s-sug-item');
    if(!box.classList.contains('on')||!items.length) return;
    if(e.key==='ArrowDown'){e.preventDefault();_sugIdx=Math.min(_sugIdx+1,items.length-1);items.forEach((el,i)=>el.classList.toggle('active',i===_sugIdx));}
    else if(e.key==='ArrowUp'){e.preventDefault();_sugIdx=Math.max(_sugIdx-1,0);items.forEach((el,i)=>el.classList.toggle('active',i===_sugIdx));}
    else if(e.key==='Enter'&&_sugIdx>=0){e.preventDefault();items[_sugIdx]?.click();}
    else if(e.key==='Escape') hideSuggestions();
  });
  si.addEventListener('blur',()=>setTimeout(hideSuggestions,150));
  si.addEventListener('focus',()=>{if(si.value) showSuggestions(si.value);});
  $('FK').addEventListener('change',()=>{syncLopSel();AppState.page=1;renderAll();updateChips();});
  $('FL').addEventListener('change',()=>{AppState.page=1;renderAll();updateChips();});
  $('FG').addEventListener('change',()=>{AppState.page=1;renderAll();updateChips();});

  AppState.filtered=[...AppState.ALL];
  renderAll();

  // Background preload diem + news
  fetch('diem.json').then(r=>r.json()).then(d=>{
    AppState.diemData=d;
    if(d.diemHocSinh){
      const map={};d.diemHocSinh.forEach(x=>{map[x.stt]=x;});
      AppState.ALL.forEach(s=>{s._diemRef=map[s.stt]||null;});
    }
  }).catch(()=>{AppState.diemData=null;});

  fetch('news.json').then(r=>r.json()).then(d=>{
    AppState.newsData=d;
    AppState.newsUnread=(d.tinTuc||[]).filter(n=>n.quan_trong).length;
    if(typeof updateNewsBadge==='function') updateNewsBadge();
  }).catch(()=>{AppState.newsData=null;});

  setTimeout(updateQuickStats,100);
}

boot();
