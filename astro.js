'use strict';
/* ═══════════════════════════════════════════════════════
   THPT Cẩm Bình · astro.js
   Chứa: zodiac, mệnh, chi, numerology, ngũ hành, tử vi, modal chi tiết, soul mate
═══════════════════════════════════════════════════════ */

/* ── Zodiac data ─────────────────────────────────────── */
const ZODIAC_SIGNS = [
  { name:'Bạch Dương',en:'Aries',    emoji:'♈',start:[3,21],end:[4,19], element:'Lửa',ruling:'Hỏa tinh',   trait:'Năng động, dũng cảm, tự tin, bốc đồng' },
  { name:'Kim Ngưu',  en:'Taurus',   emoji:'♉',start:[4,20],end:[5,20], element:'Đất',ruling:'Kim tinh',   trait:'Kiên nhẫn, đáng tin, hướng vật chất, bướng bỉnh' },
  { name:'Song Tử',   en:'Gemini',   emoji:'♊',start:[5,21],end:[6,20], element:'Khí',ruling:'Thủy tinh',  trait:'Linh hoạt, tò mò, hòa đồng, khó lường' },
  { name:'Cự Giải',   en:'Cancer',   emoji:'♋',start:[6,21],end:[7,22], element:'Nước',ruling:'Mặt trăng', trait:'Nhạy cảm, trực giác, gia đình, hay lo âu' },
  { name:'Sư Tử',     en:'Leo',      emoji:'♌',start:[7,23],end:[8,22], element:'Lửa',ruling:'Mặt trời',   trait:'Tự hào, lãnh đạo, nhiệt huyết, thích chú ý' },
  { name:'Xử Nữ',     en:'Virgo',    emoji:'♍',start:[8,23],end:[9,22], element:'Đất',ruling:'Thủy tinh',  trait:'Tỉ mỉ, phân tích, thực dụng, cầu toàn' },
  { name:'Thiên Bình',en:'Libra',    emoji:'♎',start:[9,23],end:[10,22],element:'Khí',ruling:'Kim tinh',   trait:'Hòa hợp, công bằng, quyến rũ, do dự' },
  { name:'Bọ Cạp',    en:'Scorpio',  emoji:'♏',start:[10,23],end:[11,21],element:'Nước',ruling:'Diêm vương tinh',trait:'Sâu sắc, bí ẩn, đam mê, ghen tuông' },
  { name:'Nhân Mã',   en:'Sagittarius',emoji:'♐',start:[11,22],end:[12,21],element:'Lửa',ruling:'Mộc tinh',trait:'Phiêu lưu, lạc quan, triết học, bất cẩn' },
  { name:'Ma Kết',    en:'Capricorn',emoji:'♑',start:[12,22],end:[1,19], element:'Đất',ruling:'Thổ tinh',   trait:'Kỷ luật, tham vọng, thực tế, lạnh lùng' },
  { name:'Bảo Bình',  en:'Aquarius', emoji:'♒',start:[1,20],end:[2,18],  element:'Khí',ruling:'Thiên vương tinh',trait:'Sáng tạo, nhân đạo, độc lập, xa cách' },
  { name:'Song Ngư',  en:'Pisces',   emoji:'♓',start:[2,19],end:[3,20],  element:'Nước',ruling:'Hải vương tinh',trait:'Mơ mộng, đồng cảm, nghệ thuật, dễ bị tổn thương' },
];

// Fix: Ma Kết crosses year boundary — extended check for mid-month ranges
function getZodiac(dd, mm) {
  for (let i = 0; i < ZODIAC_SIGNS.length; i++) {
    const z = ZODIAC_SIGNS[i];
    const [sm, sd] = z.start, [em, ed] = z.end;
    if (sm > em) {
      // year-crossing (Capricorn: Dec 22 – Jan 19)
      if ((mm === sm && dd >= sd) || (mm > sm) || (mm === em && dd <= ed) || (mm < em)) {
        // narrow to only correct months
        if ((mm === sm && dd >= sd) || (mm === em && dd <= ed)) return { idx: i, ...z };
      }
    } else {
      if ((mm === sm && dd >= sd) || (mm > sm && mm < em) || (mm === em && dd <= ed)) return { idx: i, ...z };
    }
  }
  return { idx: 11, ...ZODIAC_SIGNS[11] };
}

/* ── Mệnh (Ngũ Hành simplified) ─────────────────────── */
const MENH_MAP = {
  0: { name: 'Kim',  icon: '⚙️', desc: 'Kim – Cứng rắn, sắc sảo, có bản lĩnh' },
  1: { name: 'Thủy', icon: '💧', desc: 'Thủy – Linh hoạt, thích nghi, nhạy cảm' },
  2: { name: 'Mộc',  icon: '🌿', desc: 'Mộc – Phát triển, sáng tạo, nhân từ' },
  3: { name: 'Hỏa',  icon: '🔥', desc: 'Hỏa – Nhiệt huyết, đam mê, lãnh đạo' },
  4: { name: 'Thổ',  icon: '⛰️', desc: 'Thổ – Vững chắc, trung thực, kiên trì' },
};

function getMenh(year) {
  const y = parseInt(year) || 2009;
  const r = ((y % 10) + (Math.floor(y / 10) % 10)) % 5;
  return MENH_MAP[r] || MENH_MAP[0];
}

function getChiYear(year) {
  const CHI = ['Thân','Dậu','Tuất','Hợi','Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi'];
  const CHI_ICON = ['🐒','🐓','🐕','🐷','🐭','🐮','🐯','🐰','🐲','🐍','🐴','🐑'];
  const y = parseInt(year) || 2009;
  const idx = (y - 2016 + 1200) % 12;
  return { chi: CHI[idx], icon: CHI_ICON[idx] };
}

function getLuckyInfo(zodiacIdx) {
  const LUCKY_COLORS = [['Đỏ','Cam'],['Xanh lá','Hồng'],['Vàng','Xanh'],['Trắng','Kem'],['Vàng','Cam'],['Xám','Xanh lá'],['Hồng','Xanh'],['Đen','Đỏ'],['Tím','Xanh'],['Nâu','Xám'],['Bạc','Xanh'],['Biển','Tím']];
  const LUCKY_NUM = [[1,9],[2,6],[3,5],[2,7],[1,3,10],[5,14],[4,6,13],[8,11],[3,7],[6,9,8],[4,7,11],[3,9,12]];
  return { colors: LUCKY_COLORS[zodiacIdx] || ['Đỏ','Vàng'], nums: LUCKY_NUM[zodiacIdx] || [7,9] };
}

function parseBirthDate(ngaySinh) {
  if (!ngaySinh) return null;
  const parts = ngaySinh.split('/');
  if (parts.length < 3) return null;
  return { d: parseInt(parts[0]), m: parseInt(parts[1]), y: parseInt(parts[2]) };
}

/* ── Compat table ─────────────────────────────────────── */
const COMPAT = {
  0:[5,8,11],1:[6,9,0],2:[7,10,1],3:[8,11,2],4:[9,0,3],5:[10,1,4],
  6:[11,2,5],7:[0,3,6],8:[1,4,7],9:[2,5,8],10:[3,6,9],11:[4,7,10],
};

