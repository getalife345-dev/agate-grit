/**
 * AGATE & GRIT - Offline-First PWA Logic
 * Designed for Google Pixel 11 Pro
 */

// ==========================================
// 1. CONFIGURATION (Easy to edit later)
// ==========================================

// Add a third tumbler unit here anytime (e.g., { id: 'Rotary3', name: 'Big Barrel' })
const TUMBLER_UNITS = [
  { id: 'New', name: 'New Tumbler' },
  { id: 'Old', name: 'Old Tumbler' }
];

// Optional: Hardcode your free Gemini API key here, or paste it in the app UI
const DEFAULT_GEMINI_API_KEY = '';

// Offline Great Lakes Rock Guide Data
const GREAT_LAKES_ROCKS = [
  {
    name: 'Lake Superior Agate',
    hardness: 'Mohs 7 (Hard - Steel knife will NOT scratch)',
    uv: 'None (Rarely dull pale glow)',
    tags: ['hard', 'banded'],
    checklist: 'Look for tight, concentric iron-red, orange, or white bands, waxy quartz shine inside broken faces, and surface pitting ("husks"). Translucent when held to a bright flashlight.',
    tumbleTip: 'Tumbles great! Run Stage 1 Coarse extra cycles until pits and fractures are smoothed out.'
  },
  {
    name: 'Banded Jasper (Jaspilite)',
    hardness: 'Mohs 6.5–7 (Hard - Steel knife will NOT scratch)',
    uv: 'None',
    tags: ['hard', 'banded'],
    checklist: 'Opaque (blocks light even on thin edges). Deep brick-red jasper layers alternating with dark metallic silver/black specular hematite bands.',
    tumbleTip: 'Safe to tumble with agates in Stage 1. Takes a rich, mirror-like metallic and red shine.'
  },
  {
    name: 'Unakite',
    hardness: 'Mohs 6–7 (Hard - Resists steel knife scratch)',
    uv: 'None',
    tags: ['hard'],
    checklist: 'Distinctive pistachio-green epidote mixed with salmon-pink orthoclase feldspar and clear/gray quartz patches. No layering or bands.',
    tumbleTip: 'Tumbles well with standard quartz/jasper batches. Check after Stage 1 for any soft mica pockets.'
  },
  {
    name: 'Michigan Puddingstone',
    hardness: 'Mohs 7 (Hard - Quartzite matrix will NOT scratch)',
    uv: 'None',
    tags: ['hard'],
    checklist: 'White or tan quartzite background packed with rounded red/maroon jasper, black chert, and quartz pebbles. Breaks straight through the pebbles rather than around them.',
    tumbleTip: 'Very hard (Mohs 7). Takes longer in Stage 1 Coarse to get completely smooth.'
  },
  {
    name: 'Petoskey Stone (Fossil Coral)',
    hardness: 'Mohs 4.5 (Soft - Steel knife WILL easily scratch)',
    uv: 'Sometimes weak pale yellow/white glow',
    tags: ['soft'],
    checklist: 'Six-sided (hexagonal) "eye" coral patterns that pop out clearly when wet, and fade to dull gray when dry. Fizzes under vinegar or weak acid.',
    tumbleTip: 'DO NOT tumble with agates or in Stage 1! Too soft—it will grind away to mud. Hand-polish with wet sandpaper (220 to 2000 grit) or tumble alone starting gently at Stage 2/3.'
  },
  {
    name: 'Yooperlite (Sodalite Syenite)',
    hardness: 'Mohs 5.5–6 (Medium - Knife barely scratches with hard pressure)',
    uv: 'STRONG bright orange/yellow ember glow under 365nm UV light',
    tags: ['uv', 'soft'],
    checklist: 'Looks like an ordinary mottled gray granite rock in daylight. Under a 365nm UV flashlight at night, fluorescent sodalite veins glow like burning lava.',
    tumbleTip: 'More brittle than agate. Tumble only with other Yooperlites and plenty of ceramic cushioning media.'
  }
];

