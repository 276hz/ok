'use strict';
/* ═══════════════════════════════════════════════════════
   THPT Cẩm Bình · patches.js  (v3 — thin init only)

   Không patch window.tab / window.page / window.filtered.
   Tất cả state dùng AppState (defined in core.js).
   File này chỉ:
   1. Gọi init helpers từ ui.js sau DOM load
   2. Guard inject viewNews/tab nếu HTML thiếu
   3. Wrap showDetail để inject modal extras (diem, region, share)
   4. Không patch getFiltered / renderAll / cp — đã có sẵn trong core.js
═══════════════════════════════════════════════════════ */

/* ── Guard: inject #viewNews nếu HTML thiếu ─────────── */
function ensureViewNews(){
  if(document.getElementById('viewNews')) return;
  const div=document.createElement('div');
  div.id='viewNews'; div.style.cssText='display:none;flex:1;overflow-y:auto;min-height:0';
  document.getElementById('content')?.appendChild(div);
}

/* ── Guard: inject news tab nếu HTML thiếu ──────────── */
function ensureNewsTab(){
  const tabs=document.querySelector('.h-tabs');
  if(!tabs||tabs.querySelector('[data-v3="news"]')) return;
  const btn=document.createElement('button');
  btn.className='tab'; btn.setAttribute('data-v3','news');
  btn.innerHTML='📰'; btn.title='6·Tin tức';
  btn.onclick=function(){ window.__tab('news',this); };
  tabs.appendChild(btn);
}

/* ── Wrap showDetail: inject diem tab, region, share ── */
function wrapShowDetail(){
  const orig=window.showDetail;
  if(!orig){ console.warn('patches.js: showDetail not found in core/astro'); return; }
  window.showDetail=function(stt){
    orig(stt);
    // Inject extras sau khi modal render xong
    setTimeout(()=>{
      if(typeof injectDiemModalTab==='function') injectDiemModalTab(stt);
      if(typeof injectSameRegion  ==='function') injectSameRegion(stt);
      if(typeof injectShareBtn    ==='function') injectShareBtn(stt);
    },50);
  };
}

/* ── bootV3 ─────────────────────────────────────────── */
function bootV3(){
  ensureViewNews();
  ensureNewsTab();
  wrapShowDetail();

  // UI extras (tất cả defined trong ui.js, safe no-op nếu thiếu)
  if(typeof initScrollTop    ==='function') initScrollTop();
  if(typeof initKeyboard     ==='function') initKeyboard();
  if(typeof initTabTooltips  ==='function') initTabTooltips();
  if(typeof initCompare      ==='function') initCompare();
  if(typeof initClipHistory  ==='function') initClipHistory();
  if(typeof initSearchHistory==='function') initSearchHistory();
  if(typeof initAddrFilter   ==='function') initAddrFilter();
  if(typeof initFilterPill   ==='function') initFilterPill();
  if(typeof patchDarkMode    ==='function') patchDarkMode();

  console.log('🚀 THPT Cẩm Bình · bootV3 OK · '+new Date().toLocaleTimeString('vi-VN'));
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>setTimeout(bootV3,260));
} else {
  setTimeout(bootV3,300);
}