function calcCompatScore(s1, s2) {
  const bd1 = parseBirthDate(s1.ngaySinh);
  const bd2 = parseBirthDate(s2.ngaySinh);
  if (!bd1 || !bd2) {
    const fallback = 50 + ((s1.stt * 7 + s2.stt * 13) % 50);
    return { score: fallback, tags: ['Chờ duyên 🌙'], verdict: 'Hai tâm hồn chưa rõ ngày sinh nhưng cơ duyên vẫn chờ đợi...', z1: null, z2: null };
  }
  const z1 = getZodiac(bd1.d, bd1.m);
  const z2 = getZodiac(bd2.d, bd2.m);
  const bestFor1 = COMPAT[z1.idx] || [];
  const isIdeal = bestFor1.includes(z2.idx);
  const sameElem = z1.element === z2.element;
  const numer = n => [...String(n)].reduce((a, c) => a + parseInt(c || 0), 0);
  const n1 = numer(bd1.d + bd1.m + bd1.y);
  const n2 = numer(bd2.d + bd2.m + bd2.y);
  const numBonus = Math.abs(n1 - n2) < 3 ? 8 : 0;
  const base = isIdeal ? 82 : sameElem ? 72 : 55;
  const seed = (s1.stt * 7 + s2.stt * 13) % 17;
  const score = Math.max(50, Math.min(99, base + seed + numBonus));
  const tags = [];
  if (isIdeal) tags.push('Cung hợp nhau 💫');
  if (sameElem) tags.push(`Đồng nguyên ${z1.element} 🌊`);
  if (numBonus) tags.push('Số mệnh tương đồng ✨');
  if (score >= 90) tags.push('Mối duyên thiên định 🔮');
  else if (score >= 80) tags.push('Tương hợp cao 💖');
  else if (score >= 65) tags.push('Có duyên gặp gỡ 🌸');
  else tags.push('Cần thêm thời gian 🌱');
  const VERDICTS = [
    `${z1.emoji}${z1.name} và ${z2.emoji}${z2.name} là cặp đôi trời sinh! Hai tâm hồn này bổ sung hoàn hảo cho nhau.`,
    `Sự kết hợp giữa ${z1.name} và ${z2.name} tạo nên năng lượng hài hòa, đầy tiềm năng phát triển.`,
    `${z1.name} mang đến sự ổn định, ${z2.name} mang đến cảm xúc — cùng nhau tạo nên sự cân bằng tuyệt vời.`,
    `Dù có lúc bất đồng, ${z1.name} và ${z2.name} luôn tìm được điểm chung sau mỗi cơn mưa.`,
    `Đây là mối duyên kỳ diệu — hai vì sao sáng gặp nhau, ánh sáng nhân đôi! 🌟`,
    `${z1.name} và ${z2.name} cùng chung chí hướng — một tình yêu bền vững đang chờ phía trước.`,
    `Ngôi sao ${z1.emoji} và ${z2.emoji} giao thoa — đây là khởi đầu của một chuyện tình đẹp!`,
  ];
  return { score, tags, verdict: VERDICTS[(s1.stt + s2.stt) % VERDICTS.length], z1, z2 };
}

/* ── Build Tuvi Panel ─────────────────────────────────── */
const PERSONALITIES = {
  0:'Nhiệt huyết và can đảm, luôn tiên phong trong mọi việc. Thích thử thách và không ngại khó khăn.',
  1:'Kiên nhẫn và đáng tin cậy, biết tận hưởng cuộc sống. Thích sự ổn định và những điều đẹp đẽ.',
  2:'Thông minh và linh hoạt, dễ thích nghi với mọi hoàn cảnh. Tò mò và luôn tìm kiếm điều mới.',
  3:'Nhạy cảm và chu đáo, yêu gia đình hết mực. Trực giác tốt và hiểu tâm lý người khác.',
  4:'Tự tin và lãnh đạo thiên bẩm, thu hút mọi ánh nhìn. Hào phóng và trung thành với người thân.',
  5:'Cẩn thận và phân tích mọi thứ kỹ lưỡng. Thực dụng, chăm chỉ và luôn muốn hoàn hảo.',
  6:'Quyến rũ và hài hòa trong mọi mối quan hệ. Công bằng, yêu cái đẹp và không thích xung đột.',
  7:'Bí ẩn và sâu sắc, có khả năng nhìn thấu tâm can người khác. Đam mê và quyết đoán.',
  8:'Lạc quan và yêu tự do, thích khám phá chân trời mới. Triết học và hài hước.',
  9:'Kỷ luật và tham vọng, luôn hướng đến mục tiêu. Thực tế và có trách nhiệm cao.',
  10:'Sáng tạo và nhân đạo, đi trước thời đại. Độc lập và có tư tưởng đổi mới.',
  11:'Mơ mộng và đồng cảm, có tâm hồn nghệ sĩ. Nhạy cảm và thường nghĩ cho người khác.',
};

function buildTuviPanel(s) {
  const bd = parseBirthDate(s.ngaySinh);
  if (!bd) return '<div class="tuvi-cell" style="grid-column:1/-1;padding:16px;text-align:center;color:rgba(255,255,255,.3);font-size:12px">Không có ngày sinh</div>';
  const z = getZodiac(bd.d, bd.m);
  const menh = getMenh(bd.y);
  const chi = getChiYear(bd.y);
  const lucky = getLuckyInfo(z.idx);
  const elemColors = { 'Lửa':'#ff6b35','Đất':'#c4a35a','Khí':'#48dbfb','Nước':'#1e90ff' };
  const elColor = elemColors[z.element] || '#aaa';
  return `
    <div class="tv-hero">
      <div class="tv-hero-emoji">${z.emoji}</div>
      <div class="tv-hero-info">
        <div class="tv-hero-name">${z.name}</div><div class="tv-hero-en">${z.en}</div>
        <div class="tv-hero-dates">📅 ${z.start[0]}/${z.start[1]} – ${z.end[0]}/${z.end[1]}</div>
        <div class="tv-trait-tags">${z.trait.split(', ').map(t => `<span class="tv-trait-tag">${t}</span>`).join('')}</div>
      </div>
    </div>
    <div class="tv-grid">
      <div class="tv-cell">
        <div class="tv-cell-lbl">Ngũ hành</div>
        <div class="tv-cell-ico" style="filter:drop-shadow(0 0 6px ${elColor}88)">${{'Lửa':'🔥','Đất':'🌍','Khí':'💨','Nước':'💧'}[z.element]||'✨'}</div>
        <div class="tv-cell-val" style="color:${elColor}">${z.element}</div>
        <div class="tv-cell-sub">${z.ruling}</div>
      </div>
      <div class="tv-cell">
        <div class="tv-cell-lbl">Mệnh</div>
        <div class="tv-cell-ico">${menh.icon}</div>
        <div class="tv-cell-val">${menh.name}</div>
        <div class="tv-cell-sub">${menh.desc.split('–')[1]?.trim() || ''}</div>
      </div>
      <div class="tv-cell">
        <div class="tv-cell-lbl">Năm sinh</div>
        <div class="tv-cell-ico">${chi.icon}</div>
        <div class="tv-cell-val">Tuổi ${chi.chi}</div>
        <div class="tv-cell-sub">${bd.y}</div>
      </div>
    </div>
    <div class="tv-lucky">
      <span class="tv-lucky-lbl">May mắn</span>
      ${lucky.colors.map(c => `<span class="tv-lucky-pill">🎨 ${c}</span>`).join('')}
      <span class="tv-lucky-sep">·</span>
      ${lucky.nums.map(n => `<span class="tv-lucky-num">${n}</span>`).join('')}
    </div>
    <div class="tv-personality">
      <div class="tv-pers-inner">
        <span class="tv-pers-icon">✨</span>
        <span class="tv-pers-text">${PERSONALITIES[z.idx] || ''}</span>
      </div>
    </div>`;
}

/* ── Info Pills ─────────────────────────────────────── */
function buildInfoPills(s) {
  const bd = parseBirthDate(s.ngaySinh);
  if (!bd) return '';
  const z = getZodiac(bd.d, bd.m);
  const menh = getMenh(bd.y);
  const chi  = getChiYear(bd.y);
  const elClass = {'Lửa':'m-pill-el-fire','Đất':'m-pill-el-earth','Khí':'m-pill-el-air','Nước':'m-pill-el-water'}[z.element] || 'm-pill-el-fire';
  const menhKey = menh.name.toLowerCase();
  const menhClass = menhKey.includes('kim') ? 'm-pill-menh-kim'
    : menhKey.includes('thủy') || menhKey.includes('thuy') ? 'm-pill-menh-thuy'
    : menhKey.includes('mộc') || menhKey.includes('moc') ? 'm-pill-menh-moc'
    : menhKey.includes('hỏa') || menhKey.includes('hoa') ? 'm-pill-menh-hoa'
    : 'm-pill-menh-tho';
  const elEmoji = {'Lửa':'🔥','Đất':'🌍','Khí':'💨','Nước':'💧'}[z.element] || '✨';
  const today = new Date();
  const isBd = bd.d === today.getDate() && bd.m === (today.getMonth() + 1);
  const bdPill = isBd ? `<span class="m-pill m-pill-bd"><span class="m-pill-ico">🎂</span>Sinh nhật hôm nay!</span>` : '';
  return `<div class="m-pill-row">
    <span class="m-pill m-pill-zodiac"><span class="m-pill-ico">${z.emoji}</span>${z.name}</span>
    <span class="m-pill ${elClass}"><span class="m-pill-ico">${elEmoji}</span>${z.element}</span>
    <span class="m-pill ${menhClass}"><span class="m-pill-ico">${menh.icon}</span>Mệnh ${menh.name}</span>
    <span class="m-pill m-pill-chi"><span class="m-pill-ico">${chi.icon}</span>Tuổi ${chi.chi}</span>
    ${bdPill}
  </div>`;
}