// ==========================================
// 2. INDEXEDDB LOCAL STORAGE ENGINE
// ==========================================
const DB_NAME = 'AgateAndGritDB';
const DB_VERSION = 1;
let dbInstance = null;

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('tumblerLogs')) {
        db.createObjectStore('tumblerLogs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('scannerQueue')) {
        db.createObjectStore('scannerQueue', { keyPath: 'id' });
      }
    };

    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };

    request.onerror = (e) => reject(e.target.error);
  });
}

async function dbGetAll(storeName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(storeName, item) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

async function dbDelete(storeName, id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ==========================================
// 3. IMAGE COMPRESSOR (Prevents DB Bloat)
// ==========================================
function compressImageFile(file, maxWidth = 1000, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==========================================
// 4. MODULE 1: TUMBLER TRACKER LOGIC
// ==========================================
let currentDraftPhotoBase64 = null;

async function seedInitialTumblersIfEmpty() {
  const existing = await dbGetAll('tumblerLogs');
  if (existing.length === 0) {
    // Pre-populate current barrels on first run
    await dbPut('tumblerLogs', {
      id: 'seed-new-1',
      unit: 'New',
      stage: 'Stage 2: Medium (120/220)',
      startDate: '2026-10-14',
      notes: 'Active Stage 2 batch.',
      photo: null,
      createdAt: Date.now() - 1000
    });
    await dbPut('tumblerLogs', {
      id: 'seed-old-1',
      unit: 'Old',
      stage: 'Stage 4: Polish',
      startDate: '2026-10-14',
      notes: 'Active Stage 4 final polish run.',
      photo: null,
      createdAt: Date.now()
    });
  }
}

function calculateDaysRunning(startDateStr) {
  const start = new Date(startDateStr + 'T00:00:00');
  const now = new Date();
  const diffMs = now - start;
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  return days === 1 ? '1 Day' : `${days} Days`;
}

async function renderTumblers() {
  const logs = await dbGetAll('tumblerLogs');
  // Sort newest first
  logs.sort((a, b) => b.createdAt - a.createdAt);

  const cardsContainer = document.getElementById('tumbler-cards-container');
  const historyContainer = document.getElementById('tumbler-history-list');
  cardsContainer.innerHTML = '';
  historyContainer.innerHTML = '';

  // Render active status card for each configured tumbler unit
  TUMBLER_UNITS.forEach((unitObj) => {
    const latestForUnit = logs.find((l) => l.unit === unitObj.id);
    const card = document.createElement('div');
    card.className = 'card';

    if (latestForUnit) {
      const daysText = calculateDaysRunning(latestForUnit.startDate);
      card.innerHTML = `
        <div class="tumbler-header">
          <span class="tumbler-name">${unitObj.name}</span>
          <span class="days-pill">⏱ ${daysText}</span>
        </div>
        <div class="stage-banner">${latestForUnit.stage}</div>
        <p><strong>Started:</strong> ${latestForUnit.startDate}</p>
        ${latestForUnit.notes ? `<p style="margin-top:6px;"><strong>Notes:</strong> ${latestForUnit.notes}</p>` : ''}
        ${latestForUnit.photo ? `<img src="${latestForUnit.photo}" class="photo-preview" alt="Batch photo">` : ''}
        <button class="btn-secondary btn-quick-update" data-unit="${unitObj.id}" type="button">
          🔄 Log Next Stage for "${unitObj.id}"
        </button>
      `;
    } else {
      card.innerHTML = `
        <div class="tumbler-header">
          <span class="tumbler-name">${unitObj.name}</span>
        </div>
        <p class="helper-text">No active batch logged yet.</p>
        <button class="btn-primary btn-quick-update" data-unit="${unitObj.id}" type="button">
          + Start "${unitObj.id}" Batch
        </button>
      `;
    }
    cardsContainer.appendChild(card);
  });

  // Attach quick update buttons
  document.querySelectorAll('.btn-quick-update').forEach((btn) => {
    btn.addEventListener('click', () => {
      openLogForm(btn.getAttribute('data-unit'));
    });
  });

  // Render History List
  if (logs.length === 0) {
    historyContainer.innerHTML = '<p class="helper-text">No cycles logged yet.</p>';
    return;
  }

  logs.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'card';
    row.innerHTML = `
      <div class="tumbler-header">
        <strong>${item.unit} Tumbler — ${item.stage}</strong>
        <span>${item.startDate}</span>
      </div>
      ${item.notes ? `<p>${item.notes}</p>` : ''}
      ${item.photo ? `<img src="${item.photo}" class="photo-preview" alt="Stage photo">` : ''}
      <button class="btn-delete" data-id="${item.id}" type="button">Delete Entry</button>
    `;
    row.querySelector('.btn-delete').addEventListener('click', async () => {
      await dbDelete('tumblerLogs', item.id);
      renderTumblers();
    });
    historyContainer.appendChild(row);
  });
}

function openLogForm(defaultUnit = 'New') {
  const form = document.getElementById('form-tumbler-log');
  form.classList.remove('hidden');
  document.getElementById('log-unit').value = defaultUnit;
  document.getElementById('log-date').valueAsDate = new Date();
  form.scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// 5. MODULE 2A: OFFLINE FIELD GUIDE LOGIC
// ==========================================
function renderFieldGuide(activeFilter = 'all') {
  const container = document.getElementById('guide-cards-container');
  container.innerHTML = '';

  const filtered = GREAT_LAKES_ROCKS.filter((rock) => {
    if (activeFilter === 'all') return true;
    return rock.tags.includes(activeFilter);
  });

  filtered.forEach((rock) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3 style="color: var(--accent-agate); font-size: 1.3rem;">${rock.name}</h3>
      <div class="rock-badge-row">
        <span class="trait-tag">🔨 ${rock.hardness}</span>
        <span class="trait-tag">🔦 UV: ${rock.uv}</span>
      </div>
      <p><strong>What to Look For:</strong> ${rock.checklist}</p>
      <div class="tumble-tip">
        <strong>⚙️ Tumbling Tip:</strong> ${rock.tumbleTip}
      </div>
    `;
    container.appendChild(card);
  });
}

// ==========================================
// 6. MODULE 2B: HYBRID AI SCANNER LOGIC
// ==========================================
let currentScannerPhotoBase64 = null;

function getSavedApiKey() {
  return localStorage.getItem('gemini_api_key') || DEFAULT_GEMINI_API_KEY;
}

/**
 * Calls the Gemini 2.5 Flash Vision API directly from the browser.
 * Works with a free Google AI Studio key.
 */
async function analyzeRockWithGemini(base64DataUrl, fieldNotes = '') {
  const apiKey = getSavedApiKey();
  if (!apiKey) {
    throw new Error('No Gemini API Key found. Paste your free key in the setup box below.');
  }

  // Strip the "data:image/jpeg;base64," header
  const base64Clean = base64DataUrl.split(',')[1];

  const promptText = `You are a Michigan and Great Lakes rockhounding expert. 
Analyze this rock photo. ${fieldNotes ? `Field notes from finder: "${fieldNotes}".` : ''}
Provide a short, direct field evaluation with:
1. Most Likely Rock ID (and confidence level)
2. Key visual features you see (banding, crystal structure, fossils, clasts)
3. Quick field test to confirm (Mohs scratch test, vinegar acid test, or 365nm UV test)
4. Rock Tumbling Verdict: Is it safe to tumble in Stage 1 Coarse with hard agates/jaspers, or does it need gentle care?`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: promptText },
          { inline_data: { mime_type: 'image/jpeg', data: base64Clean } }
        ]
      }]
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `API Error (${response.status})`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response returned.';
}

async function renderScannerQueue() {
  const items = await dbGetAll('scannerQueue');
  items.sort((a, b) => b.createdAt - a.createdAt);

  document.getElementById('queue-count').textContent = items.length;
  const list = document.getElementById('scanner-queue-list');
  list.innerHTML = '';

  if (items.length === 0) {
    list.innerHTML = '<p class="helper-text">No saved field photos in queue.</p>';
    return;
  }

  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="tumbler-header">
        <strong>Saved Find (${item.dateStr})</strong>
        <span class="badge ${item.aiResult ? 'online' : 'offline'}">
          ${item.aiResult ? 'ID COMPLETE' : 'NEEDS AI SCAN'}
        </span>
      </div>
      <img src="${item.photo}" class="photo-preview" alt="Field find">
      ${item.notes ? `<p><strong>Field Notes:</strong> ${item.notes}</p>` : ''}
      ${item.aiResult ? `<div class="ai-result">${item.aiResult}</div>` : ''}
      <div style="display:flex; gap:10px; margin-top:10px;">
        <button class="btn-primary btn-run-queued-ai" style="flex:2;" type="button">
          ✨ ${item.aiResult ? 'Re-Run AI' : 'Run AI Now'}
        </button>
        <button class="btn-delete" style="flex:1; margin-top:8px;" type="button">Delete</button>
      </div>
    `;

    card.querySelector('.btn-run-queued-ai').addEventListener('click', async (e) => {
      if (!navigator.onLine) {
        alert('You are currently offline. Connect to Wi-Fi or cell service to run AI.');
        return;
      }
      const btn = e.target;
      btn.textContent = '⏳ Analyzing...';
      btn.disabled = true;
      try {
        const resultText = await analyzeRockWithGemini(item.photo, item.notes);
        item.aiResult = resultText;
        await dbPut('scannerQueue', item);
        renderScannerQueue();
      } catch (err) {
        alert(err.message);
        btn.textContent = '✨ Run AI Now';
        btn.disabled = false;
      }
    });

    card.querySelector('.btn-delete').addEventListener('click', async () => {
      await dbDelete('scannerQueue', item.id);
      renderScannerQueue();
    });

    list.appendChild(card);
  });
}

// ==========================================
// 7. APP INITIALIZATION & EVENT LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  // Register Service Worker for Offline PWA support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.warn('Service worker registration skipped or failed:', err);
    });
  }

  // Online / Offline Badge Indicator
  const netBadge = document.getElementById('network-badge');
  function updateNetworkStatus() {
    if (navigator.onLine) {
      netBadge.textContent = 'ONLINE (AI READY)';
      netBadge.className = 'badge online';
    } else {
      netBadge.textContent = 'OFFLINE MODE';
      netBadge.className = 'badge offline';
    }
  }
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  updateNetworkStatus();

  // Populate Tumbler Unit Dropdown from config array
  const unitSelect = document.getElementById('log-unit');
  TUMBLER_UNITS.forEach((u) => {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = u.name;
    unitSelect.appendChild(opt);
  });

  // Seed & Render Module 1 (Tumblers) and Module 2 (Guide + Queue)
  await seedInitialTumblersIfEmpty();
  await renderTumblers();
  renderFieldGuide('all');
  await renderScannerQueue();

  // Load saved API key into input field if present
  const existingKey = localStorage.getItem('gemini_api_key');
  if (existingKey) {
    document.getElementById('api-key-input').value = existingKey;
  }

  // Bottom Navigation Switching
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.getAttribute('data-target')).classList.add('active');
      window.scrollTo(0, 0);
    });
  });

  // Tumbler Log Form Events
  document.getElementById('btn-open-log-form').addEventListener('click', () => openLogForm('New'));
  document.getElementById('btn-cancel-log').addEventListener('click', () => {
    document.getElementById('form-tumbler-log').classList.add('hidden');
  });

  document.getElementById('log-photo').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    currentDraftPhotoBase64 = await compressImageFile(file);
    const preview = document.getElementById('log-photo-preview');
    preview.src = currentDraftPhotoBase64;
    preview.classList.remove('hidden');
  });

  document.getElementById('form-tumbler-log').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newEntry = {
      id: 'log-' + Date.now(),
      unit: document.getElementById('log-unit').value,
      stage: document.getElementById('log-stage').value,
      startDate: document.getElementById('log-date').value,
      notes: document.getElementById('log-notes').value.trim(),
      photo: currentDraftPhotoBase64,
      createdAt: Date.now()
    };

    await dbPut('tumblerLogs', newEntry);
    currentDraftPhotoBase64 = null;
    e.target.reset();
    document.getElementById('log-photo-preview').classList.add('hidden');
    document.getElementById('form-tumbler-log').classList.add('hidden');
    await renderTumblers();
  });

  // Field Guide Filter Pills
  document.querySelectorAll('.filter-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      renderFieldGuide(pill.getAttribute('data-filter'));
    });
  });

  // Scanner Camera Input
  document.getElementById('scanner-camera-input').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    currentScannerPhotoBase64 = await compressImageFile(file);
    const preview = document.getElementById('scanner-preview');
    preview.src = currentScannerPhotoBase64;
    preview.classList.remove('hidden');
    document.getElementById('btn-analyze-now').disabled = false;
    document.getElementById('btn-save-queue').disabled = false;
    document.getElementById('ai-result-box').classList.add('hidden');
  });

  // Save API Key
  document.getElementById('btn-save-key').addEventListener('click', () => {
    const val = document.getElementById('api-key-input').value.trim();
    localStorage.setItem('gemini_api_key', val);
    alert('API Key saved locally on your Pixel.');
  });

  // Analyze Now Button
  document.getElementById('btn-analyze-now').addEventListener('click', async (e) => {
    if (!currentScannerPhotoBase64) return;
    const notes = document.getElementById('scanner-notes').value.trim();

    if (!navigator.onLine) {
      alert('No internet connection right now. Tap "Save to Offline Queue" so you can analyze it later!');
      return;
    }

    const btn = e.target;
    const resultBox = document.getElementById('ai-result-box');
    btn.textContent = '⏳ Identifying Rock...';
    btn.disabled = true;

    try {
      const answer = await analyzeRockWithGemini(currentScannerPhotoBase64, notes);
      resultBox.textContent = answer;
      resultBox.classList.remove('hidden');

      // Also save to queue history automatically
      await dbPut('scannerQueue', {
        id: 'scan-' + Date.now(),
        dateStr: new Date().toLocaleDateString(),
        photo: currentScannerPhotoBase64,
        notes,
        aiResult: answer,
        createdAt: Date.now()
      });
      await renderScannerQueue();
    } catch (err) {
      alert(err.message);
    } finally {
      btn.textContent = '✨ Identify with AI Now';
      btn.disabled = false;
    }
  });

  // Save to Offline Queue Button
  document.getElementById('btn-save-queue').addEventListener('click', async () => {
    if (!currentScannerPhotoBase64) return;
    const notes = document.getElementById('scanner-notes').value.trim();

    await dbPut('scannerQueue', {
      id: 'scan-' + Date.now(),
      dateStr: new Date().toLocaleDateString(),
      photo: currentScannerPhotoBase64,
      notes,
      aiResult: null,
      createdAt: Date.now()
    });

    currentScannerPhotoBase64 = null;
    document.getElementById('scanner-preview').classList.add('hidden');
    document.getElementById('scanner-notes').value = '';
    document.getElementById('btn-analyze-now').disabled = true;
    document.getElementById('btn-save-queue').disabled = true;
    await renderScannerQueue();
  });

  // Backup Export & Import (Protects local data)
  document.getElementById('btn-export').addEventListener('click', async () => {
    const tumblerLogs = await dbGetAll('tumblerLogs');
    const scannerQueue = await dbGetAll('scannerQueue');
    const backup = { exportedAt: new Date().toISOString(), tumblerLogs, scannerQueue };
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agate-grit-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  });

  document.getElementById('file-import').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (Array.isArray(data.tumblerLogs)) {
          for (const item of data.tumblerLogs) await dbPut('tumblerLogs', item);
        }
        if (Array.isArray(data.scannerQueue)) {
          for (const item of data.scannerQueue) await dbPut('scannerQueue', item);
        }
        await renderTumblers();
        await renderScannerQueue();
        alert('Backup restored!');
      } catch (err) {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
  });
});
