'use strict';
/* ═══════════════════════════════════════════════════════
   THPT Cẩm Bình · facebook.js
   Chạy sau khi disclaimer đã đóng (event 'disclaimerClosed').
   Không race với ui.js close listener trên #dbtn.
═══════════════════════════════════════════════════════ */

(function () {
  const profileId = '100029723110409';
  const appScheme = `fb://profile?id=${profileId}`;
  const webUrl    = `https://www.facebook.com/${profileId}`;

  function openFacebook() {
    let openedApp = false;

    const handleVisibility = () => {
      if (document.hidden) openedApp = true;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Dùng <a> ẩn thay vì location.href — tránh navigate trang
    const a = document.createElement('a');
    a.href = appScheme; a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 500);

    // Fallback: nếu app không mở được thì mở web
    setTimeout(() => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (!openedApp) window.open(webUrl, '_blank');
    }, 1800);
  }

  // Lắng nghe event từ ui.js sau khi disclaimer đã đóng xong
  document.addEventListener('disclaimerClosed', openFacebook, { once: true });
})();