function getBdBadge(ngaySinh) {
  if (!ngaySinh) return '';
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const parts = ngaySinh.split('/');
  if (parts.length >= 2 && parts[0] === dd && parts[1] === mm) return '<span class="bd-today">🎂 SN hôm nay</span>';
  return '';
}

/* ── Numerology ─────────────────────────────────────── */
const NUM_MEANINGS = {
  1:  { name:'Số 1 — Lãnh đạo',  desc:'Độc lập, tiên phong, ý chí mạnh. Sinh ra để dẫn đường.', color:'#ffd700' },
  2:  { name:'Số 2 — Hợp tác',   desc:'Nhạy cảm, hòa giải, có trực giác. Giỏi kết nối con người.', color:'#ff9ed4' },
  3:  { name:'Số 3 — Sáng tạo',  desc:'Tài năng biểu đạt, lạc quan, hài hước. Truyền cảm hứng cho mọi người.', color:'#48dbfb' },
  4:  { name:'Số 4 — Ổn định',   desc:'Thực dụng, chăm chỉ, đáng tin cậy. Xây dựng nền tảng vững chắc.', color:'#6ab04c' },
  5:  { name:'Số 5 — Tự do',     desc:'Thích phiêu lưu, linh hoạt, tò mò. Sống động và khó đoán.', color:'#ff9f43' },
  6:  { name:'Số 6 — Chăm sóc',  desc:'Có trách nhiệm, yêu thương, tận tụy. Trụ cột gia đình.', color:'#ff6b9d' },
  7:  { name:'Số 7 — Tâm linh',  desc:'Phân tích, bí ẩn, tìm kiếm chân lý. Tư duy sâu sắc.', color:'#a29bfe' },
  8:  { name:'Số 8 — Quyền năng',desc:'Tham vọng, thực tế, tài quản lý. Hướng đến thành công vật chất.', color:'#fdcb6e' },
  9:  { name:'Số 9 — Nhân đạo',  desc:'Cao thượng, tha thứ, tầm nhìn rộng. Phục vụ nhân loại.', color:'#e17055' },
  11: { name:'Số 11 — Linh giác',desc:'Số chủ: trực giác cực nhạy, truyền cảm hứng tâm linh.', color:'#c8d6e5' },
  22: { name:'Số 22 — Bậc thầy', desc:'Số chủ: xây dựng điều vĩ đại, biến giấc mơ thành hiện thực.', color:'#f9ca24' },
  33: { name:'Số 33 — Giác ngộ', desc:'Số chủ hiếm nhất: thầy tâm linh, chữa lành và nâng đỡ.', color:'#6c5ce7' },
};

// Fix: reduce_simple now defined BEFORE it's used in buildNumerologyPanel
function reduce_simple(n) {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split('').reduce((a, c) => a + parseInt(c), 0);
  }
  return n;
}

function calcNumerology(bd) {
  if (!bd) return null;
  const { d, m, y } = bd;
  const reduce = n => {
    if (n === 11 || n === 22 || n === 33) return n;
    let s = n;
    while (s > 9) { s = String(s).split('').reduce((a, c) => a + parseInt(c), 0); if (s===11||s===22||s===33) return s; }
    return s;
  };
  const life  = reduce(d + m + [...String(y)].reduce((a, c) => a + parseInt(c), 0));
  const birth = reduce(d);
  const expr  = reduce(m + d);
  const soul  = reduce([...String(y)].reduce((a, c) => a + parseInt(c), 0));
  return { life, birth, expr, soul };
}

function buildNumerologyPanel(s) {
  const bd = parseBirthDate(s.ngaySinh);
  if (!bd) return '<div style="padding:16px;text-align:center;color:rgba(255,255,255,.3);font-size:12px">Không có ngày sinh</div>';
  const num = calcNumerology(bd);
  if (!num) return '';
  const cells = [
    { lbl: 'Số đường đời', val: num.life,  sub: 'Life Path' },
    { lbl: 'Số ngày sinh', val: num.birth, sub: 'Birth Day' },
    { lbl: 'Số biểu đạt',  val: num.expr,  sub: 'Expression' },
    { lbl: 'Số tâm hồn',   val: num.soul,  sub: 'Soul Urge' },
  ];
  const info = NUM_MEANINGS[num.life] || NUM_MEANINGS[reduce_simple(num.life)] || null;
  return `
    <div class="num-grid">
      ${cells.map(c => `<div class="num-cell">
        <div class="num-lbl">${c.lbl}</div>
        <div class="num-val">${c.val}</div>
        <div class="num-sub">${c.sub}</div>
      </div>`).join('')}
    </div>
    ${info ? `<div class="num-meaning">✨ <strong style="color:${info.color}">${info.name}</strong><br>${info.desc}</div>` : ''}`;
}

/* ── Ngũ Hành Panel ─────────────────────────────────── */
const ELEMENTS_5 = [
  { name:'Kim',  icon:'⚙️', color:'#c0c0c0', good:['Thủy','Thổ'], bad:['Hỏa','Mộc'] },
  { name:'Mộc',  icon:'🌿', color:'#4eff91', good:['Hỏa','Thủy'], bad:['Kim','Thổ'] },
  { name:'Thủy', icon:'💧', color:'#48dbfb', good:['Mộc','Kim'],  bad:['Thổ','Hỏa'] },
  { name:'Hỏa',  icon:'🔥', color:'#ff6b35', good:['Thổ','Mộc'],  bad:['Thủy','Kim'] },
  { name:'Thổ',  icon:'⛰️', color:'#c4a35a', good:['Kim','Hỏa'],  bad:['Mộc','Thủy'] },
];

function buildElementPanel(s) {
  const bd = parseBirthDate(s.ngaySinh);
  if (!bd) return '<div style="padding:16px;text-align:center;color:rgba(255,255,255,.3);font-size:12px">Không có ngày sinh</div>';
  const menh = getMenh(bd.y);
  const myEl = ELEMENTS_5.find(e => menh.desc.includes(e.name)) || ELEMENTS_5[0];
  return `
    <div style="padding:10px 14px 6px;position:relative;z-index:1">
      <div style="text-align:center;margin-bottom:10px;font-size:12px;color:rgba(255,255,255,.5)">Mệnh của <strong style="color:#e8d4ff">${s.hoTen.split(' ').pop()}</strong>: <span style="color:${myEl.color};font-weight:800">${myEl.icon} ${myEl.name}</span></div>
      <div class="elem-grid">
        ${ELEMENTS_5.map(el => {
          const isSelf = el.name === myEl.name;
          const isGood = myEl.good.includes(el.name);
          const isBad  = myEl.bad.includes(el.name);
          const cls = isSelf ? 'elem-self' : isGood ? 'elem-good' : isBad ? 'elem-bad' : 'elem-neutral';
          const rel = isSelf ? '• Bản mệnh' : isGood ? '✓ Hợp' : isBad ? '✗ Khắc' : '◌ Bình';
          return `<div class="elem-cell ${cls}" title="${el.name}">
            <span class="elem-ico">${el.icon}</span>
            <div class="elem-nm">${el.name}</div>
            <div class="elem-rel">${rel}</div>
          </div>`;
        }).join('')}
      </div>
      <div style="padding:8px 2px 4px;font-size:10.5px;color:rgba(255,255,255,.4);text-align:center">
        <span style="display:inline-flex;gap:12px">
          <span><span style="color:#4eff91">✓ Hợp:</span> ${myEl.good.join(', ')}</span>
          <span><span style="color:#ff6b6b">✗ Khắc:</span> ${myEl.bad.join(', ')}</span>
        </span>
      </div>
    </div>`;
}

