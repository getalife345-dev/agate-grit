/**
 * AGATE & GRIT v3 — Pro Workshop Edition
 * 100% Local IndexedDB Architecture for Google Pixel 11 Pro
 */

// ==========================================
// 1. TUMBLER BARREL LINEUP (5 UNITS)
// ==========================================
const TUMBLER_UNITS = [
  { id: 'Gritty Titty', name: 'Gritty Titty', type: 'Single Barrel Unit' },
  { id: 'Sludge Slut', name: 'Sludge Slut', type: 'Single Barrel Unit' },
  { id: 'The Grit-toris', name: 'The Grit-toris', type: 'Single Barrel Unit' },
  { id: 'The DP (DP1)', name: 'The DP (DP1)', type: 'Dual Barrel — Drum 1' },
  { id: 'The DP (DP2)', name: 'The DP (DP2)', type: 'Dual Barrel — Drum 2' }
];

const GREAT_LAKES_ROCKS = [
  {
    name: 'Lake Superior Agate',
    hardness: 'MOHS 7.0',
    uv: 'NON-REACTIVE',
    tags: ['hard', 'banded'],
    checklist: 'Concentric iron-red, orange, or white fortifications; waxy quartz luster on fractured faces; translucent glow when backlit.',
    tumbleTip: 'Run repeating Stage 1 (60/90) cycles until all surface pits and fractures are completely flush.'
  },
  {
    name: 'Banded Jasper (Jaspilite)',
    hardness: 'MOHS 6.5–7.0',
    uv: 'NON-REACTIVE',
    tags: ['hard', 'banded'],
    checklist: 'Opaque brick-red jasper alternating with dark metallic specular hematite bands.',
    tumbleTip: 'Safe to run alongside agates in Stage 1. Polishes to a high metallic-red mirror gloss.'
  },
  {
    name: 'Unakite',
    hardness: 'MOHS 6.0–7.0',
    uv: 'NON-REACTIVE',
    tags: ['hard', 'green-pink'],
    checklist: 'Pistachio-green epidote interlocked with salmon-pink orthoclase feldspar and clear quartz.',
    tumbleTip: 'Tumbles cleanly with mixed quartz batches. Inspect after Stage 1 for any undercut feldspar pockets.'
  },
  {
    name: 'Michigan Puddingstone',
    hardness: 'MOHS 7.0',
    uv: 'NON-REACTIVE',
    tags: ['hard'],
    checklist: 'White-to-tan quartzite matrix cemented around rounded red jasper and black chert pebbles.',
    tumbleTip: 'Extremely durable. Requires extended Stage 1 shaping to level the matrix with the jasper clasts.'
  },
  {
    name: 'Epidote & Greenstone',
    hardness: 'MOHS 6.0–7.0',
    uv: 'NON-REACTIVE',
    tags: ['hard', 'green-pink'],
    checklist: 'Olive to pistachio basaltic pebbles, often cross-cut by fine white quartz stringers.',
    tumbleTip: 'Excellent companion stone for beach mixes; yields a smooth satin-to-gloss polish.'
  },
  {
    name: 'Yooperlite (Sodalite Syenite)',
    hardness: 'MOHS 5.5–6.0',
    uv: '365NM ORANGE GLOW',
    tags: ['uv'],
    checklist: 'Mottled gray syenite in daylight; fluorescent sodalite veins glow bright ember-orange under 365nm UV.',
    tumbleTip: 'Softer than quartz. Tumble solely with other Yooperlites and 30%+ ceramic media cushioning.'
  }
];

// ==========================================
// 2. INDEXEDDB STORAGE ENGINE
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
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(storeName, item) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

