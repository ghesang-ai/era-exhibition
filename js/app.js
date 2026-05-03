/* ═══════════════════════════════════════════════════
   ERA-EXHIBITION — App JS  (Phase 4)
   Tab · Dark mode · CSV · Counters · Modal ·
   Alerts · Entry editing · Multi-event
   ═══════════════════════════════════════════════════ */

const TABS = ['overview','planning','daily','budget','insights','report'];

const LS_DAILY   = 'era-daily-entries';
const LS_BUDGET  = 'era-budget-actuals';
const LS_TAB     = 'era-tab';
const LS_THEME   = 'era-theme';
const LS_EVENTS  = 'era-events';
const LS_CUR_EVT = 'era-current-event';

/* ════════════════════════════════════
   DARK MODE
   ════════════════════════════════════ */
function applyTheme(theme) {
  document.body.classList.toggle('dark', theme === 'dark');
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀' : '◑';
  try { localStorage.setItem(LS_THEME, theme); } catch(e) {}
  setTimeout(() => { if (window.initCharts) window.initCharts(); }, 80);
}
function toggleTheme() {
  applyTheme(document.body.classList.contains('dark') ? 'light' : 'dark');
}

/* ════════════════════════════════════
   TAB SWITCHING
   ════════════════════════════════════ */
function switchTab(name) {
  TABS.forEach(t => {
    document.getElementById('panel-' + t)?.classList.toggle('active', t === name);
    document.getElementById('tab-'   + t)?.classList.toggle('active', t === name);
  });
  try { sessionStorage.setItem(LS_TAB, name); } catch(e) {}
  if (['overview','daily','budget'].includes(name)) {
    setTimeout(() => { if (window.initCharts) window.initCharts(); animateBars(); }, 60);
  }
  if (name === 'overview') setTimeout(runCounters, 120);
}

/* ════════════════════════════════════
   BRAND TABS
   ════════════════════════════════════ */
function switchBrand(el) {
  el.closest('.brand-tabs').querySelectorAll('.brand-tab')
    .forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

/* ════════════════════════════════════
   AI PROMPT
   ════════════════════════════════════ */
function sendQuickPrompt(text) {
  const ta = document.getElementById('ai-textarea');
  if (ta) { ta.value = text; ta.focus(); }
}
function sendPrompt(text) {
  if (typeof window.__eraSendPrompt === 'function') {
    window.__eraSendPrompt(text);
  } else {
    navigator.clipboard?.writeText(text)
      .then(()  => showToast('Prompt disalin ✓','success'))
      .catch(()  => {});
  }
}

/* ════════════════════════════════════
   TOAST
   ════════════════════════════════════ */
function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.textContent = msg;
  const bg = { success:'#1D9E75', error:'#D85A30', info:'#0C0D0E' };
  Object.assign(t.style, {
    position:'fixed', bottom:'24px', right:'24px',
    background: bg[type] || bg.info,
    color:'#fff', padding:'10px 18px', borderRadius:'8px',
    fontSize:'13px', fontFamily:'inherit',
    boxShadow:'0 4px 16px rgba(0,0,0,.2)',
    zIndex:'9999', transition:'all .25s ease',
    opacity:'0', transform:'translateY(8px)',
  });
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity='1'; t.style.transform='translateY(0)'; });
  setTimeout(() => {
    t.style.opacity='0'; t.style.transform='translateY(8px)';
    setTimeout(() => t.remove(), 260);
  }, 2600);
}

/* ════════════════════════════════════
   ANIMATE BARS
   ════════════════════════════════════ */
function animateBars() {
  document.querySelectorAll('.progress-fill,.funnel-fill,.budget-bar').forEach(bar => {
    const target = bar.dataset.width || bar.style.width || '0%';
    bar.style.transition = 'none';
    bar.style.width = '0';
    requestAnimationFrame(() => {
      bar.style.transition = 'width .65s cubic-bezier(.4,0,.2,1)';
      bar.style.width = target;
    });
  });
}

/* ════════════════════════════════════
   ANIMATED COUNTERS
   ════════════════════════════════════ */