/* ── Fortune Panel ─────────────────────────────────── */
const FORTUNE_TIPS = [
  'Hôm nay thích hợp để học bài và tập trung vào mục tiêu dài hạn.',
  'Năng lượng tích cực đang bao quanh bạn — hãy tận dụng để kết nối bạn bè.',
  'Tránh quyết định lớn hôm nay, hãy quan sát và lắng nghe nhiều hơn.',
  'Ngày may mắn cho các sáng kiến mới và khởi đầu dự án.',
  'Hãy chú ý đến sức khỏe — nghỉ ngơi đầy đủ và uống nhiều nước.',
  'Cơ hội xuất hiện từ những cuộc gặp gỡ bất ngờ — hãy cởi mở.',
  'Tập trung vào điểm mạnh của bản thân thay vì lo lắng về điểm yếu.',
  'Một ngày bình lặng — hãy dành thời gian cho gia đình và người thân.',
];

function buildFortunePanel(s) {
  const bd = parseBirthDate(s.ngaySinh);
  if (!bd) return '<div style="padding:16px;text-align:center;color:rgba(255,255,255,.3);font-size:12px">Không có ngày sinh</div>';
  const now = new Date();
  const seed = (s.stt * 7 + now.getDate() * 13 + now.getMonth() * 31) % 100;
  const stars5 = Math.max(2, Math.min(5, 3 + Math.round((seed % 30 - 15) / 7)));
  const stars = '★'.repeat(stars5) + '☆'.repeat(5 - stars5);
  const luckPct = 45 + (seed % 50);
  const lovePct = 40 + ((seed * 3) % 55);
  const studyPct = 50 + ((seed * 7) % 45);
  const bioPhys = 50 + Math.round(30 * Math.sin(2 * Math.PI * (now.getDate() - 1) / 23));
  const bioEmo  = 50 + Math.round(28 * Math.sin(2 * Math.PI * (now.getDate() - 1) / 28));
  const bioIntl = 50 + Math.round(33 * Math.sin(2 * Math.PI * (now.getDate() - 1) / 33));
  const tip = FORTUNE_TIPS[(s.stt + now.getDate()) % FORTUNE_TIPS.length];
  const luckyNum = ((s.stt * 3 + now.getDate() * 7) % 99) + 1;
  const COLORS = ['Đỏ','Xanh','Vàng','Tím','Cam','Trắng','Đen'];
  const luckyColor = COLORS[(s.stt + now.getDate()) % COLORS.length];
  const overallPct = Math.round(45 + (seed % 50));
  const overallGrade = overallPct >= 85 ? {txt:'Xuất sắc',color:'#4eff91'} : overallPct >= 70 ? {txt:'Tốt',color:'#ffd700'} : overallPct >= 55 ? {txt:'Trung bình',color:'#ff9f43'} : {txt:'Cần cố gắng',color:'#ff6b6b'};
  return `
    <div class="fortune-day">
      <div class="fortune-grid">
        <div class="fortune-cell fortune-cell-overall" style="grid-column:1/-1;background:linear-gradient(135deg,rgba(160,80,255,.12),rgba(255,80,160,.08));border:1px solid rgba(160,100,255,.2);border-radius:9px;padding:10px 14px;text-align:center;animation:fortuneReveal .3s ease both">
          <div class="fortune-lbl" style="margin-bottom:5px;font-size:9px;letter-spacing:.8px">✨ TỬ VI TỔNG QUÁT HÔM NAY</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap">
            <div class="fortune-stars" style="font-size:16px;letter-spacing:2px;animation:fortuneReveal .4s .1s ease both">${stars}</div>
            <div style="display:flex;flex-direction:column;align-items:center">
              <div style="font-family:'Lexend Deca',sans-serif;font-size:26px;font-weight:900;background:linear-gradient(135deg,#ffd700,#ff9f43,#ff6b9d);-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:fortuneReveal .4s .15s ease both">${overallPct}<span style="font-size:14px">%</span></div>
              <div style="font-size:10px;font-weight:700;color:${overallGrade.color};animation:fortuneReveal .4s .2s ease both">${overallGrade.txt}</div>
            </div>
          </div>
          <div style="margin-top:7px;height:6px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${overallPct}%;background:linear-gradient(90deg,#9b59b6,#e91e63,#ff9f43);border-radius:3px;animation:barGrow .9s cubic-bezier(.25,.46,.45,.94) both"></div>
          </div>
        </div>
        <div class="fortune-cell" style="animation:fortuneReveal .35s .05s ease both"><div class="fortune-lbl">Số may mắn</div><div class="fortune-val" style="font-size:18px;font-weight:900;background:linear-gradient(135deg,#ffd700,#ff9f43);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${luckyNum}</div></div>
        <div class="fortune-cell" style="animation:fortuneReveal .35s .1s ease both"><div class="fortune-lbl">May mắn</div><div class="fortune-val">${luckPct}%</div></div>
        <div class="fortune-cell" style="animation:fortuneReveal .35s .15s ease both"><div class="fortune-lbl">Tình cảm</div><div class="fortune-val">${lovePct}%</div></div>
        <div class="fortune-cell" style="animation:fortuneReveal .35s .2s ease both"><div class="fortune-lbl">Màu hôm nay</div><div class="fortune-val">${luckyColor}</div></div>
      </div>
      <div class="bio-wrap" style="margin-top:10px">
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:.6px;color:rgba(255,255,255,.25);margin-bottom:10px;font-weight:700;display:flex;align-items:center;gap:6px">
          <span style="flex:1">Nhịp sinh học hôm nay</span>
          <span style="font-size:8px;color:rgba(255,255,255,.15);font-weight:500;font-style:italic">Cập nhật theo ngày</span>
        </div>
        ${[
          {nm:'Thể chất', pct:bioPhys, color:'#4eff91', ico:'💪'},
          {nm:'Cảm xúc',  pct:bioEmo,  color:'#ff6eb4', ico:'💖'},
          {nm:'Trí tuệ',  pct:bioIntl, color:'#48dbfb', ico:'🧠'},
          {nm:'Học tập',  pct:studyPct,color:'#ffd700', ico:'📚'},
          {nm:'Tình cảm', pct:lovePct, color:'#ff9f43', ico:'🌸'},
        ].map((b, i) => `<div class="bio-row" style="animation:fortuneReveal .35s ${.05 + i * .06}s ease both">
          <div class="bio-head"><span class="bio-nm">${b.ico} ${b.nm}</span><span class="bio-pct" style="color:${b.color};font-size:11px;font-weight:800">${b.pct}%</span></div>
          <div class="bio-track">
            <div class="bio-fill" style="width:${b.pct}%;background:linear-gradient(90deg,${b.color}99,${b.color});box-shadow:0 0 8px ${b.color}44;transition:width 1.2s cubic-bezier(.25,.46,.45,.94)"></div>
          </div>
        </div>`).join('')}
      </div>
      <div class="fortune-tip" style="animation:fortuneReveal .5s .3s ease both;margin-top:10px">💫 ${tip}</div>
    </div>`;
}

