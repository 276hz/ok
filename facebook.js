'use strict';
/* ═══════════════════════════════════════════════════════
   THPT Cẩm Bình · facebook.js
   Fix: giảm timeout mở app từ 3000ms → 200ms (UX)
   Fix: dùng window.open thay vì location.href (tránh mất trang)
   Fix: visibilitychange chỉ set flag khi tab thực sự bị ẩn
         do FB app mở (không bị lừa bởi tab switch thường)
═══════════════════════════════════════════════════════ */

const acceptBtn = document.getElementById('dbtn');

if (acceptBtn) {
  acceptBtn.addEventListener('click', function () {
    const profileId = '100029723110409';
    const appScheme = `fb://profile?id=${profileId}`;
    const webUrl    = `https://www.facebook.com/${profileId}`;

    let openedApp = false;
    let visibilityTimer = null;

    const handleVisibility = () => {
      if (document.hidden) openedApp = true;
    };

    document.addEventListener('visibilitychange', handleVisibility);

    // Fix: mở app ngay sau 200ms (đủ để dismiss animation), không phải 3000ms
    setTimeout(() => {
      // Fix: dùng <a> ẩn thay vì location.href để tránh navigate trang hiện tại
      const a = document.createElement('a');
      a.href = appScheme; a.style.display = 'none'; document.body.appendChild(a);
      a.click(); setTimeout(() => a.remove(), 500);
    }, 200);

    // Fix: fallback sau 1800ms (đủ để iOS/Android xử lý scheme)
    visibilityTimer = setTimeout(() => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (!openedApp) window.open(webUrl, '_blank');
    }, 1800);

    // Cleanup nếu tab thực sự bị ẩn (FB đã mở)
    const cleanup = () => {
      if (document.hidden) {
        clearTimeout(visibilityTimer);
        document.removeEventListener('visibilitychange', handleVisibility);
        document.removeEventListener('visibilitychange', cleanup);
      }
    };
    document.addEventListener('visibilitychange', cleanup);
  }, { once: true }); // Fix: { once: true } để không bind nhiều lần
}