async function dbDelete(storeName, id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ==========================================
// 3. IMAGE COMPRESSOR
// ==========================================
function compressImageFile(file, maxWidth = 1000, quality = 0.8) {
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
// 4. MIGRATION & STAGE HELPERS
// ==========================================
async function migrateAndSeedTumblers() {
  const existing = await dbGetAll('tumblerLogs');

  for (const log of existing) {
    if (log.unit === 'Old') {
      log.unit = 'Gritty Titty';
      await dbPut('tumblerLogs', log);
    } else if (log.unit === 'New') {
      log.unit = 'Sludge Slut';
      await dbPut('tumblerLogs', log);
    }
  }

  if (existing.length === 0) {
    await dbPut('tumblerLogs', {
      id: 'seed-sludge-1',
      unit: 'Sludge Slut',
      stage: 'Stage 2: Medium (120/220)',
      startDate: '2026-10-14',
      notes: 'Active Stage 2 batch.',
      photo: null,
      createdAt: Date.now() - 3000
    });
    await dbPut('tumblerLogs', {
      id: 'seed-gritty-1',
      unit: 'Gritty Titty',
      stage: 'Stage 4: Polish',
      startDate: '2026-10-14',
      notes: 'Active Stage 4 final polish run.',
      photo: null,
      createdAt: Date.now() - 2000
    });
  }
}

function calculateDaysRunning(startDateStr) {
  const start = new Date(startDateStr + 'T00:00:00');
  const now = new Date();
  const diffMs = now - start;
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  return days === 1 ? 'DAY 01' : `DAY ${String(days).padStart(2, '0')}`;
}

function getStageNumber(stageStr) {
  if (stageStr.includes('Stage 1')) return 1;
  if (stageStr.includes('Stage 2')) return 2;
  if (stageStr.includes('Stage 3')) return 3;
  if (stageStr.includes('Stage 4')) return 4;
  return 4;
}

// ==========================================
// 5. DASHBOARD & TIMELINE RENDERING
// ==========================================
let currentDraftPhotoBase64 = null;
let currentTimelineFilter = 'all';

async function renderTumblersAndTimeline() {
  const logs = await dbGetAll('tumblerLogs');
  logs.sort((a, b) => b.createdAt - a.createdAt);

  const cardsContainer = document.getElementById('tumbler-cards-container');
  cardsContainer.innerHTML = '';

  TUMBLER_UNITS.forEach((unitObj) => {
    const latest = logs.find((l) => l.unit === unitObj.id);
    const card = document.createElement('div');
    card.className = 'surface-card barrel-card';

    if (latest) {
      const daysText = calculateDaysRunning(latest.startDate);
      const stageNum = getStageNumber(latest.stage);
      const isStage4Active = stageNum === 4 && !latest.completed;

      const segmentsHtml = [1, 2, 3, 4].map((step) => {
        if (step <= stageNum) {
          return `<div class="stage-segment ${latest.completed ? 'lit-gold' : 'lit'}"></div>`;
        }
        return `<div class="stage-segment"></div>`;
      }).join('');

      card.innerHTML = `
        <div class="barrel-top-row">
          <div>
            <h3 class="barrel-title">${unitObj.name}</h3>
            <span class="barrel-type-tag">${unitObj.type}</span>
          </div>
          <span class="counter-badge ${latest.completed ? 'done' : ''}">
            ${latest.completed ? 'COMPLETED' : daysText}
          </span>
        </div>

        <div class="stage-status-box">
          <div class="stage-label-row">
            <span class="stage-current-name">${latest.stage}</span>
            <span class="stage-step-fraction">STEP ${stageNum} OF 4</span>
          </div>
          <div class="stage-progress-track">${segmentsHtml}</div>
        </div>

        <div class="barrel-meta-row">
          <span>Cycle Started</span>
          <strong style="font-family: var(--font-mono); color: var(--text-primary);">${latest.startDate}</strong>
        </div>

        ${latest.notes ? `<div class="barrel-notes">${latest.notes}</div>` : ''}
        ${latest.photo ? `<img src="${latest.photo}" class="photo-preview" alt="Batch photo">` : ''}

        <div class="barrel-actions">
          ${isStage4Active ? `
            <button class="btn-complete-stage4 btn-finish-stage4" data-unit="${unitObj.id}" type="button">
              Mark Stage 4 Polish Complete
            </button>
          ` : ''}
          <button class="btn-card-action btn-quick-update" data-unit="${unitObj.id}" type="button">
            Update Stage / Add Photo
          </button>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="barrel-top-row">
          <div>
            <h3 class="barrel-title">${unitObj.name}</h3>
            <span class="barrel-type-tag">${unitObj.type}</span>
          </div>
          <span class="counter-badge" style="opacity:0.5;">STANDBY</span>
        </div>

        <div class="stage-status-box">
          <div class="stage-label-row">
            <span class="stage-current-name" style="color:var(--text-secondary);">No Active Batch</span>
            <span class="stage-step-fraction">IDLE</span>
          </div>
          <div class="stage-progress-track">
            <div class="stage-segment"></div>
            <div class="stage-segment"></div>
            <div class="stage-segment"></div>
            <div class="stage-segment"></div>
          </div>
        </div>

        <div class="barrel-actions">
          <button class="btn-primary-large btn-quick-update" data-unit="${unitObj.id}" type="button">
            Start First Cycle
          </button>
        </div>
      `;
    }

    cardsContainer.appendChild(card);
  });

  document.querySelectorAll('.btn-quick-update').forEach((btn) => {
    btn.addEventListener('click', () => openLogForm(btn.getAttribute('data-unit')));
  });

  document.querySelectorAll('.btn-finish-stage4').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await completeStage4WithCelebration(btn.getAttribute('data-unit'));
    });
  });

  renderTimelineFeed(logs);
}

