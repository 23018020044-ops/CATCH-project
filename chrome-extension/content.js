// CATCH Content Script - Prevents overlay auto-closing/vanishing
(function () {
  if (window.__CATCH_INJECTED__) return;
  window.__CATCH_INJECTED__ = true;

  let overlay = null;

  function createOverlay(data) {
    if (document.getElementById('catch-overlay-root')) {
      return; // Already exists, don't recreate or reset
    }

    overlay = document.createElement('div');
    overlay.id = 'catch-overlay-root';
    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      background: #1E1B2E;
      color: #FFFFFF;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-width: 280px;
      max-width: 320px;
      border: 1px solid #7C4DFF;
    `;

    const matchCount = data?.matches?.length || 0;
    const dealTitle = data?.matches?.[0]?.title || "Best Deal Found";
    const dealPrice = data?.matches?.[0]?.price || "";

    overlay.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-weight: bold; color: #7C4DFF; font-size: 14px;">CATCH ACTIVE</span>
        <button id="catch-close-btn" style="background:none; border:none; color:#AAA; cursor:pointer; font-size:16px;">✕</button>
      </div>
      <div style="font-size: 13px; line-height: 1.4;">
        <p style="margin: 0 0 6px 0; font-weight: 600;">${dealTitle}</p>
        <p style="margin: 0; color: #00E676; font-weight: bold;">${dealPrice}</p>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('catch-close-btn').addEventListener('click', () => {
      overlay.remove();
    });
  }

  // Fetch deal data from background script
  chrome.runtime.sendMessage(
    {
      type: 'CATCH_MATCH',
      payload: { url: window.location.href, price: 15000 }
    },
    (res) => {
      if (res && res.ok && res.data) {
        createOverlay(res.data);
      }
    }
  );
})();