/* ── showDetail (authoritative — patches.js wraps this) ─ */
function showDetail(stt) {
  const s = AppState.ALL.find(x => x.stt === stt); if (!s) return;
  const v = val => val ? `<span class="mfv">${val}</span>` : `<span class="mfv empty">Không có</span>`;
  const sdt = n => n
    ? `<button class="ptile-s" onclick="cp('${n}')">📞 ${n}</button>`
    : `<span style="font-size:11.5px;color:var(--t4)">Không có SĐT</span>`;
  const bd = parseBirthDate(s.ngaySinh);
  const bdBadge = getBdBadge(s.ngaySinh);

  document.getElementById('MOD').innerHTML = `
    <div class="mhdr">
      <button class="m-close" onclick="closeModal()">✕</button>
      <div class="m-name">${s.hoTen || '–'}${bdBadge}</div>
      <div class="m-meta">
        <span class="b b${s.lop?.substring(0, 2) || ''}">${s.lop || '–'}</span>
        <span class="b ${s.gioiTinh === 'Nam' ? 'bnam' : 'bnu'}">${s.gioiTinh || '–'}</span>
        <span style="font-size:11.5px;opacity:.5">STT #${s.stt}</span>
      </div>
    </div>
    <div class="modal-tabs">
      <button class="modal-tab on" onclick="switchMTab('info',this)">📋 Thông tin</button>
      <button class="modal-tab" onclick="switchMTab('tuvi',this)">🔮 Tử vi</button>
      <button class="modal-tab" onclick="switchMTab('soul',this)">💘 Linh hồn</button>
    </div>
    <div id="mPane-info" class="modal-pane on">
      <div class="msec"><h4>Thông tin cá nhân</h4>
        <div class="mgrid">
          <div class="mf"><div class="mfl">Họ và tên</div>${v(s.hoTen)}</div>
          <div class="mf"><div class="mfl">Ngày sinh</div><span class="mfv">${s.ngaySinh || '–'}${bdBadge}</span></div>
          <div class="mf"><div class="mfl">Giới tính</div>${v(s.gioiTinh)}</div>
          <div class="mf"><div class="mfl">Lớp</div>${v(s.lop)}</div>
          <div class="mf" style="grid-column:1/-1"><div class="mfl">CMND / CCCD</div>
            ${s.soCMND ? `<span class="mfv"><span class="cp-link" onclick="cp('${s.soCMND}')">${s.soCMND}</span></span>` : v('')}
          </div>
        </div>
      </div>
      <div class="msec"><h4>Địa chỉ</h4>
        <div class="mgrid">
          <div class="mf"><div class="mfl">Xã/phường thường trú</div>${v(s.xaPhuongThuongTru)}</div>
          <div class="mf"><div class="mfl">Thôn xóm</div>${v(s.thonXom)}</div>
          <div class="mf"><div class="mfl">Địa chỉ chi tiết</div>${v(s.diaChiChiTiet)}</div>
          <div class="mf"><div class="mfl">Quê quán</div>${v(s.queQuan)}</div>
          <div class="mf" style="grid-column:1/-1"><div class="mfl">Chỗ ở hiện nay</div>${v(s.choOHienNay)}</div>
        </div>
      </div>
      <div class="msec"><h4>Thông tin phụ huynh</h4>
        <div class="pgrid">
          <div class="ptile">
            <div class="ptile-l">👨 Bố</div>
            <div class="ptile-n">${s.tenBo || 'Không có'}</div>
            <div class="ptile-j">${s.ngheNghiepBo || ''}</div>
            ${sdt(s.sdtBo)}
          </div>
          <div class="ptile">
            <div class="ptile-l">👩 Mẹ</div>
            <div class="ptile-n">${s.tenMe || 'Không có'}</div>
            <div class="ptile-j">${s.ngheNghiepMe || ''}</div>
            ${sdt(s.sdtMe)}
          </div>
        </div>
      </div>
    </div>
    <div id="mPane-tuvi" class="modal-pane">
      ${buildInfoPills(s)}
      <div class="tuvi-section">
        <div class="tuvi-hdr">
          <span class="tuvi-hdr-ico">🌙</span>
          <span class="tuvi-hdr-title">Tử vi & Chiêm tinh</span>
          <span class="tuvi-hdr-sub">${s.ngaySinh || ''}</span>
        </div>
        <div class="tuvi-tabs">
          <button class="tuvi-tab on" onclick="switchTuviTab('zodiac',this)">Hoàng đạo</button>
          <button class="tuvi-tab" onclick="switchTuviTab('numerology',this)">Thần số học</button>
          <button class="tuvi-tab" onclick="switchTuviTab('elements',this)">Ngũ hành</button>
          <button class="tuvi-tab" onclick="switchTuviTab('fortune',this)">Vận hôm nay</button>
        </div>
        <div id="tuviPane-zodiac" class="tuvi-pane on">${buildTuviPanel(s)}</div>
        <div id="tuviPane-numerology" class="tuvi-pane">${buildNumerologyPanel(s)}</div>
        <div id="tuviPane-elements"   class="tuvi-pane">${buildElementPanel(s)}</div>
        <div id="tuviPane-fortune"    class="tuvi-pane">${buildFortunePanel(s)}</div>
      </div>
    </div>
    <div id="mPane-soul" class="modal-pane">
      <div style="text-align:center;padding:16px 0 8px">
        <button class="soul-btn" style="max-width:280px;margin:0 auto" onclick="closeModal();showSoulModal(AppState.ALL.find(x=>x.stt===${s.stt}))">💘 Linh hồn</button>
      </div>
    </div>
    <div class="mactions">
      <button class="mabtn mabtn-out" onclick="printStudent(${s.stt})">🖨 In</button>
      ${s.soCMND ? `<button class="mabtn mabtn-out" onclick="cp('${s.soCMND}')">📋 CCCD</button>` : ''}
      ${s.sdtBo  ? `<button class="mabtn mabtn-out" onclick="cp('${s.sdtBo}')">📞 SĐT Bố</button>` : ''}
      ${s.sdtMe  ? `<button class="mabtn mabtn-out" onclick="cp('${s.sdtMe}')">📞 SĐT Mẹ</button>` : ''}
      <button class="mabtn mabtn-out mabtn-tuvi" onclick="closeModal();showSoulModal(AppState.ALL.find(x=>x.stt===${s.stt}))" style="background:linear-gradient(135deg,#c2185b,#880e4f);color:#fff">💘 Tìm ai đó</button>
      <button class="mabtn mabtn-pri" onclick="closeModal()">Đóng</button>
    </div>`;
  document.getElementById('OV').classList.add('on');
}

function switchMTab(name, btn) {
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('on'));
  document.querySelectorAll('.modal-pane').forEach(p => p.classList.remove('on'));
  btn.classList.add('on');
  const pane = document.getElementById('mPane-' + name);
  if (pane) pane.classList.add('on');
}

// Fix: switchTuviTab now scoped to the modal containing the tab (no global .tuvi-pane leak)
function switchTuviTab(name, btn) {
  btn.closest('.tuvi-tabs').querySelectorAll('.tuvi-tab').forEach(t => t.classList.remove('on'));
  btn.classList.add('on');
  const section = btn.closest('.tuvi-section');
  if (section) {
    section.querySelectorAll('.tuvi-pane').forEach(p => p.classList.remove('on'));
    const pane = section.querySelector('#tuviPane-' + name) || section.querySelector('#smtP-' + name);
    if (pane) pane.classList.add('on');
  }
}

/* ── Soul Mate ─────────────────────────────────────── */
let _soulPerson1 = null;
let _smGender = 'opp';

