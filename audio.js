'use strict';
/* ═══════════════════════════════════════════════════════
   THPT Cẩm Bình · audio.js
   Fix: race condition khi click trước khi playlist load xong
   Fix: auto-skip track lỗi thay vì dừng im lặng
   Fix: loopPlaylist có thể toggle từ UI (nếu muốn thêm nút)
═══════════════════════════════════════════════════════ */

const META = {
  title:   '𝘯𝘩𝘢𝘵𝘩𝘶𝘺𝘺𝘥𝘦𝘱𝘹𝘩𝘢𝘪𝘪 =))',
  artist:  '𝙉𝙜𝙉𝙝𝙖𝙩𝙃𝙪𝙮𝙮🇻🇳',
  artwork: 'https://files.catbox.moe/xkn3ps.jpeg',
};

const audio = document.getElementById('player');
let tracks       = [];
let currentIndex = -1;
let started      = false;
let loopPlaylist = true;
// Fix: track if user tried to start before playlist loaded
let _pendingStart = false;

/* ── Load playlist ─────────────────────────────────── */
fetch('playlist.json')
  .then(res => res.json())
  .then(data => {
    tracks = data;
    // Fix: if user already clicked while tracks was empty, start now
    if (_pendingStart && tracks.length > 0) {
      started = true;
      _pendingStart = false;
      if (currentIndex === -1) playRandom();
    }
  })
  .catch(err => console.error('Failed to load playlist:', err));

/* ── MediaSession ──────────────────────────────────── */
function updateMediaSession() {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title:   META.title,
    artist:  META.artist,
    artwork: [{ src: META.artwork, sizes: '512x512', type: 'image/jpeg' }],
  });
  navigator.mediaSession.setActionHandler('nexttrack',     playNext);
  navigator.mediaSession.setActionHandler('previoustrack', playPrev);
}

/* ── Playback ──────────────────────────────────────── */
function playIndex(index) {
  if (!tracks.length) return;
  if (currentIndex !== index) {
    currentIndex = index;
    audio.src = tracks[currentIndex];
  }
  audio.play().catch(() => {
    // Fix: auto-skip to next track on error instead of silent stop
    console.warn('Playback error on track', currentIndex, '— skipping');
    setTimeout(playNext, 800);
  });
  updateMediaSession();
}

function playNext() {
  if (!tracks.length) return;
  playIndex((currentIndex + 1) % tracks.length);
}

function playPrev() {
  if (!tracks.length) return;
  playIndex((currentIndex - 1 + tracks.length) % tracks.length);
}

function playRandom() {
  if (!tracks.length) return;
  let newIndex;
  do { newIndex = Math.floor(Math.random() * tracks.length); }
  while (newIndex === currentIndex && tracks.length > 1);
  playIndex(newIndex);
}

/* ── Start on first click ──────────────────────────── */
document.addEventListener('click', () => {
  if (started) return;
  if (tracks.length > 0) {
    // Tracks already loaded — start immediately
    started = true;
    if (currentIndex === -1) playRandom();
  } else {
    // Fix: mark pending; playback will start when fetch completes
    _pendingStart = true;
  }
}, { once: true });

/* ── Auto-next on track end ────────────────────────── */
audio.addEventListener('ended', () => {
  if (loopPlaylist) playNext();
});