function renderTimelineFeed(logs) {
  const container = document.getElementById('timeline-container');
  container.innerHTML = '';

  const filtered = logs.filter((l) => {
    if (currentTimelineFilter === 'all') return true;
    return l.unit === currentTimelineFilter;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="surface-card" style="text-align:center; color:var(--text-secondary);">
        No logged cycles for this filter yet.
      </div>
    `;
    return;
  }

  filtered.forEach((item) => {
    const node = document.createElement('div');
    node.className = `surface-card timeline-node ${item.completed ? 'completed-node' : ''}`;
    node.innerHTML = `
      <div class="timeline-meta-header">
        <span class="timeline-date">${item.startDate}</span>
        <button class="btn-text-danger" data-id="${item.id}" type="button">Remove</button>
      </div>
      <div class="timeline-barrel-title">${item.unit}</div>
      <div class="timeline-stage-badge">${item.stage}</div>
      ${item.photo ? `<img src="${item.photo}" class="photo-preview" alt="Timeline photo">` : ''}
      ${item.notes ? `<div class="barrel-notes" style="margin-top:12px;">${item.notes}</div>` : ''}
    `;
    node.querySelector('.btn-text-danger').addEventListener('click', async () => {
      await dbDelete('tumblerLogs', item.id);
      renderTumblersAndTimeline();
    });
    container.appendChild(node);
  });
}

function openLogForm(defaultUnit = 'Gritty Titty') {
  const form = document.getElementById('form-tumbler-log');
  form.classList.remove('hidden');
  document.getElementById('log-unit').value = defaultUnit;
  document.getElementById('log-date').valueAsDate = new Date();
  form.scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// 6. STAGE 4 CELEBRATION
// ==========================================
let celebrationAnimId = null;

async function completeStage4WithCelebration(unitId) {
  const todayStr = new Date().toISOString().slice(0, 10);

  await dbPut('tumblerLogs', {
    id: 'log-finish-' + Date.now(),
    unit: unitId,
    stage: 'Stage 4 — Final Polish Complete',
    startDate: todayStr,
    notes: `Completed Stage 4 final polish in ${unitId}.`,
    photo: null,
    completed: true,
    createdAt: Date.now()
  });

  await renderTumblersAndTimeline();
  triggerMichiganCelebrationModal(unitId);
}

function triggerMichiganCelebrationModal(unitId) {
  const modal = document.getElementById('celebration-modal');
  document.getElementById('celebration-title').textContent = `${unitId} — Polish Complete`;
  modal.classList.remove('hidden');

  const canvas = document.getElementById('celebration-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#ff6224', '#f5b73b', '#10b981', '#e09f67', '#38bdf8'];
  const particles = Array.from({ length: 65 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    size: Math.random() * 6 + 3,
    speedY: Math.random() * 2.5 + 1.5,
    speedX: (Math.random() - 0.5) * 1.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    angle: Math.random() * Math.PI * 2
  }));

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.angle += 0.04;
      if (p.y > canvas.height) p.y = -10;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
      ctx.restore();
    });
    celebrationAnimId = requestAnimationFrame(animateParticles);
  }
  animateParticles();
}

// ==========================================
// 7. ON-DEVICE SPECIMEN SCANNER
// ==========================================
let currentScannerPhotoBase64 = null;

function analyzeImageColorsAndTraits(base64DataUrl, selectedTraits, notes) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.getElementById('color-analysis-canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 100;
      canvas.height = 100;
      ctx.drawImage(img, 0, 0, 100, 100);

      const data = ctx.getImageData(20, 20, 60, 60).data;
      let redWarmCount = 0;
      let greenCount = 0;
      let darkCount = 0;
      let lightCount = 0;
      let total = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        total++;

        if (r > 135 && r > g * 1.25 && g < 140) redWarmCount++;
        if (g > r * 1.05 && g > b * 1.15 && g > 75) greenCount++;
        if (r < 75 && g < 75 && b < 75) darkCount++;
        if (r > 175 && g > 175 && b > 165) lightCount++;
      }

      const redRatio = redWarmCount / total;
      const greenRatio = greenCount / total;
      const lightRatio = lightCount / total;

      let primaryMatch = 'Lake Superior Agate / Banded Jasper';
      let confidence = 'HIGH CONFIDENCE';
      let details = '';
      let tumbleVerdict = 'Mohs 7.0 — Safe for Stage 1 Coarse alongside quartz and jasper.';

      if (selectedTraits.includes('uv')) {
        primaryMatch = 'Yooperlite (Fluorescent Sodalite Syenite)';
        details = '365nm UV orange fluorescence confirms sodalite-bearing syenite.';
        tumbleVerdict = 'Mohs 5.5–6.0 — Tumble in a dedicated batch with extra ceramic cushioning.';
      } else if (selectedTraits.includes('pebbles') || (lightRatio > 0.25 && redRatio > 0.08)) {
        primaryMatch = 'Michigan Puddingstone (Jasper Conglomerate)';
        details = 'Light quartzite matrix detected with contrasting iron-rich jasper clasts.';
        tumbleVerdict = 'Mohs 7.0 — Durable conglomerate. Run extended Stage 1 cycles until flush.';
      } else if (greenRatio > 0.12) {
        primaryMatch = 'Unakite / Epidote Greenstone';
        details = 'Dominant epidote-green mineral signature detected across the specimen.',
        tumbleVerdict = 'Mohs 6.0–7.0 — Compatible with standard Great Lakes mixed beach batches.';
      } else if (selectedTraits.includes('banded') && selectedTraits.includes('translucent')) {
        primaryMatch = 'Lake Superior Agate';
        details = 'Concentric banding paired with light translucency confirms banded chalcedony.';
        tumbleVerdict = 'Mohs 7.0 — Repeat Stage 1 Coarse until all surface husks and fractures clear.';
      } else if (selectedTraits.includes('banded') || redRatio > 0.18) {
        primaryMatch = 'Banded Jasper (Jaspilite) or Agate';
        details = 'Strong iron-oxide red/amber palette detected. Backlight the edge with an LED to separate translucent Agate from opaque Jasper.';
        tumbleVerdict = 'Mohs 7.0 — Both varieties can be tumbled together in Stage 1.';
      } else {
        primaryMatch = 'Great Lakes Chert, Quartzite, or Basalt';
        confidence = 'MODERATE CONFIDENCE';
        details = `Mineral balance: ${Math.round(darkCount / total * 100)}% dark matrix, ${Math.round(lightRatio * 100)}% light silica. Confirm hardness with a steel knife tip (Mohs 5.5).`;
      }

      const summary = [
        `IDENTIFICATION: ${primaryMatch}`,
        `STATUS: ${confidence}`,
        ``,
        `OPTICAL & TRAIT NOTES:`,
        `${details}`,
        notes ? `\nFIELD LOG: ${notes}` : null,
        ``,
        `WORKSHOP PROTOCOL:`,
        `${tumbleVerdict}`
      ].filter(Boolean).join('\n');

      resolve(summary);
    };
    img.src = base64DataUrl;
  });
}

async function renderScannerQueue() {
  const items = await dbGetAll('scannerQueue');
  items.sort((a, b) => b.createdAt - a.createdAt);

  document.getElementById('queue-count').textContent = items.length;
  const list = document.getElementById('scanner-queue-list');
  list.innerHTML = '';

  if (items.length === 0) {
    list.innerHTML = `
      <div class="surface-card" style="text-align:center; color:var(--text-secondary);">
        No specimens saved in your field log yet.
      </div>
    `;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'surface-card';
    card.innerHTML = `
      <div class="timeline-meta-header">
        <span class="timeline-date">LOGGED ${item.dateStr}</span>
        <button class="btn-text-danger" type="button">Remove</button>
      </div>
      <img src="${item.photo}" class="photo-preview" alt="Specimen">
      ${item.notes ? `<div class="barrel-notes" style="margin-top:12px;">${item.notes}</div>` : ''}
      ${item.aiResult ? `<div class="analysis-report">${item.aiResult}</div>` : ''}
    `;
    card.querySelector('.btn-text-danger').addEventListener('click', async () => {
      await dbDelete('scannerQueue', item.id);
      renderScannerQueue();
    });
    list.appendChild(card);
  });
}

// ==========================================
// 8. FIELD GUIDE RENDERER
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
    card.className = 'surface-card';
    card.innerHTML = `
      <h3 class="barrel-title">${rock.name}</h3>
      <div class="spec-row">
        <span class="spec-pill">${rock.hardness}</span>
        <span class="spec-pill">${rock.uv}</span>
      </div>
      <p style="color:var(--text-secondary); font-size:0.92rem; margin-bottom:12px;">${rock.checklist}</p>
      <div class="barrel-notes">${rock.tumbleTip}</div>
    `;
    container.appendChild(card);
  });
}

// ==========================================
// 9. INITIALIZATION & EVENT LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  const unitSelect = document.getElementById('log-unit');
  TUMBLER_UNITS.forEach((u) => {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = u.name;
    unitSelect.appendChild(opt);
  });

  await migrateAndSeedTumblers();
  await renderTumblersAndTimeline();
  renderFieldGuide('all');
  await renderScannerQueue();

  // Bottom Dock Navigation
  document.querySelectorAll('.dock-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dock-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.getAttribute('data-target')).classList.add('active');
      window.scrollTo(0, 0);
    });
  });

  // Log Form Controls
  document.getElementById('btn-open-log-form').addEventListener('click', () => openLogForm('Gritty Titty'));
  document.getElementById('btn-cancel-log').addEventListener('click', () => {
    document.getElementById('form-tumbler-log').classList.add('hidden');
  });

  async function handleLogPhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    currentDraftPhotoBase64 = await compressImageFile(file);
    const preview = document.getElementById('log-photo-preview');
    preview.src = currentDraftPhotoBase64;
    preview.classList.remove('hidden');
  }
  document.getElementById('log-photo-upload').addEventListener('change', handleLogPhotoSelect);
  document.getElementById('log-photo-camera').addEventListener('change', handleLogPhotoSelect);

  document.getElementById('form-tumbler-log').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newEntry = {
      id: 'log-' + Date.now(),
      unit: document.getElementById('log-unit').value,
      stage: document.getElementById('log-stage').value,
      startDate: document.getElementById('log-date').value,
      notes: document.getElementById('log-notes').value.trim(),
      photo: currentDraftPhotoBase64,
      completed: false,
      createdAt: Date.now()
    };

    await dbPut('tumblerLogs', newEntry);
    currentDraftPhotoBase64 = null;
    e.target.reset();
    document.getElementById('log-photo-preview').classList.add('hidden');
    document.getElementById('form-tumbler-log').classList.add('hidden');
    await renderTumblersAndTimeline();
  });

  // Timeline Filter Chips
  document.querySelectorAll('#timeline-filters .chip').forEach((chip) => {
    chip.addEventListener('click', async () => {
      document.querySelectorAll('#timeline-filters .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      currentTimelineFilter = chip.getAttribute('data-unit');
      const logs = await dbGetAll('tumblerLogs');
      logs.sort((a, b) => b.createdAt - a.createdAt);
      renderTimelineFeed(logs);
    });
  });

  // Close Celebration Dialog
  document.getElementById('btn-close-celebration').addEventListener('click', () => {
    document.getElementById('celebration-modal').classList.add('hidden');
    if (celebrationAnimId) cancelAnimationFrame(celebrationAnimId);
  });

  // Field Guide Filter Chips
  document.querySelectorAll('#guide-filters .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#guide-filters .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      renderFieldGuide(chip.getAttribute('data-filter'));
    });
  });

  // Scanner Photo Inputs
  async function handleScannerPhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    currentScannerPhotoBase64 = await compressImageFile(file);
    const preview = document.getElementById('scanner-preview');
    preview.src = currentScannerPhotoBase64;
    preview.classList.remove('hidden');
    document.getElementById('scanner-trait-box').classList.remove('hidden');
    document.getElementById('btn-analyze-now').disabled = false;
    document.getElementById('btn-save-queue').disabled = false;
    document.getElementById('ai-result-box').classList.add('hidden');
  }
  document.getElementById('scanner-upload-input').addEventListener('change', handleScannerPhotoSelect);
  document.getElementById('scanner-camera-input').addEventListener('change', handleScannerPhotoSelect);

  document.querySelectorAll('.trait-toggle').forEach((btn) => {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
  });

  document.getElementById('btn-analyze-now').addEventListener('click', async () => {
    if (!currentScannerPhotoBase64) return;
    const notes = document.getElementById('scanner-notes').value.trim();
    const selectedTraits = Array.from(document.querySelectorAll('.trait-toggle.active')).map((b) =>
      b.getAttribute('data-trait')
    );

    const resultText = await analyzeImageColorsAndTraits(currentScannerPhotoBase64, selectedTraits, notes);
    const resultBox = document.getElementById('ai-result-box');
    resultBox.textContent = resultText;
    resultBox.classList.remove('hidden');
  });

  document.getElementById('btn-save-queue').addEventListener('click', async () => {
    if (!currentScannerPhotoBase64) return;
    const notes = document.getElementById('scanner-notes').value.trim();
    const resultBox = document.getElementById('ai-result-box');
    const aiResult = resultBox.classList.contains('hidden') ? null : resultBox.textContent;

    await dbPut('scannerQueue', {
      id: 'scan-' + Date.now(),
      dateStr: new Date().toLocaleDateString(),
      photo: currentScannerPhotoBase64,
      notes,
      aiResult,
      createdAt: Date.now()
    });

    currentScannerPhotoBase64 = null;
    document.getElementById('scanner-preview').classList.add('hidden');
    document.getElementById('scanner-trait-box').classList.add('hidden');
    document.getElementById('ai-result-box').classList.add('hidden');
    document.getElementById('scanner-notes').value = '';
    document.querySelectorAll('.trait-toggle').forEach((b) => b.classList.remove('active'));
    document.getElementById('btn-analyze-now').disabled = true;
    document.getElementById('btn-save-queue').disabled = true;
    await renderScannerQueue();
  });

  // Backup Export & Restore
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
        await migrateAndSeedTumblers();
        await renderTumblersAndTimeline();
        await renderScannerQueue();
        alert('Backup restored.');
      } catch (err) {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
  });
});