function buildSoulMatePanel(s1, s2, compat) {
  const pct = compat.score;
  const barColor = pct >= 90 ? 'linear-gradient(90deg,#ff6eb4,#ff1493,#c2185b)' :
                   pct >= 75 ? 'linear-gradient(90deg,#ff9ed4,#e91e63)' :
                   pct >= 60 ? 'linear-gradient(90deg,#f48fb1,#ad1457)' :
                   'linear-gradient(90deg,#e8a0c8,#880e4f)';
  const emo1 = s1.gioiTinh === 'Nam' ? '👦' : '👧';
  const emo2 = s2.gioiTinh === 'Nam' ? '👦' : '👧';
  const cls1 = s1.gioiTinh === 'Nam' ? 'm' : 'f';
  const cls2 = s2.gioiTinh === 'Nam' ? 'm' : 'f';
  const bd2 = parseBirthDate(s2.ngaySinh);
  const z2 = bd2 ? getZodiac(bd2.d, bd2.m) : null;
  const menh2 = bd2 ? getMenh(bd2.y) : null;
  const chi2  = bd2 ? getChiYear(bd2.y) : null;
  const infoRow = (label, val) => val ? `
    <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.05)">
      <span style="font-size:10px;color:rgba(255,200,230,.4);font-weight:600">${label}</span>
      <span style="font-size:10.5px;color:rgba(255,220,240,.85);font-weight:700;text-align:right;max-width:65%">${val}</span>
    </div>` : '';
  const addr = [s2.thonXom, s2.xaPhuongThuongTru].filter(Boolean).join(', ') || s2.diaChiChiTiet || '–';
  return `
    <div class="soul-person-box">
      <div class="soul-avatar ${cls1}">${emo1}</div>
      <div class="soul-info">
        <div class="soul-name">${s1.hoTen}</div>
        <div class="soul-meta">${s1.lop || ''} · ${s1.ngaySinh || '?'}</div>
        <div class="soul-sign">${compat.z1 ? compat.z1.emoji + ' ' + compat.z1.name : ''}</div>
      </div>
    </div>
    <div class="soul-arrow">💞</div>
    <div class="soul-person-box">
      <div class="soul-avatar ${cls2}">${emo2}</div>
      <div class="soul-info">
        <div class="soul-name">${s2.hoTen}</div>
        <div class="soul-meta">${s2.lop || ''} · ${s2.ngaySinh || '?'}</div>
        <div class="soul-sign">${compat.z2 ? compat.z2.emoji + ' ' + compat.z2.name : ''}</div>
      </div>
    </div>
    <div class="soul-match-bar-wrap">
      <div class="soul-match-lbl"><span>Chỉ số tương hợp</span><strong>${pct}%</strong></div>
      <div class="soul-match-bar"><div class="soul-match-fill" style="width:${pct}%;background:${barColor}"></div></div>
    </div>
    <div class="soul-compat-tags">${compat.tags.map(t => `<span class="soul-tag">${t}</span>`).join('')}</div>
    <div class="soul-verdict">${compat.verdict}</div>
    <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,100,200,.18);border-radius:9px;padding:12px 14px;margin-top:10px">
      <div style="font-family:'Lexend Deca',sans-serif;font-size:11px;font-weight:800;color:#ffd6ef;margin-bottom:8px;display:flex;align-items:center;gap:6px">
        <span style="font-size:14px">📋</span> Thông tin ai đó
        <span style="margin-left:auto;font-size:9px;background:rgba(255,100,200,.15);color:#ff9ed4;padding:1px 7px;border-radius:100px;font-weight:700">STT #${s2.stt}</span>
      </div>
      ${infoRow('Họ và tên', s2.hoTen)}
      ${infoRow('Ngày sinh', s2.ngaySinh)}
      ${infoRow('Giới tính', s2.gioiTinh)}
      ${infoRow('Lớp', s2.lop)}
      ${infoRow('Cung hoàng đạo', z2 ? z2.emoji + ' ' + z2.name + ' (' + z2.element + ')' : null)}
      ${infoRow('Mệnh', menh2 ? menh2.icon + ' ' + menh2.name : null)}
      ${infoRow('Năm sinh (Chi)', chi2 ? chi2.icon + ' Năm ' + chi2.chi : null)}
      ${infoRow('Địa chỉ', addr)}
      ${s2.soCMND ? infoRow('CCCD', s2.soCMND) : ''}
      ${s2.tenBo ? infoRow('Tên bố', s2.tenBo + (s2.sdtBo ? ' · ' + s2.sdtBo : '')) : ''}
      ${s2.tenMe ? infoRow('Tên mẹ', s2.tenMe + (s2.sdtMe ? ' · ' + s2.sdtMe : '')) : ''}
    </div>`;
}

function showSoulModal(s1) {
  if (!s1) return;
  _soulPerson1 = s1;
  const z1 = (() => { const bd = parseBirthDate(s1.ngaySinh); return bd ? getZodiac(bd.d, bd.m) : null; })();
  document.getElementById('SM_MOD').innerHTML = `
    <div class="mhdr" style="background:linear-gradient(148deg,#2a0050,#7b0050)">
      <button class="m-close" onclick="closeSoulModal()">✕</button>
      <div class="m-name" style="font-size:16px">💘 Linh hồn</div>
      <div class="m-meta">
        <span class="b bnam" style="background:rgba(255,100,200,.2);color:#ff9ed4">${s1.hoTen}</span>
        <span style="font-size:11px;opacity:.5">${z1 ? z1.emoji + ' ' + z1.name : ''}</span>
      </div>
    </div>
    <div style="padding:14px 18px 0">
      <div class="tuvi-section" style="margin-bottom:0">
        <div class="tuvi-hdr">
          <span class="tuvi-hdr-ico">🔮</span>
          <span class="tuvi-hdr-title">Tử vi nhanh</span>
          <span class="tuvi-hdr-sub">${s1.hoTen.split(' ').pop()}</span>
        </div>
        <div class="tuvi-tabs" id="sm-tuvi-tabs">
          <button class="tuvi-tab on" onclick="switchSMTuviTab('zodiac',this)">Hoàng đạo</button>
          <button class="tuvi-tab" onclick="switchSMTuviTab('numerology',this)">Thần số</button>
          <button class="tuvi-tab" onclick="switchSMTuviTab('fortune',this)">Vận hôm nay</button>
        </div>
        <div id="smtP-zodiac" class="tuvi-pane on">${buildTuviPanel(s1)}</div>
        <div id="smtP-numerology" class="tuvi-pane">${buildNumerologyPanel(s1)}</div>
        <div id="smtP-fortune"    class="tuvi-pane">${buildFortunePanel(s1)}</div>
      </div>
    </div>
    <div style="padding:10px 18px 0" id="sm-soul-area">
      <div class="soul-section">
        <div class="soul-hdr">
          <span class="soul-hdr-ico">🙂</span>
          <span class="soul-hdr-title">Tìm ai đó</span>
          <span class="soul-hdr-sub">Tử vi và số học</span>
        </div>
        <div class="soul-body">
          <div class="soul-gender-toggle">
            <button class="sgt-btn on" id="sgt-opp"  onclick="setSMGender('opp',this)">Khác giới 💑</button>
            <button class="sgt-btn"    id="sgt-same" onclick="setSMGender('same',this)">Cùng giới 👬</button>
            <button class="sgt-btn"    id="sgt-all"  onclick="setSMGender('all',this)">Tất cả 🌟</button>
          </div>
          <div class="soul-empty">Bấm nút bên dưới để tìm ai đó ngẫu nhiên! 🌟</div>
          <button class="soul-btn" onclick="findSoulMate()">Tìm ai đó ngẫu nhiên</button>
        </div>
      </div>
    </div>
    <div class="mactions">
      <button class="mabtn mabtn-out" onclick="closeSoulModal()">Đóng</button>
      <button class="mabtn mabtn-pri" style="background:linear-gradient(135deg,#c2185b,#880e4f)" onclick="findSoulMate()">💘 Tìm lại</button>
    </div>`;
  document.getElementById('SM_OV').classList.add('on');
}

function closeSoulModal() { document.getElementById('SM_OV').classList.remove('on'); }

