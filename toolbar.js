(function () {
  // ===== STYLES =====
  const style = document.createElement('style');
  style.textContent = `
    .a11y-bar {
      position: fixed;
      top: 68px;
      left: 50%;
      transform: translateX(-50%);
      width: max-content;
      max-width: calc(100vw - 40px);
      z-index: 9998;
      background: rgba(26,74,107,0.97);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(246,166,126,0.5);
      border-radius: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 10px 22px;
      direction: rtl;
      box-shadow: 0 6px 32px rgba(0,0,0,0.2);
      white-space: nowrap;
      font-family: 'Rubik', sans-serif;
    }
    .a11y-label {
      font-size: 12px;
      font-weight: 600;
      color: rgba(255,255,255,0.8);
      letter-spacing: 1px;
      margin-left: 4px;
    }
    .a11y-btn {
      background: rgba(246,166,126,0.1);
      border: 1px solid rgba(246,166,126,0.5);
      color: #f6a67e;
      font-family: 'Rubik', sans-serif;
      font-size: 14px;
      font-weight: 800;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      padding: 0;
    }
    .a11y-btn:hover { background: rgba(246,166,126,0.25); transform: scale(1.1); }
    .a11y-btn:active { transform: scale(0.95); }
    .a11y-btn.reset {
      font-size: 12px;
      color: rgba(255,255,255,0.6);
      border-color: rgba(255,255,255,0.2);
      background: rgba(255,255,255,0.05);
    }
    @media (min-width: 960px) { .a11y-bar { display: none; } }
    @media (max-width: 959px) { body { padding-top: 170px; } }
  `;
  document.head.appendChild(style);

  // ===== HTML =====
  const bar = document.createElement('div');
  bar.className = 'a11y-bar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'נגישות');
  bar.innerHTML = `
    <span class="a11y-label">גודל טקסט</span>
    <button class="a11y-btn" id="a11y-down" aria-label="הקטן טקסט">א−</button>
    <button class="a11y-btn reset" id="a11y-reset" aria-label="איפוס">א</button>
    <button class="a11y-btn" id="a11y-up" aria-label="הגדל טקסט">א+</button>
  `;
  document.body.appendChild(bar);

  // ===== LOGIC =====
  const SCALE_KEY = 'a11y_scale';
  let scale = parseFloat(localStorage.getItem(SCALE_KEY)) || 1;

  function applyScale(s) {
    scale = Math.min(1.5, Math.max(0.8, parseFloat(s.toFixed(1))));
    document.documentElement.style.fontSize = (scale * 16) + 'px';
    localStorage.setItem(SCALE_KEY, scale);
  }

  applyScale(scale);

  document.getElementById('a11y-up').addEventListener('click', () => applyScale(scale + 0.1));
  document.getElementById('a11y-down').addEventListener('click', () => applyScale(scale - 0.1));
  document.getElementById('a11y-reset').addEventListener('click', () => applyScale(1));

  // כשהתפריט פתוח — הטולבר יורד מתחת לתפריט
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) {
    const observer = new MutationObserver(() => {
      if (mobileMenu.classList.contains('open')) {
        const menuBottom = mobileMenu.getBoundingClientRect().bottom;
        bar.style.top = menuBottom + 'px';
        bar.style.bottom = 'auto';
      } else {
        bar.style.top = '68px';
        bar.style.bottom = 'auto';
      }
    });
    observer.observe(mobileMenu, { attributes: true, attributeFilter: ['class'] });
  }
})();
