'use strict';
/* ═══════════════════════════════════════════════════════
   THPT Cẩm Bình · news.js
   Chứa: tab Tin tức (load, render, filter, badge)
═══════════════════════════════════════════════════════ */


let _newsFilter = 'all';


const NEWS_LABELS = {
  all:           'Tất cả',
  thong_bao:     'Thông báo',
  su_kien:       'Sự kiện',
  nghi_le:       'Nghỉ lễ',
  hop_phu_huynh: 'Họp PH',
  thanh_tich:    'Thành tích',
  quan_trong:    '⭐ Quan trọng',
};

/* ── Load ─────────────────────────────────────────────── */
async function loadNews() {
  if (AppState.newsData) { renderNews(_newsFilter); return; }
  const view = document.getElementById('viewNews');
  if (view) view.innerHTML = '<div class="v3-loading"><div class="v3-spinner"></div><span>Đang tải tin tức…</span></div>';
  try {
    const r = await fetch('news.json');
    if (!r.ok) throw new Error('fetch failed');
    AppState.newsData = await r.json();
    AppState.newsUnread = (AppState.newsData.tinTuc || []).filter(n => n.quan_trong).length;
  } catch {
    AppState.newsData = { tinTuc: [] };
  }
  updateNewsBadge();
  renderNews(_newsFilter);
}

/* ── Render ─────────────────────────────────────────── */
function renderNews(filter) {
  _newsFilter = filter || 'all';
  const view = document.getElementById('viewNews'); if (!view) return;
  const items = AppState.newsData?.tinTuc || [];
  const shown = _newsFilter === 'all' ? items
    : _newsFilter === 'quan_trong' ? items.filter(n => n.quan_trong)
    : items.filter(n => n.loai === _newsFilter);

  view.innerHTML = `<div class="v3-page">
    <div class="v3-ph">
      <div class="v3-ph-left"><span class="v3-ph-ico">📰</span>
        <div class="v3-ph-text">
          <div class="v3-ph-h">Tin tức &amp; Thông báo</div>
          <div class="v3-ph-sub">${items.length} tin · THPT Cẩm Bình</div>
        </div>
      </div>
    </div>
    <div class="v3-ftabs">${Object.entries(NEWS_LABELS).map(([k, l]) => {
      const cnt = k === 'all' ? items.length
        : k === 'quan_trong' ? items.filter(n => n.quan_trong).length
        : items.filter(n => n.loai === k).length;
      if (cnt === 0 && k !== 'all') return '';
      return `<button class="v3-ftab${k === _newsFilter ? ' on' : ''}" onclick="renderNews('${k}')">
        ${l}${cnt ? `<span class="v3-ftab-n">${cnt}</span>` : ''}
      </button>`;
    }).join('')}</div>
    <div class="v3-news-list">
      ${shown.length === 0
        ? '<div class="v3-empty"><div class="v3-empty-ico">📭</div><div class="v3-empty-t">Không có tin nào</div></div>'
        : shown.map((n, i) => `
          <div class="v3-nc${n.quan_trong ? ' v3-nc-hot' : ''}" style="animation-delay:${i * .05}s" onclick="v3ToggleNews(this)">
            ${n.quan_trong ? '<div class="v3-nc-urgbar"></div>' : ''}
            <div class="v3-nc-main">
              <div class="v3-nc-ico">${n.icon || '📌'}</div>
              <div class="v3-nc-body">
                <div class="v3-nc-title">${n.tieu_de}</div>
                <div class="v3-nc-meta">
                  <span class="v3-nbadge v3-nb-${n.loai}">${NEWS_LABELS[n.loai] || n.loai}</span>
                  ${n.quan_trong ? '<span class="v3-nbadge v3-nb-hot">⭐ Quan trọng</span>' : ''}
                  <span class="v3-nc-date">📅 ${fmtDateISONws(n.ngay)}</span>
                </div>
                <div class="v3-nc-preview">${(n.noi_dung || '').slice(0, 90)}…</div>
              </div>
              <div class="v3-nc-arr">›</div>
            </div>
            <div class="v3-nc-content">${n.noi_dung || ''}</div>
          </div>`).join('')}
    </div>
  </div>`;
}

function fmtDateISONws(iso) {
  if (!iso) return '';
  const p = String(iso).split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
}

/* ── Toggle news card expand ────────────────────────── */
function v3ToggleNews(card) {
  const isOpen = card.classList.contains('v3-nc-open');
  document.querySelectorAll('.v3-nc.v3-nc-open').forEach(c => {
    c.classList.remove('v3-nc-open');
    const a = c.querySelector('.v3-nc-arr'); if (a) a.textContent = '›';
  });
  if (!isOpen) {
    card.classList.add('v3-nc-open');
    const a = card.querySelector('.v3-nc-arr'); if (a) a.textContent = '⌄';
    AppState.newsUnread = Math.max(0, AppState.newsUnread - 1);
    updateNewsBadge();
  }
}

/* ── Badge (unread count on news tab) ───────────────── */
function updateNewsBadge() {
  document.querySelectorAll('.tab[data-v3="news"]').forEach(t => {
    let b = t.querySelector('.v3-tbadge');
    if (AppState.newsUnread > 0) {
      if (!b) { b = document.createElement('span'); b.className = 'v3-tbadge'; t.appendChild(b); }
      b.textContent = AppState.newsUnread;
    } else if (b) {
      b.remove();
    }
  });
}