function setSMGender(mode, btn) {
  _smGender = mode;
  document.querySelectorAll('.sgt-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
}

function switchSMTuviTab(name, btn) {
  document.getElementById('sm-tuvi-tabs').querySelectorAll('.tuvi-tab').forEach(t => t.classList.remove('on'));
  btn.classList.add('on');
  ['zodiac', 'numerology', 'fortune'].forEach(n => {
    const p = document.getElementById('smtP-' + n);
    if (p) p.classList.toggle('on', n === name);
  });
}

// Single, unified findSoulMate (was duplicated — old version removed)
function findSoulMate() {
  if (!_soulPerson1) return;
  const s1 = _soulPerson1;
  const bd1 = parseBirthDate(s1.ngaySinh);
  const year1 = bd1 ? bd1.y : null;

  let candidates = AppState.ALL.filter(s => {
    if (s.stt === s1.stt) return false;
    if (_smGender === 'opp'  && s.gioiTinh === s1.gioiTinh) return false;
    if (_smGender === 'same' && s.gioiTinh !== s1.gioiTinh) return false;
    if (_smGender === 'opp' && year1) {
      const bd2 = parseBirthDate(s.ngaySinh);
      if (bd2) {
        if (s1.gioiTinh === 'Nam' && bd2.y < year1) return false;
        if (s1.gioiTinh === 'Nữ'  && bd2.y > year1) return false;
      }
    }
    return true;
  });
  if (!candidates.length) { toast('😢 Không tìm thấy người phù hợp'); return; }

  const area = document.getElementById('sm-soul-area'); if (!area) return;
  area.innerHTML = `
    <div class="soul-section" id="sm-scan-box">
      <div class="soul-hdr">
        <span class="soul-hdr-ico" style="animation:heartBeat 0.6s ease infinite">💫</span>
        <span class="soul-hdr-title">Đang quét vũ trụ…</span>
        <span class="soul-hdr-sub" id="sm-scan-sub">0 / ${candidates.length}</span>
      </div>
      <div class="soul-body" style="padding:18px 14px;text-align:center">
        <div style="position:relative;width:80px;height:80px;margin:0 auto 14px">
          <div style="width:80px;height:80px;border-radius:50%;border:2px solid rgba(255,100,200,.15);position:absolute"></div>
          <div style="width:80px;height:80px;border-radius:50%;border:2px solid transparent;border-top-color:#ff6eb4;position:absolute;animation:spin 0.9s linear infinite"></div>
          <div style="width:60px;height:60px;border-radius:50%;border:2px solid transparent;border-top-color:#c2185b;position:absolute;top:10px;left:10px;animation:spin 0.6s linear infinite reverse"></div>
          <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,rgba(194,24,91,.2),rgba(255,110,180,.15));position:absolute;top:20px;left:20px;display:flex;align-items:center;justify-content:center;font-size:18px;animation:heartBeat 0.8s ease infinite">💘</div>
        </div>
        <div id="sm-scan-name" style="font-size:12px;font-weight:700;color:#ff9ed4;min-height:18px;transition:opacity .15s;font-family:'Lexend Deca',sans-serif"></div>
        <div style="height:3px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden;margin-top:10px;width:160px;margin-left:auto;margin-right:auto">
          <div id="sm-scan-bar" style="height:100%;background:linear-gradient(90deg,#c2185b,#ff6eb4);border-radius:2px;width:0%;transition:width .08s linear"></div>
        </div>
        <div id="sm-scan-msg" style="font-size:10px;color:rgba(255,180,230,.4);margin-top:7px;font-style:italic">Phân tích cung hoàng đạo…</div>
      </div>
    </div>`;

  const msgs = ['Phân tích cung hoàng đạo…','Tính toán thần số học…','Kiểm tra tương hợp ngũ hành…','Đọc nhịp sinh học…','Tìm mối duyên kỳ diệu…','So sánh mệnh số…'];
  let frame = 0;
  const total = Math.min(candidates.length, 30);
  const nameEl = document.getElementById('sm-scan-name');
  const barEl  = document.getElementById('sm-scan-bar');
  const subEl  = document.getElementById('sm-scan-sub');
  const msgEl  = document.getElementById('sm-scan-msg');

  const iv = setInterval(() => {
    frame++;
    const pct = Math.round((frame / total) * 100);
    if (barEl) barEl.style.width = pct + '%';
    if (subEl) subEl.textContent = frame + ' / ' + candidates.length;
    if (nameEl) {
      nameEl.style.opacity = '0';
      setTimeout(() => {
        const p = candidates[Math.floor(Math.random() * candidates.length)];
        if (nameEl) { nameEl.textContent = p.hoTen; nameEl.style.opacity = '1'; }
      }, 70);
    }
    if (msgEl) msgEl.textContent = msgs[frame % msgs.length];
    if (frame >= total) clearInterval(iv);
  }, 55);

  setTimeout(() => {
    clearInterval(iv);
    const scored = candidates.map(s => ({ s, score: calcCompatScore(s1, s).score }));
    scored.sort((a, b) => b.score - a.score);
    const topN = Math.max(3, Math.floor(scored.length * 0.35));
    const pool = scored.slice(0, topN);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const s2 = pick.s;
    const compat = calcCompatScore(s1, s2);

    area.style.transition = 'opacity .25s'; area.style.opacity = '0';
    setTimeout(() => {
      area.innerHTML = `
        <div class="soul-section" style="animation:revealSoul .45s cubic-bezier(.22,1,.36,1) both">
          <div class="soul-hdr">
            <span class="soul-hdr-ico">💘</span>
            <span class="soul-hdr-title">Đã tìm thấy!</span>
            <span class="soul-hdr-sub" style="color:#ff9ed4;font-weight:800">${compat.score}% ✨</span>
          </div>
          <div class="soul-body">
            ${buildSoulMatePanel(s1, s2, compat)}
            <button class="soul-btn" style="margin-top:12px" onclick="findSoulMate()">Tìm ai đó khác</button>
          </div>
        </div>`;
      area.style.opacity = '1';
      const mod = document.getElementById('SM_MOD');
      setTimeout(() => { if (mod) mod.scrollTop = mod.scrollHeight; }, 200);
      burstSM();
    }, 260);
  }, 1750);
}

function burstSM() {
  const colors = ['#ff6b9d','#ffd700','#ff9ff3','#ff1493','#c2185b','#fff'];
  const hearts = ['💘','💖','✨','💫','🌸','💕'];
  const mod = document.getElementById('SM_MOD');
  const rect = mod ? mod.getBoundingClientRect() : document.body.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height * 0.4;
  for (let i = 0; i < 28; i++) {
    const el = document.createElement('div');
    el.className = 'xconf';
    el.style.cssText = `left:${cx - 3}px;top:${cy - 3}px;background:${colors[i % colors.length]};position:fixed;z-index:9999;`;
    const angle = (Math.PI * 2 / 28) * i + (Math.random() * 0.4 - 0.2);
    const dist = 50 + Math.random() * 100;
    el.animate([
      { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1 },
      { transform: `translate(${Math.cos(angle) * dist}px,${Math.sin(angle) * dist}px) rotate(${540 + Math.random() * 360}deg) scale(0)`, opacity: 0 }
    ], { duration: 1000 + Math.random() * 400, easing: 'cubic-bezier(.17,.67,.42,1)', fill: 'forwards' });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const h = document.createElement('div');
      h.textContent = hearts[i % hearts.length];
      h.style.cssText = `position:fixed;left:${cx + (Math.random() - .5) * 120}px;top:${cy}px;font-size:${14 + Math.random() * 12}px;pointer-events:none;z-index:9999;`;
      h.animate([
        { transform: 'translateY(0) scale(0) rotate(-20deg)', opacity: 1 },
        { transform: `translateY(-${60 + Math.random() * 60}px) scale(1.2) rotate(${Math.random() * 40 - 20}deg)`, opacity: 0 }
      ], { duration: 900 + Math.random() * 400, easing: 'ease-out', fill: 'forwards' });
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 1500);
    }, i * 80);
  }
}

