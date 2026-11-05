/**
 * AGATE & GRIT v2 - Offline-First PWA Logic
 * Custom Built for Google Pixel 11 Pro
 */

// ==========================================
// 1. TUMBLER BARREL CONFIGURATION
// ==========================================
const TUMBLER_UNITS = [
  { id: 'Gritty Titty', name: 'Gritty Titty' },
  { id: 'Sludge Slut', name: 'Sludge Slut' },
  { id: 'The DP (DP1)', name: 'The DP — Barrel 1 (DP1)' },
  { id: 'The DP (DP2)', name: 'The DP — Barrel 2 (DP2)' }
];

// Great Lakes Rock Guide Data
const GREAT_LAKES_ROCKS = [
  {
    name: 'Lake Superior Agate',
    hardness: 'Mohs 7 (Hard - Steel knife will NOT scratch)',
    uv: 'None',
    tags: ['hard', 'banded'],
    checklist: 'Tight concentric iron-red, orange, or white bands, waxy quartz shine inside broken faces, and surface pitting. Translucent glow when held to a flashlight.',
    tumbleTip: 'Tumbles great! Run Stage 1 Coarse extra cycles until all surface pits and fractures are smoothed out.'
  },
  {
    name: 'Banded Jasper (Jaspilite)',
    hardness: 'Mohs 6.5–7 (Hard - Steel knife will NOT scratch)',
    uv: 'None',
    tags: ['hard', 'banded'],
    checklist: 'Completely opaque. Deep brick-red jasper layers alternating with dark metallic silver/black hematite bands.',
    tumbleTip: 'Safe to tumble right alongside agates in Stage 1. Takes a rich, mirror-like metallic and red shine.'
  },
  {
    name: 'Unakite',
    hardness: 'Mohs 6–7 (Hard - Resists steel knife scratch)',
    uv: 'None',
    tags: ['hard', 'green-pink'],
    checklist: 'Pistachio-green epidote mixed with salmon-pink feldspar and clear/gray quartz patches. No stripes or bands.',
    tumbleTip: 'Tumbles well with standard quartz/jasper batches. Check after Stage 1 for any softer pockets.'
  },
  {
    name: 'Michigan Puddingstone',
    hardness: 'Mohs 7 (Hard - Quartzite matrix will NOT scratch)',
    uv: 'None',
    tags: ['hard'],
    checklist: 'White or tan quartzite background packed with rounded red/maroon jasper, black chert, and quartz pebbles.',
    tumbleTip: 'Very hard (Mohs 7). Takes extra time in Stage 1 Coarse to round out evenly.'
  },
  {
    name: 'Epidote & Greenstone',
    hardness: 'Mohs 6–7 (Hard - Resists knife scratch)',
    uv: 'None',
    tags: ['hard', 'green-pink'],
    checklist: 'Rich olive to pistachio-green pebbles, often crisscrossed with thin white quartz veins.',
    tumbleTip: 'Great in mixed Great Lakes beach batches. Takes a smooth satin-to-gloss polish in Stage 4.'
  },
  {
    name: 'Banded Chert & Quartz',
    hardness: 'Mohs 7 (Hard - Steel knife leaves silver streak, no scratch)',
    uv: 'None',
    tags: ['hard', 'banded'],
    checklist: 'Smooth, waxy conchoidal (shell-like) fractures in cream, gray, tan, or smoky layers.',
    tumbleTip: 'Extremely durable filler rock to cushion agates in any barrel.'
  },
  {
    name: 'Yooperlite (Sodalite Syenite)',
    hardness: 'Mohs 5.5–6 (Medium - Knife barely scratches with heavy force)',
    uv: 'STRONG bright orange/yellow ember glow under 365nm UV light',
    tags: ['uv'],
    checklist: 'Looks like ordinary speckled gray syenite in daylight. Under a 365nm UV flashlight at night, sodalite veins glow like burning embers.',
    tumbleTip: 'Softer than agate! Tumble only with other Yooperlites and plenty of ceramic media.'
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
function compressImageFile(file, maxWidth = 1000, quality = 0.78) {
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
// 4. MIGRATION & SEEDING FOR BARRELS
// ==========================================
async function migrateAndSeedTumblers() {
  const existing = await dbGetAll('tumblerLogs');

  // Automatic migration if user had "Old" or "New" from v1
  for (const log of existing) {
    if (log.unit === 'Old') {
      log.unit = 'Gritty Titty';
      await dbPut('tumblerLogs', log);
    } else if (log.unit === 'New') {
      log.unit = 'Sludge Slut';
      await dbPut('tumblerLogs', log);
    }
  }

  // Seed initial barrels if database is completely empty
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
  return days === 1 ? '1 Day' : `${days} Days`;
}

// ==========================================
// 5. TUMBLER DASHBOARD & TIMELINE RENDERING
// ==========================================
let currentDraftPhotoBase64 = null;
let currentTimelineFilter = 'all';

async function renderTumblersAndTimeline() {
  const logs = await dbGetAll('tumblerLogs');
  logs.sort((a, b) => b.createdAt - a.createdAt);

  // 1. Render Active Barrel Cards on Page 1
  const cardsContainer = document.getElementById('tumbler-cards-container');
  cardsContainer.innerHTML = '';

  TUMBLER_UNITS.forEach((unitObj) => {
    const latestForUnit = logs.find((l) => l.unit === unitObj.id);
    const card = document.createElement('div');
    card.className = 'card';

    if (latestForUnit) {
      const daysText = calculateDaysRunning(latestForUnit.startDate);
      const isStage4 = latestForUnit.stage.includes('Stage 4') && !latestForUnit.completed;

      card.innerHTML = `
        <div class="tumbler-header">
          <span class="tumbler-name">${unitObj.name}</span>
          <span class="days-pill">${latestForUnit.completed ? '🏆 DONE' : `⏱ ${daysText}`}</span>
        </div>
        <div class="stage-banner">${latestForUnit.stage}</div>
        <p><strong>Date:</strong> ${latestForUnit.startDate}</p>
        ${latestForUnit.notes ? `<p style="margin-top:6px;"><strong>Notes:</strong> ${latestForUnit.notes}</p>` : ''}
        ${latestForUnit.photo ? `<img src="${latestForUnit.photo}" class="photo-preview" alt="Batch photo">` : ''}
        ${isStage4 ? `
          <button class="btn-celebrate btn-finish-stage4" data-unit="${unitObj.id}" type="button">
            🌲 Complete Stage 4 Tumble!
          </button>
        ` : ''}
        <button class="btn-secondary btn-quick-update" data-unit="${unitObj.id}" type="button">
          🔄 Log Next Stage for ${unitObj.id}
        </button>
      `;
    } else {
      card.innerHTML = `
        <div class="tumbler-header">
          <span class="tumbler-name">${unitObj.name}</span>
        </div>
        <p class="helper-text">Barrel ready for a new batch.</p>
        <button class="btn-primary btn-quick-update" data-unit="${unitObj.id}" type="button">
          + Start ${unitObj.id} Batch
        </button>
      `;
    }
    cardsContainer.appendChild(card);
  });

  // Attach Stage Update Listeners
  document.querySelectorAll('.btn-quick-update').forEach((btn) => {
    btn.addEventListener('click', () => openLogForm(btn.getAttribute('data-unit')));
  });

  // Attach Stage 4 Celebration Listeners
  document.querySelectorAll('.btn-finish-stage4').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const unitId = btn.getAttribute('data-unit');
      await completeStage4WithCelebration(unitId);
    });
  });

  // 2. Render Visual Timeline on Page 2
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
    container.innerHTML = '<p class="helper-text">No timeline entries for this barrel yet. Log a stage with a photo to start tracking progression!</p>';
    return;
  }

  filtered.forEach((item) => {
    const node = document.createElement('div');
    node.className = `timeline-node ${item.completed ? 'completed-node' : ''}`;
    node.innerHTML = `
      <div class="timeline-date">📅 ${item.startDate}</div>
      <div class="timeline-unit">${item.unit}</div>
      <div class="timeline-stage-pill">${item.stage}</div>
      ${item.photo ? `<img src="${item.photo}" class="photo-preview" alt="Timeline progression photo">` : ''}
      ${item.notes ? `<p style="margin-top:6px;">${item.notes}</p>` : ''}
      <button class="btn-delete" data-id="${item.id}" type="button">Delete Entry</button>
    `;
    node.querySelector('.btn-delete').addEventListener('click', async () => {
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
// 6. MICHIGAN NATURE STAGE 4 CELEBRATION
// ==========================================
let celebrationAnimId = null;

async function completeStage4WithCelebration(unitId) {
  const todayStr = new Date().toISOString().slice(0, 10);

  await dbPut('tumblerLogs', {
    id: 'log-finish-' + Date.now(),
    unit: unitId,
    stage: '🏆 Stage 4 Polish Complete!',
    startDate: todayStr,
    notes: `Finished Stage 4 Polish in ${unitId}! Ready for display.`,
    photo: null,
    completed: true,
    createdAt: Date.now()
  });

  await renderTumblersAndTimeline();
  triggerMichiganCelebrationModal(unitId);
}

function triggerMichiganCelebrationModal(unitId) {
  const modal = document.getElementById('celebration-modal');
  document.getElementById('celebration-title').textContent = `${unitId} Polish Complete!`;
  modal.classList.remove('hidden');

  const canvas = document.getElementById('celebration-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Create Michigan nature particles (Agate sparks, copper embers, pine needles, lake drops)
  const colors = ['#ff6b2b', '#ffb703', '#2d6a4f', '#457b9d', '#d4885c', '#7ef7ae'];
  const particles = Array.from({ length: 75 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    size: Math.random() * 7 + 4,
    speedY: Math.random() * 3 + 2,
    speedX: (Math.random() - 0.5) * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    angle: Math.random() * Math.PI * 2
  }));

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.angle += 0.05;
      if (p.y > canvas.height) p.y = -10;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
      ctx.restore();
    });
    celebrationAnimId = requestAnimationFrame(animateParticles);
  }
  animateParticles();
}

// ==========================================
// 7. BUILT-IN ROCK SCANNER (ZERO API KEYS)
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

      let primaryMatch = 'Lake Superior Agate or Banded Jasper';
      let confidence = 'High';
      let details = '';
      let tumbleVerdict = 'Safe for Stage 1 Coarse with hard quartz, agates, and jaspers.';

      if (selectedTraits.includes('uv')) {
        primaryMatch = 'Yooperlite (Fluorescent Sodalite Syenite)';
        details = 'Bright orange/ember UV fluorescence is the unmistakable signature of Yooperlite.';
        tumbleVerdict = 'Mohs 5.5–6: Tumble gently in a separate batch with extra ceramic media.';
      } else if (selectedTraits.includes('pebbles') || (lightRatio > 0.25 && redRatio > 0.08)) {
        primaryMatch = 'Michigan Puddingstone (Jasper Conglomerate)';
        details = 'Light quartzite matrix detected alongside iron-red/maroon jasper clasts.';
        tumbleVerdict = 'Mohs 7: Very hard! Run extra cycles in Stage 1 Coarse until pebbles sit flush.';
      } else if (greenRatio > 0.12) {
        primaryMatch = 'Unakite or Epidote Greenstone';
        details = 'Strong pistachio/olive-green mineral tones detected in the stone.';
        tumbleVerdict = 'Mohs 6–7: Tumbles great in mixed Great Lakes beach batches.';
      } else if (selectedTraits.includes('banded') && selectedTraits.includes('translucent')) {
        primaryMatch = 'Lake Superior Agate';
        details = 'Iron-stained banding combined with flashlight translucency confirms chalcedony/agate.';
        tumbleVerdict = 'Mohs 7: Ideal tumbler stone. Keep in Stage 1 until all surface pits disappear.';
      } else if (selectedTraits.includes('banded') || redRatio > 0.18) {
        primaryMatch = 'Banded Jasper (Jaspilite) or Lake Superior Agate';
        details = 'Rich iron-oxide red/orange tones detected. Hold a bright phone flashlight pressed against the edge: if light passes through, it is Agate; if completely solid/opaque, it is Jasper.';
        tumbleVerdict = 'Mohs 7: Both Agate and Jasper tumble together smoothly in Stage 1.';
      } else {
        primaryMatch = 'Great Lakes Chert, Quartzite, or Basalt';
        confidence = 'Moderate';
        details = `Neutral mineral palette (${Math.round(darkCount / total * 100)}% dark tones, ${Math.round(lightRatio * 100)}% light quartz tones). Test with the tip of a steel pocket knife: if the steel leaves a silver metallic line without digging in, it is Mohs 7 Quartz/Chert.`;
      }

      const summary = [
        `🪨 MOST LIKELY MATCH: ${primaryMatch} (${confidence} Match)`,
        ``,
        `🔍 ANALYSIS: ${details}`,
        notes ? `📍 FIELD NOTES: ${notes}` : null,
        ``,
        `⚙️ TUMBLER VERDICT: ${tumbleVerdict}`
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
    list.innerHTML = '<p class="helper-text">No saved field finds yet.</p>';
    return;
  }

  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="tumbler-header">
        <strong>Field Find (${item.dateStr})</strong>
        <span class="badge online">SAVED LOCAL</span>
      </div>
      <img src="${item.photo}" class="photo-preview" alt="Field find">
      ${item.notes ? `<p><strong>Field Notes:</strong> ${item.notes}</p>` : ''}
      ${item.aiResult ? `<div class="ai-result">${item.aiResult}</div>` : ''}
      <button class="btn-delete" type="button">Delete Find</button>
    `;
    card.querySelector('.btn-delete').addEventListener('click', async () => {
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
// 9. APP INITIALIZATION & EVENT LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // Populate Barrel Select Dropdown
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

  // Tumbler Log Form Open / Close
  document.getElementById('btn-open-log-form').addEventListener('click', () => openLogForm('Gritty Titty'));
  document.getElementById('btn-cancel-log').addEventListener('click', () => {
    document.getElementById('form-tumbler-log').classList.add('hidden');
  });

  // Handle BOTH Upload Photo and Take Photo inputs for Tumbler Log
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

  // Submit Tumbler Log
  document.getElementById('form-tumbler-log').addEventListener('submit', async (e) => {
    e.preventDefault();
    const unitVal = document.getElementById('log-unit').value;
    const stageVal = document.getElementById('log-stage').value;

    const newEntry = {
      id: 'log-' + Date.now(),
      unit: unitVal,
      stage: stageVal,
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

  // Timeline Barrel Filters
  document.querySelectorAll('#timeline-filters .filter-pill').forEach((pill) => {
    pill.addEventListener('click', async () => {
      document.querySelectorAll('#timeline-filters .filter-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      currentTimelineFilter = pill.getAttribute('data-unit');
      const logs = await dbGetAll('tumblerLogs');
      logs.sort((a, b) => b.createdAt - a.createdAt);
      renderTimelineFeed(logs);
    });
  });

  // Close Celebration Modal
  document.getElementById('btn-close-celebration').addEventListener('click', () => {
    document.getElementById('celebration-modal').classList.add('hidden');
    if (celebrationAnimId) cancelAnimationFrame(celebrationAnimId);
  });

  // Field Guide Filter Pills
  document.querySelectorAll('#guide-filters .filter-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#guide-filters .filter-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      renderFieldGuide(pill.getAttribute('data-filter'));
    });
  });

  // Scanner Upload & Camera Inputs
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

  // Scanner Trait Toggles
  document.querySelectorAll('.trait-toggle').forEach((btn) => {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
  });

  // Run Instant Built-In Rock ID
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

  // Save Scanner Find to Local Queue
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

  // Backup Export & Import
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
        alert('Backup restored!');
      } catch (err) {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
  });
});
