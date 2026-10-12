// CATCH service worker: owns all network calls (avoids page CORS / mixed content),
// caches results, sets the toolbar badge and relays the toolbar click to the page.

const DEFAULTS = { apiBase: 'http://localhost:8000', apiKey: '' };
const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 20000;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

async function getSettings() {
  const s = await chrome.storage.sync.get(DEFAULTS);
  return { apiBase: String(s.apiBase || DEFAULTS.apiBase).replace(/\/$/, ''), apiKey: s.apiKey || '' };
}

async function apiFetch(path, init = {}) {
  const { apiBase, apiKey } = await getSettings();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...(apiKey ? { 'X-API-Key': apiKey } : {}), ...(init.headers || {}) },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function cacheGet(key) {
  const entry = (await chrome.storage.session.get(key))[key];
  return entry && Date.now() - entry.t < CACHE_TTL_MS ? entry.v : null;
}

const cacheSet = (key, v) => chrome.storage.session.set({ [key]: { t: Date.now(), v } });

async function handleMatch(payload, tabId) {
  const key = `m:${payload.url}:${payload.price ?? ''}`;
  let data = await cacheGet(key);
  if (!data) {
    data = await apiFetch('/api/v1/extension/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await cacheSet(key, data);
  }
  if (tabId != null) {
    const n = (data.matches ? data.matches.length : 0) + (data.page_coupons ? 1 : 0);
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#7C4DFF' });
    chrome.action.setBadgeText({ tabId, text: n ? String(n) : '' });
  }
  return data;
}

async function handleAnalyzeImage(imageUrl) {
  const res = await fetch(imageUrl, { credentials: 'omit' });
  if (!res.ok) throw new Error(`Image fetch ${res.status}`);
  const blob = await res.blob();
  if (blob.size > MAX_IMAGE_BYTES) throw new Error('Image too large');
  const form = new FormData();
  form.append('file', blob, 'product.jpg');
  form.append('include_deals', 'true');
  return apiFetch('/api/v1/analyze-item', { method: 'POST', body: form });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const run = async () => {
    switch (msg?.type) {
      case 'CATCH_MATCH':
        return handleMatch(msg.payload, sender.tab?.id);
      case 'CATCH_ANALYZE_IMAGE':
        return handleAnalyzeImage(msg.imageUrl);
      case 'CATCH_CLEAR_BADGE':
        if (sender.tab?.id != null) chrome.action.setBadgeText({ tabId: sender.tab.id, text: '' });
        return {};
      default:
        throw new Error('Unknown message');
    }
  };
  run().then((data) => sendResponse({ ok: true, data })).catch((err) => sendResponse({ ok: false, error: String(err.message || err) }));
  return true;
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.id != null) chrome.tabs.sendMessage(tab.id, { type: 'CATCH_TOGGLE' }).catch(() => {});
});