/* ── POTD ─────────────────────────────────────────── */
function renderPOTD() {
  const view = document.getElementById('viewPotd');
  if (!view || typeof AppState.ALL === 'undefined' || !AppState.ALL.length) return;
  const t = new Date();
  const seed = t.getFullYear() * 10000 + (t.getMonth() + 1) * 100 + t.getDate();
  const potd = AppState.ALL[seed % AppState.ALL.length];
  const { dd, mm } = (() => ({ dd: String(t.getDate()).padStart(2,'0'), mm: String(t.getMonth()+1).padStart(2,'0') }))();
  const bdToday = AppState.ALL.filter(s => { const p = (s.ngaySinh||'').split('/'); return p.length>=2&&p[0]===dd&&p[1]===mm; });
  const bdMonth = AppState.ALL.filter(s => { const p = (s.ngaySinh||'').split('/'); return p.length>=2&&p[1]===mm&&p[0]!==dd; }).slice(0, 18);
  const emo = s => s.gioiTinh === 'Nam' ? '👦' : '👧';
  let zodiac = null;
  try { const bd = parseBirthDate(potd.ngaySinh); if (bd) zodiac = getZodiac(bd.d, bd.m); } catch (e) {}
  function daysUntilLocal(ngaySinh) {
    const p = ngaySinh?.split('/');
    if (!p || p.length < 3) return null;
    const now = new Date();
    let next = new Date(now.getFullYear(), +p[1]-1, +p[0]);
    if (next <= now) next = new Date(now.getFullYear()+1, +p[1]-1, +p[0]);
    return Math.ceil((next - now) / 86400000);
  }
  const days = daysUntilLocal(potd.ngaySinh);
  const isBdToday = bdToday.some(s => s.stt === potd.stt);
  const reasons = ['✨ Hôm nay vũ trụ chọn bạn ấy!','💫 Một gương mặt đáng được spotlight','🌟 Ngôi sao của ngày!','🔮 Được chọn bởi thuật toán bí ẩn','🌈 Một ngày đặc biệt xứng đáng'];
  view.innerHTML = `<div class="v3-page">
    <div class="v3-ph"><div class="v3-ph-left"><span class="v3-ph-ico">⭐</span>
      <div class="v3-ph-text"><div class="v3-ph-h">Học sinh nổi bật</div>
      <div class="v3-ph-sub">${t.toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div></div></div>
      <button class="v3-icon-act" onclick="openRandomStudent()" title="Ngẫu nhiên 🎲">🎲</button>
    </div>
    <div class="v3-potd-hero" onclick="typeof showDetail==='function'&&showDetail(${potd.stt})">
      <div class="v3-potd-glow-bg"></div>
      <div class="v3-potd-avatar-lg">${emo(potd)}</div>
      <div class="v3-potd-details">
        <div class="v3-potd-name">${potd.hoTen}</div>
        <div class="v3-potd-badges">
          <span class="b b${(potd.lop||'').slice(0,2)}">${potd.lop||'–'}</span>
          <span class="b ${potd.gioiTinh==='Nam'?'bnam':'bnu'}">${potd.gioiTinh||'–'}</span>
          ${zodiac ? `<span style="font-size:12px">${zodiac.emoji} ${zodiac.name}</span>` : ''}
        </div>
        <div class="v3-potd-reason">${reasons[seed % reasons.length]}</div>
        ${isBdToday ? '<div class="v3-potd-bd-badge">🎂 Sinh nhật hôm nay!</div>'
          : days != null ? `<div class="v3-potd-countdown">🎂 Còn <strong>${days}</strong> ngày đến sinh nhật</div>` : ''}
      </div>
    </div>
    <div class="v3-sec-title">🎂 Sinh nhật hôm nay <span class="v3-sec-cnt">${bdToday.length}</span></div>
    ${bdToday.length === 0 ? '<div class="v3-no-bd">🌙 Hôm nay không có sinh nhật nào</div>'
      : `<div class="v3-bd-grid">${bdToday.map((s,i) => `<div class="v3-bd-card" style="animation-delay:${i*.06}s" onclick="typeof showDetail==='function'&&showDetail(${s.stt})">
        <div class="v3-bd-pulse-ring"></div><div class="v3-bd-emo">${emo(s)}</div>
        <div class="v3-bd-name">${s.hoTen}</div><div class="v3-bd-lop">${s.lop}</div>
        <div class="v3-bd-date">🎂 ${s.ngaySinh}</div></div>`).join('')}</div>`}
    ${bdMonth.length > 0 ? `<div class="v3-sec-title">📅 Sinh nhật tháng ${parseInt(mm)} <span class="v3-sec-cnt">${bdMonth.length}+</span></div>
      <div class="v3-mini-grid">${bdMonth.map((s,i) => {
        const d2 = daysUntilLocal(s.ngaySinh);
        return `<div class="v3-mini-card" style="animation-delay:${i*.03}s" onclick="typeof showDetail==='function'&&showDetail(${s.stt})">
          <div class="v3-mini-emo">${emo(s)}</div>
          <div class="v3-mini-info"><div class="v3-mini-name">${s.hoTen}</div><div class="v3-mini-sub">${s.lop} · ${s.ngaySinh}</div></div>
          ${d2 != null ? `<div class="v3-mini-days">${d2}d</div>` : ''}</div>`;
      }).join('')}</div>` : ''}
  </div>`;
}

/* ── Stats Extra ─────────────────────────────────────── */
function renderStatsExtra() {
  setTimeout(() => {
    const sc = document.getElementById('sCharts');
    if (!sc || typeof AppState.ALL === 'undefined' || !AppState.ALL.length || sc.querySelector('.v3-stats-extra')) return;
    const nam = AppState.AppState.ALL.filter(s => s.gioiTinh === 'Nam').length, nu = AppState.AppState.ALL.length - nam;
    const pN = (nam / AppState.ALL.length * 100).toFixed(1);
    const r = 50, cx = 63, cy = 63, C = 2 * Math.PI * r, arc = (nam / AppState.ALL.length) * C;
    const occM = {};
    AppState.AppState.ALL.forEach(s => { if (s.ngheNghiepMe) occM[s.ngheNghiepMe] = (occM[s.ngheNghiepMe] || 0) + 1; });
    const topM = Object.entries(occM).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const mxM = Math.max(...topM.map(e => e[1]), 1);
    const lopSz = {}; AppState.AppState.ALL.forEach(s => { if (s.lop) lopSz[s.lop] = (lopSz[s.lop] || 0) + 1; });
    const regions = new Set(AppState.ALL.map(s => s.xaPhuongThuongTru).filter(Boolean)).size;
    const [bigL] = Object.entries(lopSz).sort((a, b) => b[1] - a[1]);
    const [smlL] = Object.entries(lopSz).sort((a, b) => a[1] - b[1]);
    const wrap = document.createElement('div');
    wrap.className = 'v3-stats-extra';
    wrap.innerHTML = `
      <div class="chart-card anim-fade" style="animation-delay:.32s">
        <h3>🍩 Tỉ lệ giới tính</h3>
        <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;padding:6px 0">
          <svg width="126" height="126" viewBox="0 0 126 126">
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--border2)" stroke-width="20"/>
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--blue)" stroke-width="20" stroke-dasharray="${arc} ${C - arc}" stroke-dashoffset="${C * .25}"/>
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--pink)" stroke-width="20" stroke-dasharray="${C - arc} ${arc}" stroke-dashoffset="${C * .25 - arc}"/>
            <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="15" font-weight="900" fill="var(--t1)" font-family="Lexend Deca,sans-serif">${pN}%</text>
            <text x="${cx}" y="${cy + 11}" text-anchor="middle" font-size="9" fill="var(--t4)">Nam</text>
          </svg>
          <div style="flex:1;min-width:90px;display:flex;flex-direction:column;gap:8px">
            <div class="v3-leg"><div class="v3-leg-dot" style="background:var(--blue)"></div><span>Nam</span><strong>${nam}</strong><span style="font-size:10px;color:var(--t4)">${pN}%</span></div>
            <div class="v3-leg"><div class="v3-leg-dot" style="background:var(--pink)"></div><span>Nữ</span><strong>${nu}</strong><span style="font-size:10px;color:var(--t4)">${(100 - parseFloat(pN)).toFixed(1)}%</span></div>
            <div style="height:1px;background:var(--border2);margin:2px 0"></div>
            <div class="v3-leg"><span style="color:var(--t4)">Tổng</span><strong>${AppState.ALL.length}</strong></div>
          </div>
        </div>
      </div>
      <div class="chart-card anim-fade" style="animation-delay:.37s">
        <h3>👩 Nghề nghiệp mẹ (top 8)</h3>
        <div class="bc">${topM.map(([l, c]) => `<div class="bc-row">
          <div class="bc-lbl" title="${l}">${l.length > 12 ? l.slice(0, 12) + '…' : l}</div>
          <div class="bc-track"><div class="bc-fill" style="width:${(c / mxM * 100).toFixed(1)}%;background:var(--pink)">${c}</div></div>
          <div class="bc-n">${c}</div></div>`).join('')}</div>
      </div>
      <div class="chart-card anim-fade" style="grid-column:1/-1;animation-delay:.42s">
        <h3>🏆 Thống kê nổi bật</h3>
        <div class="v3-achv-grid">${[
          {i:'🏫',v:bigL?bigL[0]:'–',l:`Lớp đông nhất (${bigL?bigL[1]:'–'} HS)`},
          {i:'🏡',v:smlL?smlL[0]:'–',l:`Lớp ít nhất (${smlL?smlL[1]:'–'} HS)`},
          {i:'📍',v:regions,l:'Xã/phường khác nhau'},
          {i:'📚',v:Object.keys(lopSz).length,l:'Tổng số lớp'},
          {i:'👦',v:pN+'%',l:'Tỉ lệ Nam'},
          {i:'👧',v:(100-parseFloat(pN)).toFixed(1)+'%',l:'Tỉ lệ Nữ'},
        ].map(a => `<div class="v3-achv"><div class="v3-achv-ico">${a.i}</div><div class="v3-achv-val">${a.v}</div><div class="v3-achv-lbl">${a.l}</div></div>`).join('')}</div>
      </div>`;
    sc.appendChild(wrap);
  }, 100);
}