let _countersRan = false;
function runCounters() {
  if (_countersRan) return;
  _countersRan = true;
  document.querySelectorAll('[data-count]').forEach(el => {
    const target   = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0');
    const prefix   = el.dataset.prefix || '';
    const suffix   = el.dataset.suffix || '';
    const dur      = 900;
    const t0       = performance.now();
    (function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (target * e).toLocaleString('id-ID', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  });
}

/* ════════════════════════════════════
   FORMATTING HELPERS
   ════════════════════════════════════ */
function fmtRp(n) {
  if (!n || isNaN(n)) return '—';
  if (n >= 1e9) return 'Rp ' + (n/1e9).toFixed(2) + ' M';
  if (n >= 1e6) return 'Rp ' + (n/1e6).toFixed(1) + ' jt';
  if (n >= 1e3) return 'Rp ' + (n/1e3).toFixed(0) + ' rb';
  return 'Rp ' + n;
}

/* ════════════════════════════════════
   DAILY INPUT — LIVE CALC
   ════════════════════════════════════ */
function updateLiveCalc() {
  const walkin  = parseInt(document.getElementById('inp-walkin')?.value)    || 0;
  const trx     = parseInt(document.getElementById('inp-trx')?.value)       || 0;
  const revenue = parseFloat(document.getElementById('inp-revenue')?.value) || 0;
  const mall    = parseInt(document.getElementById('inp-mall')?.value)      || 0;

  const conv    = walkin > 0 ? ((trx/walkin)*100).toFixed(1) : '—';
  const revTrx  = trx > 0   ? Math.round(revenue/trx)        : 0;
  const capture = mall > 0  ? ((walkin/mall)*100).toFixed(1)  : '—';

  const set = (id, v, color) => {
    const el = document.getElementById(id);
    if (!el) return; el.textContent = v;
    if (color) el.style.color = color;
  };
  set('live-conv', conv !== '—' ? conv+'%' : '—',
      conv !== '—' && parseFloat(conv) >= 15 ? '#0D6E50' : '#8B5A00');
  set('live-revtrx',  revTrx > 0 ? fmtRp(revTrx) : '—');
  set('live-capture', capture !== '—' ? capture+'%' : '—');

  const badge = document.getElementById('live-conv-badge');
  if (badge && conv !== '—') {
    const cv = parseFloat(conv);
    badge.className = 'metric-badge ' + (cv>=18?'mb-green':cv>=15?'mb-amber':'mb-red');
  }
}

/* ════════════════════════════════════
   DAILY DATA — LOCALSTORAGE
   ════════════════════════════════════ */
function loadDailyData() {
  try { return JSON.parse(localStorage.getItem(LS_DAILY) || '{}'); }
  catch(e) { return {}; }
}

// State for which entry is being edited
let _editingKey = null;

function saveDailyEntry() {
  const walkin  = parseInt(document.getElementById('inp-walkin')?.value)    || 0;
  const trx     = parseInt(document.getElementById('inp-trx')?.value)       || 0;
  const revenue = parseFloat(document.getElementById('inp-revenue')?.value) || 0;
  const mall    = parseInt(document.getElementById('inp-mall')?.value)      || 0;
  if (!walkin && !trx && !revenue) { showToast('Isi minimal satu field dulu','error'); return; }

  const today    = new Date().toISOString().slice(0,10);
  const brand    = document.querySelector('.brand-tabs .brand-tab.active')?.textContent?.trim() || 'iBox';
  const notes    = document.getElementById('inp-notes')?.value || '';
  const checks   = [...document.querySelectorAll('.vmd-item input[type="checkbox"]')];
  const vmdScore = Math.round((checks.filter(c=>c.checked).length / checks.length)*100);
  const entry    = {
    date:today, brand, walkin, trx, revenue, mall, vmdScore, notes,
    conv: walkin>0 ? +((trx/walkin)*100).toFixed(1) : 0,
    savedAt: new Date().toISOString(),
  };

  const all = loadDailyData();
  const key = _editingKey || `${today}_${brand}`;
  all[key]  = entry;
  try {
    localStorage.setItem(LS_DAILY, JSON.stringify(all));
    showToast(_editingKey ? 'Data diupdate ✓' : 'Data tersimpan ✓', 'success');
    clearEditMode();
    refreshDailyTable();
    updateRunningTotals();
    refreshAlerts();
  } catch(e) { showToast('Gagal simpan: '+e.message,'error'); }
}

function clearDailyForm() {
  ['inp-walkin','inp-trx','inp-revenue','inp-mall'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const notes = document.getElementById('inp-notes');
  if (notes) notes.value = '';
  clearEditMode();
  updateLiveCalc();
}

function startEdit(key, entry) {
  _editingKey = key;
  document.getElementById('inp-walkin' )?.setAttribute('value', entry.walkin  || '');
  document.getElementById('inp-walkin' ).value = entry.walkin  || '';
  document.getElementById('inp-mall'   ).value = entry.mall    || '';
  document.getElementById('inp-trx'    ).value = entry.trx     || '';
  document.getElementById('inp-revenue').value = entry.revenue || '';
  const notes = document.getElementById('inp-notes');
  if (notes) notes.value = entry.notes || '';
  updateLiveCalc();

  // Highlight save button
  const saveBtn = document.getElementById('save-daily-btn');
  if (saveBtn) { saveBtn.textContent = 'Update Data ✓'; }

  // Scroll to form
  document.getElementById('panel-daily')?.scrollTo({ top: 0, behavior: 'smooth' });
  switchTab('daily');
  showToast('Edit mode — ubah data lalu klik Update ✓','info');
}

function clearEditMode() {
  _editingKey = null;
  const saveBtn = document.getElementById('save-daily-btn');
  if (saveBtn) { saveBtn.textContent = 'Simpan Data ✓'; }
  document.querySelectorAll('#daily-history-body tr.editing')
    .forEach(r => r.classList.remove('editing'));
}

function deleteEntry(key) {
  if (!confirm('Hapus data ini?')) return;
  const all = loadDailyData();
  delete all[key];
  localStorage.setItem(LS_DAILY, JSON.stringify(all));
  refreshDailyTable();
  updateRunningTotals();
  refreshAlerts();
  showToast('Data dihapus','info');
}

function refreshDailyTable() {
  const tbody = document.getElementById('daily-history-body');
  if (!tbody) return;

  // Remove previously injected saved rows
  tbody.querySelectorAll('[data-saved]').forEach(r => r.remove());

  const entries = Object.entries(loadDailyData())
    .sort(([,a],[,b]) => a.date > b.date ? -1 : 1);

  entries.forEach(([key, e]) => {
    const tr = document.createElement('tr');
    tr.dataset.saved = '1';
    tr.dataset.key   = key;
    tr.innerHTML = `
      <td>${e.date.slice(5)} · ${e.brand}</td>
      <td>${(e.walkin||0).toLocaleString()}</td>
      <td>${(e.trx||0).toLocaleString()}</td>
      <td>${e.conv||0}%</td>
      <td>${fmtRp(e.revenue)}</td>
      <td><span class="metric-badge ${e.vmdScore>=85?'mb-green':'mb-amber'}" style="font-size:10px">${e.vmdScore}</span></td>
      <td style="white-space:nowrap;padding:4px 8px">
        <button onclick="startEdit('${key}', ${JSON.stringify(e).replace(/'/g,"\\'")})"
          class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:11px">✎</button>
        <button onclick="deleteEntry('${key}')"
          class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:11px;color:var(--red-txt)">✕</button>
      </td>`;
    // Highlight if currently editing
    if (_editingKey === key) tr.classList.add('editing');
    tbody.insertBefore(tr, tbody.firstChild);
  });
}

function updateRunningTotals() {
  const vals = Object.values(loadDailyData());
  if (!vals.length) return;
  const tw = vals.reduce((s,e) => s+(e.walkin||0),0);
  const tt = vals.reduce((s,e) => s+(e.trx||0),0);
  const tr = vals.reduce((s,e) => s+(e.revenue||0),0);
  const tc = tw > 0 ? ((tt/tw)*100).toFixed(1) : 0;
  const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  set('total-walkin',  tw.toLocaleString());
  set('total-trx',     tt.toLocaleString());
  set('total-revenue', fmtRp(tr));
  set('total-conv',    tc+'%');
}

/* ════════════════════════════════════
   CSV EXPORT
   ════════════════════════════════════ */
function exportCSV() {
  const staticRows = [
    {date:'2026-04-27',brand:'iBox',walkin:368,trx:58,conv:15.8,revenue:165000000,vmdScore:90,notes:''},
    {date:'2026-04-28',brand:'iBox',walkin:412,trx:72,conv:17.5,revenue:198000000,vmdScore:88,notes:''},
    {date:'2026-04-29',brand:'iBox',walkin:445,trx:84,conv:18.9,revenue:231000000,vmdScore:91,notes:''},
    {date:'2026-04-30',brand:'iBox',walkin:390,trx:65,conv:16.7,revenue:178000000,vmdScore:82,notes:''},
    {date:'2026-05-01',brand:'iBox',walkin:510,trx:98,conv:19.2,revenue:268000000,vmdScore:89,notes:''},
    {date:'2026-05-02',brand:'iBox',walkin:722,trx:147,conv:20.4,revenue:390000000,vmdScore:85,notes:''},
  ];
  const saved   = Object.values(loadDailyData()).sort((a,b)=>a.date>b.date?1:-1);
  const savedKeys = new Set(saved.map(r=>r.date+'_'+r.brand));
  const merged  = [...staticRows.filter(r=>!savedKeys.has(r.date+'_'+r.brand)), ...saved]
    .sort((a,b)=>a.date>b.date?1:-1);

  const hdr  = 'Tanggal,Brand,Walk-in,Transaksi,Conv Rate (%),Revenue (Rp),VMD Score,Notes';
  const body = merged.map(r=>[
    r.date,r.brand,r.walkin,r.trx,r.conv,r.revenue,r.vmdScore,
    `"${(r.notes||'').replace(/"/g,'""')}"`
  ].join(',')).join('\n');

  const blob = new Blob(['﻿'+hdr+'\n'+body],{type:'text/csv;charset=utf-8;'});
  const a    = Object.assign(document.createElement('a'),{
    href: URL.createObjectURL(blob),
    download: 'ERA-EXHIBITION_iBox_BJX_2026.csv',
  });
  a.click(); URL.revokeObjectURL(a.href);
  showToast('CSV didownload ✓','success');
}

/* ════════════════════════════════════
   PRINT / PDF
   ════════════════════════════════════ */
function printReport() {
  switchTab('report');
  setTimeout(() => window.print(), 220);
}

/* ════════════════════════════════════
   BUDGET — EDITABLE + LIVE ROI
   ════════════════════════════════════ */
function loadBudgetActuals() {
  try { return JSON.parse(localStorage.getItem(LS_BUDGET)||'null'); }
  catch(e) { return null; }
}
function saveBudgetActuals(data) {
  try { localStorage.setItem(LS_BUDGET, JSON.stringify(data)); } catch(e) {}
}
function initBudget() {
  const saved = loadBudgetActuals();
  if (!saved) return;
  document.querySelectorAll('.budget-actual-input')
    .forEach(inp => { if (saved[inp.dataset.key]!==undefined) inp.value=saved[inp.dataset.key]; });
  recomputeBudget();
}
function recomputeBudget() {
  let total = 0;
  const data = {};
  document.querySelectorAll('.budget-actual-input').forEach(inp => {
    const key    = inp.dataset.key;
    const plan   = parseFloat(inp.dataset.plan) || 0;
    const actual = parseFloat(inp.value) || 0;
    const pct    = plan>0 ? Math.round((actual/plan)*100) : 0;
    data[key] = actual; total += actual;
    const bar = document.querySelector(`.budget-bar[data-key="${key}"]`);
    if (bar) {
      const w = Math.min(pct,120)+'%';
      bar.dataset.width = w; bar.style.width = w;
      bar.className = 'budget-bar'+(pct>100?' over':pct>90?' warn':'');
    }
    const pctEl = document.querySelector(`.budget-pct[data-key="${key}"]`);
    if (pctEl) {
      pctEl.textContent = pct+'%';
      pctEl.style.color = pct>100?'var(--red-txt)':pct>90?'var(--amber-txt)':'var(--green-txt)';
    }
  });
  saveBudgetActuals(data);
  const sisa    = Math.max(80-total,0);
  const pctUsed = Math.round((total/80)*100);
  const revenue = parseFloat(document.getElementById('inp-revenue-budget')?.value)||1430;
  const roi     = total>0 ? Math.round(((revenue-total)/total)*100) : 0;
  const set = (id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
  set('budget-total-actual',`Rp ${total.toFixed(1)} jt`);
  set('budget-sisa',        `Rp ${sisa.toFixed(1)} jt`);
  set('budget-pct-used',    pctUsed+'%');
  set('budget-roi',         (roi>0?'+':'')+roi+'%');
}

/* ════════════════════════════════════
   ALERT SYSTEM
   ════════════════════════════════════ */
const STATIC_DAILY = [
  {date:'2026-04-27',walkin:368,trx:58,conv:15.8,revenue:165e6,vmdScore:90},
  {date:'2026-04-28',walkin:412,trx:72,conv:17.5,revenue:198e6,vmdScore:88},
  {date:'2026-04-29',walkin:445,trx:84,conv:18.9,revenue:231e6,vmdScore:91},
  {date:'2026-04-30',walkin:390,trx:65,conv:16.7,revenue:178e6,vmdScore:82},
  {date:'2026-05-01',walkin:510,trx:98,conv:19.2,revenue:268e6,vmdScore:89},
  {date:'2026-05-02',walkin:722,trx:147,conv:20.4,revenue:390e6,vmdScore:85},
];

function buildAlerts() {
  const saved  = Object.values(loadDailyData());
  const allRows = [...STATIC_DAILY, ...saved];
  const alerts = [];

  // Check each day
  allRows.forEach(d => {
    const label = d.date ? d.date.slice(5) : '?';
    if (d.conv > 0 && d.conv < 15) {
      alerts.push({ level:'error', icon:'↓',
        text: `Conv. Rate ${d.conv}% di ${label}`,
        sub:  'Di bawah target 15% — perlu tindakan segera' });
    }
    if (d.vmdScore > 0 && d.vmdScore < 80) {
      alerts.push({ level:'warn', icon:'!',
        text: `VMD Score ${d.vmdScore}/100 di ${label}`,
        sub:  'Di bawah standar minimum 80 — cek display' });
    }
  });

  // Budget overspend
  const actuals = loadBudgetActuals();
  if (actuals) {
    const total = Object.values(actuals).reduce((s,v)=>s+v,0);
    if (total > 80) alerts.push({ level:'error', icon:'₿',
      text: `Budget over Rp ${(total-80).toFixed(1)} jt`,
      sub:  'Total realisasi melebihi anggaran Rp 80 jt' });
  }

  // Cashier bottleneck (from VMD check data)
  alerts.push({ level:'warn', icon:'!',
    text:  'Cashier bottleneck terdeteksi',
    sub:   'Weekend antrian >15 mnt — pertimbangkan kasir tambahan' });

  // All OK flag
  if (alerts.length === 1) { // only the static bottleneck one
    alerts.unshift({ level:'ok', icon:'✓',
      text:  'Semua metrik utama di atas target',
      sub:   'Conv. Rate, VMD, Budget semua hijau' });
  }

  return alerts;
}

function refreshAlerts() {
  const panel  = document.getElementById('alerts-panel');
  if (!panel) return;
  const alerts = buildAlerts();

  // Update tab badge
  const dailyWrap = document.getElementById('tab-daily-wrap');
  const hasError  = alerts.some(a => a.level === 'error');
  const hasWarn   = alerts.some(a => a.level === 'warn');
  if (dailyWrap) dailyWrap.classList.toggle('has-alert', hasError || hasWarn);

  if (!alerts.length) {
    panel.innerHTML = '<div class="alert-empty">✓ Tidak ada alert</div>';
    return;
  }
  panel.innerHTML = alerts.map(a => `
    <div class="alert-row a-${a.level}">
      <div class="alert-icon">${a.icon}</div>
      <div>
        <div class="alert-text">${a.text}</div>
        <div class="alert-sub">${a.sub}</div>
      </div>
    </div>`).join('');
}

/* ════════════════════════════════════
   MULTI-EVENT — MODAL
   ════════════════════════════════════ */
const DEFAULT_EVENTS = [
  { id:'ibox-bjx-2026', name:'iBox Roadshow — Bintaro Jaya Xchange',
    dates:'27 Apr – 3 Mei 2026', brand:'iBox', status:'live',
    walkin:2847, revenue:'Rp 1,43 M', conv:'18,4%', roi:'+75%' },
];

function loadEvents() {
  try { return JSON.parse(localStorage.getItem(LS_EVENTS)||'null') || DEFAULT_EVENTS; }
  catch(e) { return DEFAULT_EVENTS; }
}
function saveEvents(events) {
  try { localStorage.setItem(LS_EVENTS, JSON.stringify(events)); } catch(e) {}
}

function openAddEventModal() {
  const overlay = document.getElementById('modal-add-event');
  if (overlay) overlay.classList.add('open');
  document.getElementById('modal-event-name')?.focus();
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}
function submitAddEvent() {
  const name  = document.getElementById('modal-event-name')?.value.trim();
  const dates = document.getElementById('modal-event-dates')?.value.trim();
  const brand = document.getElementById('modal-event-brand')?.value.trim() || 'Custom';
  const venue = document.getElementById('modal-event-venue')?.value.trim();
  const target= document.getElementById('modal-event-target')?.value.trim();

  if (!name) { showToast('Nama event wajib diisi','error'); return; }

  const id     = 'event-' + Date.now();
  const events = loadEvents();
  events.push({ id, name, dates, brand, venue, target, status:'plan',
    walkin:'—', revenue:'—', conv:'—', roi:'—' });
  saveEvents(events);
  localStorage.setItem(LS_CUR_EVT, id);
  closeModal('modal-add-event');
  clearAddEventForm();
  refreshEventCards();
  refreshEventSelector();
  showToast(`"${name}" ditambahkan ✓`,'success');
}
function clearAddEventForm() {
  ['modal-event-name','modal-event-dates','modal-event-brand',
   'modal-event-venue','modal-event-target'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

/* ════════════════════════════════════
   EVENT CARDS (multi-event summary)
   ════════════════════════════════════ */
function refreshEventCards() {
  const container = document.getElementById('event-cards-container');
  if (!container) return;
  const events = loadEvents();

  container.innerHTML = events.map(e => {
    const brandCls = e.brand.toLowerCase().includes('samsung') ? 'brand-samsung'
                   : e.brand.toLowerCase().includes('erafone')  ? 'brand-erafone' : '';
    const statusBadge = e.status === 'live'
      ? '<span class="badge badge-live badge-dot" style="font-size:10px">LIVE</span>'
      : e.status === 'done'
      ? '<span class="badge badge-done" style="font-size:10px">Done</span>'
      : '<span class="badge badge-plan" style="font-size:10px">Plan</span>';
    return `
      <div class="event-card ${brandCls}" onclick="switchEventTo('${e.id}')">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
          <div class="event-card-name">${e.name}</div>
          ${statusBadge}
        </div>
        <div class="event-card-meta">${e.dates || '—'} · ${e.brand}</div>
        <div class="event-card-kpis">
          <div class="event-kpi">
            <div class="event-kpi-val">${e.walkin||'—'}</div>
            <div class="event-kpi-lbl">Walk-in</div>
          </div>
          <div class="event-kpi">
            <div class="event-kpi-val">${e.revenue||'—'}</div>
            <div class="event-kpi-lbl">Revenue</div>
          </div>
          <div class="event-kpi">
            <div class="event-kpi-val">${e.conv||'—'}</div>
            <div class="event-kpi-lbl">Conv. Rate</div>
          </div>
          <div class="event-kpi">
            <div class="event-kpi-val" style="color:var(--green-txt)">${e.roi||'—'}</div>
            <div class="event-kpi-lbl">ROI</div>
          </div>
        </div>
      </div>`;
  }).join('') + `
    <div class="event-card-add" onclick="openAddEventModal()">
      <span>＋</span>
      <p>Tambah Exhibition Baru</p>
    </div>`;
}

function switchEventTo(id) {
  localStorage.setItem(LS_CUR_EVT, id);
  const events = loadEvents();
  const ev     = events.find(e => e.id === id);
  if (!ev) return;
  // Update header title
  const title = document.querySelector('#panel-overview .page-title');
  if (title) title.innerHTML = `<div class="glow-dot pulse"></div>${ev.name}`;
  const sub = document.querySelector('#panel-overview .page-subtitle');
  if (sub) sub.textContent = `${ev.dates} · ${ev.brand}`;
  refreshEventSelector();
  showToast(`Switched to: ${ev.name}`,'success');
}

function refreshEventSelector() {
  const sel = document.getElementById('event-selector-main');
  if (!sel) return;
  const events = loadEvents();
  const cur    = localStorage.getItem(LS_CUR_EVT) || events[0]?.id;
  sel.innerHTML = events.map(e =>
    `<option value="${e.id}" ${e.id===cur?'selected':''}>${e.name} (${e.dates||'—'})</option>`
  ).join('') + '<option value="__new__">+ Tambah Exhibition Baru</option>';
}
function handleEventChange(sel) {
  if (sel.value === '__new__') {
    openAddEventModal();
    sel.value = localStorage.getItem(LS_CUR_EVT) || '';
    return;
  }
  switchEventTo(sel.value);
}

/* ════════════════════════════════════
   AI GENERATION PANELS
   ════════════════════════════════════ */
function selectAIModel(btn) {
  btn.closest('.ai-model-row').querySelectorAll('.ai-model-btn')
    .forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function toggleAIPill(btn) {
  btn.classList.toggle('active');
}

const AI_RESPONSES = {
  descriptive: {
    title: '📊 Descriptive Analysis',
    body: `
      <h4>Ringkasan Performa 6 Hari (27 Apr – 2 Mei 2026)</h4>
      <ul>
        <li><strong>Total Walk-in:</strong> 2.847 — rata-rata 474/hari, peak Sabtu 722 (+96% vs hari pertama)</li>
        <li><strong>Total Transaksi:</strong> 524 — rata-rata 87/hari, tren naik konsisten</li>
        <li><strong>Total Revenue:</strong> Rp 1,43 Miliar — target Rp 1,2 M → <strong>117% tercapai</strong></li>
        <li><strong>Avg Conv. Rate:</strong> 18,4% — target 15% → <strong>+3,4 pp di atas target</strong></li>
        <li><strong>Avg VMD Score:</strong> 87/100 — konsisten di atas standar minimum 80</li>
        <li><strong>Online Reach:</strong> 1,69 jt (IG iBox) · 6,17 jt impressions · Engagement 0,7%</li>
      </ul>
      <h4>Tren Harian</h4>
      <ul>
        <li>Walk-in: 368 → 412 → 445 → 390 → 510 → 722 — momentum weekend sangat kuat</li>
        <li>Revenue single-day peak: Rp 390 jt (Sabtu 2/5) — 27% dari total revenue 1 hari</li>
        <li>Conv. Rate tren naik tiap hari: 15,8% → 20,4% — tim makin efektif closing</li>
      </ul>`
  },
  diagnostic: {
    title: '🔍 Diagnostic Analysis',
    body: `
      <h4>Mengapa Revenue Melampaui Target +17%?</h4>
      <ul>
        <li><strong>Weekend surge:</strong> Sab-Min berkontribusi ~39% total revenue — prime traffic BJX terbukti signifikan</li>
        <li><strong>Perfect attach rate:</strong> Accessories 1:1 per transaksi → meningkatkan avg basket size +Rp 200–350rb/trx</li>
        <li><strong>Conv. Rate learning curve:</strong> Tim makin warm tiap hari — teknik demo & closing membaik secara organik</li>
        <li><strong>iPhone 17 momentum:</strong> 286 unit (55% dari total trx) — launch momentum masih kuat</li>
      </ul>
      <h4>Root Cause Issues</h4>
      <ul>
        <li><strong>Cashier bottleneck Sabtu:</strong> Antrian >15 menit → est. 30–50 trx hilang = Rp 40–67 jt missed revenue</li>
        <li><strong>Day 1-2 traffic gap:</strong> KOL baru aktif H-1, efek awareness belum maksimal → 15–20% potensi traffik hilang</li>
        <li><strong>SPV cost over 1%:</strong> Weekend overtime tidak diantisipasi dalam budget planning awal</li>
        <li><strong>Kamis dip (390 walk-in):</strong> Mid-week fatigue + tidak ada promo trigger → butuh aktivasi tambahan</li>
      </ul>`
  },
  predictive: {
    title: '📈 Predictive Analysis',
    body: `
      <h4>Forecast Next Exhibition (venue profil serupa BJX)</h4>
      <ul>
        <li><strong>Projected Walk-in:</strong> 3.200–3.500 (asumsi: KOL aktif H-5 + 1 kasir tambahan di weekend)</li>
        <li><strong>Projected Revenue:</strong> Rp 1,6–1,8 M → +12–26% vs iBox BJX 2026</li>
        <li><strong>Projected Conv. Rate:</strong> 19–21% (tim lebih berpengalaman, less learning curve)</li>
        <li><strong>Est. Peak Day:</strong> Sabtu — proyeksi walk-in 850–950 jika KOL pre-aktivasi optimal</li>
      </ul>
      <h4>Optimal Timing & Venue</h4>
      <ul>
        <li>Best venue threshold: weekend traffic >20.000/hari (BJX = 19k+ → sudah di boundary)</li>
        <li>Best duration: 7 hari termasuk 2 weekend untuk maksimalkan prime days</li>
        <li>Target window: Juni–Juli 2026 (pre-back-to-school season) atau Sept–Okt (pre-year-end)</li>
        <li>Venue kandidat: Pondok Indah Mall 2, Summarecon Mall Serpong, Kota Kasablanka</li>
      </ul>`
  },
  prescriptive: {
    title: '💡 Prescriptive Recommendations',
    body: `
      <h4>Prioritas Aksi untuk Next Exhibition</h4>
      <ul>
        <li><strong>[HIGH] +1 kasir weekend:</strong> Est. +50 trx/weekend → +Rp 133 jt revenue — ROI >600x vs biaya kasir</li>
        <li><strong>[HIGH] Aktivasi KOL H-5:</strong> Tutup gap traffic hari 1-2 (~20%) — brief KOL 7 hari sebelum event</li>
        <li><strong>[MED] Pre-stock accessories H-3:</strong> Hindari rack kosong — 2x kejadian = ~Rp 20 jt missed</li>
        <li><strong>[MED] Anggaran overtime SPV:</strong> Tambah 5–8% buffer di budget SPV untuk weekend surge</li>
        <li><strong>[MED] Mid-week promo trigger:</strong> Flash sale Rabu atau live demo untuk atasi Kamis dip</li>
        <li><strong>[LOW] Queue management:</strong> Nomor antrian digital → kurangi drop-off saat peak hour</li>
      </ul>
      <h4>Quick Wins (bisa langsung diterapkan)</h4>
      <ul>
        <li>WhatsApp blast ke database pelanggan iBox Region 5 → H-3 sebelum event buka</li>
        <li>Dedicated iPad demo corner → potensi +15–20 unit extra dari 62 unit sekarang</li>
      </ul>`
  },
  sales: {
    title: '💰 Sales Analysis',
    body: `
      <h4>Sales per Kategori</h4>
      <ul>
        <li><strong>iPhone 17 Series:</strong> 286 unit (55% dari total trx) — konversi tinggi dari sesi demo langsung</li>
        <li><strong>Apple Watch:</strong> 142 unit (27%) — strong upsell dari iPhone buyers, attach rate baik</li>
        <li><strong>iPad Series:</strong> 62 unit (12%) — under-optimized, potensi lebih dengan dedicated corner</li>
        <li><strong>Accessories:</strong> 524 unit — perfect 1:1 attach rate, avg Rp 350rb/pcs</li>
      </ul>
      <h4>Metrik Efisiensi Sales</h4>
      <ul>
        <li>Avg Transaction Value: <strong>Rp 2.671.000</strong> — sehat untuk mid-premium segment</li>
        <li>Revenue per sqm: <strong>Rp 46,7 jt/sqm</strong> (booth 30 sqm) — excellent density</li>
        <li>Cost per transaksi: <strong>Rp 141.509</strong> — sangat efisien (< 6% dari avg trx value)</li>
        <li>Cost per walk-in: <strong>Rp 26.063</strong> — efisien, industri benchmark Rp 30–50rb</li>
      </ul>`
  },
  layanan: {
    title: '🛎 Layanan & Customer Experience',
    body: `
      <h4>Touchpoint Customer Journey</h4>
      <ul>
        <li><strong>Pre-event:</strong> KOL activation terlambat (H-1) → awareness gap hari 1-2 di BJX</li>
        <li><strong>On-site greeting:</strong> Promotor aktif, VMD score 87/100 — first impression baik</li>
        <li><strong>Demo experience:</strong> Conv. Rate naik tiap hari → demo quality membaik</li>
        <li><strong>Checkout:</strong> Bottleneck cashier Sabtu — titik drop-off tertinggi</li>
      </ul>
      <h4>Rekomendasi Customer Experience</h4>
      <ul>
        <li>Tambah 1–2 mobile POS untuk mengatasi antrian puncak</li>
        <li>Buat "fast lane" untuk pembelian accessories only → reduce queue friction</li>
        <li>Post-purchase: QR code untuk langsung follow IG iBox + WhatsApp after-sales</li>
        <li>Live demo schedule yang dipublikasikan → audience datang dengan intent lebih tinggi</li>
      </ul>`
  },
  operation: {
    title: '⚙️ Operational Analysis',
    body: `
      <h4>Operasional H-Day Assessment</h4>
      <ul>
        <li><strong>Booth setup:</strong> Tepat waktu, VMD score avg 87 — konsisten di atas 80 semua hari</li>
        <li><strong>Stok management:</strong> Accessories rack kosong 2x — supply chain ke venue butuh buffer H-3</li>
        <li><strong>Tim deployment:</strong> 3 SPV + 6 Promotor — cukup di weekday, kurang di weekend peak</li>
        <li><strong>Kasir:</strong> 1 kasir overloaded Sabtu-Minggu — SLA checkout >15 menit = customer loss</li>
      </ul>
      <h4>SOP Improvement untuk Next Event</h4>
      <ul>
        <li>Buat "Weekend War Room": brief harian 30 menit sebelum buka + restock checklist</li>
        <li>Standby SPV tambahan on-call untuk weekend → overtime budget disiapkan di awal</li>
        <li>Inventory threshold: reorder point accessories saat stok <30% → auto-alert ke PIC logistik</li>
        <li>Daily close report template: walk-in, trx, notes kendala → kirim ke Event Manager sebelum jam 21:00</li>
      </ul>`
  },
  people: {
    title: '👥 People & Team Analysis',
    body: `
      <h4>Tim Performance Overview</h4>
      <ul>
        <li><strong>3 SPV + 6 Promotor:</strong> Rasio memadai untuk weekday, tight di weekend peak (722 walk-in)</li>
        <li><strong>Conv. Rate growth:</strong> 15,8% → 20,4% dalam 6 hari → learning curve terlihat jelas</li>
        <li><strong>VMD consistency:</strong> Score 82–91 sepanjang event — tim disiplin pada standar planogram</li>
        <li><strong>KOL (3 akun):</strong> Aktif selama event, tapi terlambat brief → efek awareness hari 1-2 minimal</li>
      </ul>
      <h4>Rekomendasi People Development</h4>
      <ul>
        <li>Pre-event mock sales session H-3 → akselerasi closing skill dari hari pertama</li>
        <li>Incentive structure: bonus per transaksi hari 1-2 → close the slow-start gap</li>
        <li>Dedicated closing specialist di jam peak (12–15:00 dan 18–21:00)</li>
        <li>KOL brief wajib H-7 dengan content calendar → bukan H-1 lagi</li>
      </ul>`
  },
  financial: {
    title: '📑 Financial Analysis',
    body: `
      <h4>Budget vs Realisasi</h4>
      <ul>
        <li>Total budget: Rp 80 jt | Realisasi: <strong>Rp 74,2 jt (92,8% terserap)</strong></li>
        <li>Sisa: Rp 5,8 jt — carry-over atau realokasi ke aktivasi next event</li>
        <li>ROI Event: <strong>+75%</strong> (Revenue Rp 1,43 M vs Total Cost Rp 74,2 jt)</li>
        <li>Gross Profit: <strong>Rp 1,356 M</strong> setelah dikurangi biaya event</li>
      </ul>
      <h4>Budget Flags</h4>
      <ul>
        <li>⚠️ SPV & Promotor: 101% (+Rp 200rb) — overtime weekend tidak dianggarkan</li>
        <li>✓ Media Online: 95% — efisien, sisa Rp 700rb</li>
        <li>✓ Logistik: 50% — sisa Rp 1 jt → alokasikan ke next event</li>
        <li>✓ VMD: 78% — Rp 3,3 jt saved dari budget</li>
      </ul>
      <h4>Rekomendasi Alokasi Budget Next Event</h4>
      <ul>
        <li>Naikkan SPV +5–8% → antisipasi overtime weekend</li>
        <li>Kurangi logistik 25%, redirect ke KOL activation H-5 (est. +15% day-1 traffic)</li>
        <li>Target ROI next event: >85% dengan proyeksi revenue Rp 1,7 M</li>
      </ul>`
  },
};

function generateAnalysis(provider) {
  const resultEl = document.getElementById(`${provider}-result`);
  if (!resultEl) return;

  // Get active pills
  const activePills = [...document.querySelectorAll(`#${provider}-types .ai-pill.active`)]
    .map(p => p.textContent.trim().toLowerCase().replace(/[^a-z]/g,''));

  const customPrompt = document.getElementById(`${provider}-custom-prompt`)?.value?.trim();
  const modelBtn = document.querySelector(`#${provider}-model-row .ai-model-btn.active`);
  const model    = modelBtn?.dataset.model || (provider === 'claude' ? 'sonnet' : 'v3');
  const modelLabels = {
    haiku:'Claude Haiku', sonnet:'Claude Sonnet', auto:'Claude Auto',
    v3:'DeepSeek V3 Chat', r1:'DeepSeek R1 Reasoner',
  };
  const modelLabel = modelLabels[model] || model;

  // Dots color class
  const dotsClass = provider === 'deepseek' ? 'ai-loading-dots ds' : 'ai-loading-dots';

  // Show loading
  resultEl.innerHTML = `
    <div class="ai-result-loading">
      <div class="${dotsClass}"><span></span><span></span><span></span></div>
      <div>${provider === 'claude' ? '✦ Claude' : '◈ DeepSeek'} sedang menganalisis data ERA-EXHIBITION...</div>
    </div>`;

  // Pick content — first active pill wins, fallback to descriptive
  const key = activePills.find(k => AI_RESPONSES[k]) || 'descriptive';
  const { title, body } = AI_RESPONSES[key];

  const delay = provider === 'deepseek' ? 2400 : 1700;
  setTimeout(() => {
    const badgeClass = provider === 'claude' ? 'mb-green' : 'mb-blue';
    resultEl.innerHTML = `
      <div class="ai-result-content">
        <div style="display:flex;justify-content:space-between;align-items:center;
                    margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--border)">
          <div style="font-size:12.5px;font-weight:700;color:var(--text)">${title}</div>
          <span class="metric-badge ${badgeClass}" style="font-size:10px;flex-shrink:0">${modelLabel}</span>
        </div>
        ${customPrompt ? `<div style="font-size:11.5px;color:var(--text-3);margin-bottom:10px;
          padding:8px 10px;background:var(--bg);border-radius:6px;font-style:italic">
          ✎ "${customPrompt}"</div>` : ''}
        ${body}
        <div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--border);
                    font-size:10.5px;color:var(--text-3);display:flex;justify-content:space-between">
          <span>Generated ${new Date().toLocaleTimeString('id-ID')}</span>
          <span>ERA-EXHIBITION · iBox BJX 2026 · 6 hari data</span>
        </div>
      </div>`;
  }, delay);
}

/* ════════════════════════════════════
   RESIZE
   ════════════════════════════════════ */
let _resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => { if (window.initCharts) window.initCharts(); }, 220);
});

/* ════════════════════════════════════
   INIT
   ════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Theme
  applyTheme(localStorage.getItem(LS_THEME) || 'light');

  // Tab restore
  const savedTab = sessionStorage.getItem(LS_TAB) || 'overview';
  switchTab(savedTab);

  // Charts + bars
  setTimeout(() => {
    if (window.initCharts) window.initCharts();
    animateBars();
    if (savedTab === 'overview') runCounters();
  }, 120);

  // Live calc listeners
  ['inp-walkin','inp-trx','inp-revenue','inp-mall'].forEach(id =>
    document.getElementById(id)?.addEventListener('input', updateLiveCalc));

  // Saved data
  refreshDailyTable();
  updateRunningTotals();

  // Budget
  document.querySelectorAll('.budget-actual-input')
    .forEach(inp => inp.addEventListener('input', recomputeBudget));
  initBudget();

  // Brand tabs
  document.querySelectorAll('.brand-tab')
    .forEach(btn => btn.addEventListener('click', () => switchBrand(btn)));

  // Event selector
  refreshEventSelector();
  document.getElementById('event-selector-main')
    ?.addEventListener('change', e => handleEventChange(e.target));

  // Event cards
  refreshEventCards();

  // Alerts
  refreshAlerts();

  // Modal: close on overlay click
  document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', e => {
      if (e.target === ov) ov.classList.remove('open');
    });
  });

  // Keyboard: Esc closes modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape')
      document.querySelectorAll('.modal-overlay.open')
        .forEach(ov => ov.classList.remove('open'));
  });
});
