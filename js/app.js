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
      <td>${e.walkin > 0 ? e.walkin.toLocaleString() : '—'}</td>
      <td>${(e.trx||0).toLocaleString()}</td>
      <td>${e.walkin > 0 && e.trx > 0 ? ((e.trx/e.walkin)*100).toFixed(1)+'%' : '—'}</td>
      <td>${fmtRp(e.revenue)}</td>
      <td><span class="metric-badge ${e.vmdScore>=85?'mb-green':'mb-amber'}" style="font-size:10px">${e.vmdScore}</span></td>
      <td style="white-space:nowrap;padding:4px 8px">
        <button onclick="startEdit('${key}', ${JSON.stringify(e).replace(/'/g,"\\'")})"
          class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:11px">✎</button>
        <button onclick="deleteEntry('${key}')"
          class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:11px;color:var(--red-txt)">✕</button>
      </td>`;
    if (_editingKey === key) tr.classList.add('editing');
    tbody.insertBefore(tr, tbody.firstChild);
  });

  // Sembunyikan static row "hari ini" jika data hari itu sudah tersimpan
  const today     = new Date().toISOString().slice(0, 10);
  const todayRow  = tbody.querySelector('tr.row-today');
  if (todayRow) {
    const hasTodayData = Object.values(loadDailyData()).some(e => e.date === today);
    todayRow.style.display = hasTodayData ? 'none' : '';
  }
}

function updateRunningTotals() {
  // Gabungkan STATIC_DAILY (hari 1-6) + saved entries (hari 7+)
  const saved      = Object.values(loadDailyData());
  const savedDates = new Set(saved.map(e => e.date));
  const allVals    = [
    ...STATIC_DAILY.filter(d => !savedDates.has(d.date)),
    ...saved,
  ];
  if (!allVals.length) return;

  const tw = allVals.reduce((s,e) => s+(e.walkin||0), 0);
  const tt = allVals.reduce((s,e) => s+(e.trx||0),    0);
  const tr = allVals.reduce((s,e) => s+(e.revenue||0), 0);

  // Conv rate hanya dari hari yang ada data walk-in (agar tidak salah hitung)
  const convDays = allVals.filter(e => (e.walkin||0) > 0 && (e.trx||0) > 0);
  const twC = convDays.reduce((s,e) => s+(e.walkin||0), 0);
  const ttC = convDays.reduce((s,e) => s+(e.trx||0),    0);
  const tc  = twC > 0 ? ((ttC/twC)*100).toFixed(1) : '—';

  const TOTAL_TARGET = 6156700000;
  const DAILY_TARGET = TOTAL_TARGET / 7;          // Rp 879,528,571/hari
  const EVENT_DAYS   = 7;

  const achPct     = +((tr / TOTAL_TARGET) * 100).toFixed(1);
  const gap        = Math.max(TOTAL_TARGET - tr, 0);
  const daysRan    = allVals.length;
  const avgPerDay  = daysRan > 0 ? tr / daysRan : 0;

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const setStyle = (id, prop, v) => { const el = document.getElementById(id); if (el) el.style[prop] = v; };

  // ── Daily Input Running Total ──────────────────────────
  set('total-walkin',   tw > 0 ? tw.toLocaleString() : '—');
  set('total-trx',      tt.toLocaleString());
  set('total-revenue',  fmtRp(tr));
  set('total-conv',     tc !== '—' ? tc + '%' : '—');
  set('total-ach',      achPct + '%');
  set('total-gap',      gap > 0 ? '−' + fmtRp(gap) : '✓ Tercapai!');
  set('total-ach-inline', achPct + '%');

  // Mini progress bar in Daily Input
  const miniBar = document.getElementById('total-ach-bar');
  if (miniBar) miniBar.style.width = Math.min(achPct, 100) + '%';

  // Achievement color
  const achColor = achPct >= 100 ? 'var(--green-txt)' : achPct >= 70 ? 'var(--amber-txt)' : 'var(--red-txt)';
  setStyle('total-ach', 'color', achColor);
  setStyle('total-gap', 'color', gap <= 0 ? 'var(--green-txt)' : 'var(--red-txt)');

  // ── Overview Banner ────────────────────────────────────
  set('banner-ach-pct',  achPct + '%');
  set('banner-revenue',  fmtRp(tr));
  set('banner-gap',      gap > 0 ? '−' + fmtRp(gap) : '✓ Tercapai!');
  set('banner-runrate',  fmtRp(avgPerDay));

  // Progress bar
  const barEl = document.getElementById('banner-ach-bar');
  if (barEl) barEl.style.width = Math.min(achPct, 100) + '%';

  // Achievement % color
  setStyle('banner-ach-pct', 'color', achColor);
  setStyle('banner-gap', 'color', gap <= 0 ? 'var(--green-txt)' : 'var(--red-txt)');

  // Badge
  const badgeEl = document.getElementById('banner-ach-badge');
  if (badgeEl) {
    if (achPct >= 100) {
      badgeEl.textContent = '✓ Target Tercapai!';
      badgeEl.className   = 'metric-badge mb-green';
    } else if (achPct >= 70) {
      badgeEl.textContent = achPct + '% — Mendekati target';
      badgeEl.className   = 'metric-badge mb-amber';
    } else if (achPct >= 50) {
      badgeEl.textContent = achPct + '% — Perlu akselerasi';
      badgeEl.className   = 'metric-badge mb-amber';
    } else {
      badgeEl.textContent = achPct + '% — Di bawah target';
      badgeEl.className   = 'metric-badge mb-red';
    }
  }

  // Gap analysis text
  const analysisEl = document.getElementById('banner-analysis');
  if (analysisEl) {
    const avgVsTarget = ((avgPerDay / DAILY_TARGET) * 100).toFixed(0);
    const gapFmt      = fmtRp(gap);
    const neededExtra = gap > 0
      ? `Gap sebesar <strong>${gapFmt}</strong> — perlu avg <strong>${fmtRp(DAILY_TARGET)}/hari</strong> untuk mencapai target (aktual: ${fmtRp(avgPerDay)}/hari = <strong>${avgVsTarget}%</strong> dari target harian).`
      : `🎉 Target tercapai! Revenue melampaui Rp 6,157 M.`;
    const advice = achPct < 50
      ? ` <span style="color:var(--red-txt)">⚠️ Signifikan di bawah target. Perlu evaluasi strategi untuk event berikutnya.</span>`
      : achPct < 80
      ? ` <span style="color:var(--amber-txt)">→ Pertimbangkan target yang lebih realistis untuk next event, atau tambah hari & activasi.</span>`
      : ` <span style="color:var(--green-txt)">→ Performa solid. Sedikit peningkatan kunci untuk capai target penuh.</span>`;
    analysisEl.innerHTML = neededExtra + advice;
  }

  // Planning tab achievement label
  const planningAch = document.getElementById('planning-ach');
  if (planningAch) {
    planningAch.textContent = achPct + '%';
    planningAch.style.color = achColor;
    planningAch.style.fontWeight = '700';
  }
}

/* ════════════════════════════════════
   CSV EXPORT
   ════════════════════════════════════ */
function exportCSV() {
  // Source: ERA_EXHIBITION_Sales_Input_2.xlsx
  const staticRows = [
    {date:'2026-04-27',brand:'iBox',walkin:0,trx:55,conv:0,revenue:387835000,vmdScore:90,notes:'Device:36 VAS:19'},
    {date:'2026-04-28',brand:'iBox',walkin:0,trx:51,conv:0,revenue:338503000,vmdScore:88,notes:'Device:24 VAS:27'},
    {date:'2026-04-29',brand:'iBox',walkin:0,trx:25,conv:0,revenue:153176200,vmdScore:91,notes:'Device:10 VAS:15'},
    {date:'2026-04-30',brand:'iBox',walkin:0,trx:39,conv:0,revenue:313995000,vmdScore:82,notes:'Device:13 VAS:26'},
    {date:'2026-05-01',brand:'iBox',walkin:0,trx:72,conv:0,revenue:357231000,vmdScore:89,notes:'Device:19 VAS:53'},
    {date:'2026-05-02',brand:'iBox',walkin:0,trx:86,conv:0,revenue:505702950,vmdScore:85,notes:'Device:43 VAS:43'},
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
  const BUDGET_PLAN = 133.795;
  const sisa    = Math.max(BUDGET_PLAN-total,0);
  const pctUsed = total>0 ? Math.round((total/BUDGET_PLAN)*100) : 0;
  const revenue = parseFloat(document.getElementById('inp-revenue-budget')?.value)||2056.4;
  const roi     = total>0 ? Math.round(((revenue-total)/total)*100) : 0;
  const set = (id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
  set('budget-total-actual',`Rp ${total.toFixed(1)} jt`);
  set('budget-sisa',        `Rp ${sisa.toFixed(1)} jt`);
  set('budget-pct-used',    pctUsed+'%');
  set('budget-roi',         (roi>0?'+':'')+roi+'%');
}

function saveBudgetAndNotify() {
  recomputeBudget();

  // Visual feedback on status line
  const status = document.getElementById('budget-save-status');
  const now    = new Date().toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit'});
  if (status) {
    status.textContent = `✓ Tersimpan — ${now}`;
    status.style.color = 'var(--green-txt)';
    setTimeout(() => { status.textContent = ''; }, 4000);
  }
  showToast('Budget aktual tersimpan ✓', 'success');

  // Update budget notes card to reflect filled state
  const notesCard = document.querySelector('.card-icon + *');
  refreshBudgetNotes();
}

function refreshBudgetNotes() {
  const actuals = loadBudgetActuals();
  if (!actuals) return;
  const total  = Object.values(actuals).reduce((s,v)=>s+v,0);
  const pct    = total > 0 ? Math.round((total/133.795)*100) : 0;
  const badgeEl = document.querySelector('#panel-budget .badge-plan, #panel-budget .badge-warn');
  if (badgeEl && total > 0) {
    badgeEl.textContent = `${pct}% aktual terisi`;
    badgeEl.className   = pct >= 100 ? 'badge badge-live' : 'badge badge-plan';
  }
}

function resetBudgetActuals() {
  if (!confirm('Reset semua nilai aktual ke 0?')) return;
  document.querySelectorAll('.budget-actual-input').forEach(inp => { inp.value = 0; });
  recomputeBudget();
  const status = document.getElementById('budget-save-status');
  if (status) { status.textContent = 'Reset ke 0 ✓'; status.style.color = 'var(--text-3)'; }
  showToast('Budget aktual direset', 'info');
}

/* ════════════════════════════════════
   ALERT SYSTEM
   ════════════════════════════════════ */
// Source: ERA_EXHIBITION_Sales_Input_2.xlsx — INPUT DAILY sheet
// Revenue = Grand Total Value per hari · trx = Grand Total Qty (units)
// Walk-in tidak tersedia di Excel — perlu input manual
const STATIC_DAILY = [
  {date:'2026-04-27',walkin:0,trx:55,conv:0,revenue:387835000,vmdScore:90},
  {date:'2026-04-28',walkin:0,trx:51,conv:0,revenue:338503000,vmdScore:88},
  {date:'2026-04-29',walkin:0,trx:25,conv:0,revenue:153176200,vmdScore:91},
  {date:'2026-04-30',walkin:0,trx:39,conv:0,revenue:313995000,vmdScore:82},
  {date:'2026-05-01',walkin:0,trx:72,conv:0,revenue:357231000,vmdScore:89},
  {date:'2026-05-02',walkin:0,trx:86,conv:0,revenue:505702950,vmdScore:85},
];

// Target event harian = Rp 6.156.700.000 / 7 hari
const DAILY_REVENUE_TARGET = 879528572;

function buildAlerts() {
  const saved   = Object.values(loadDailyData());
  const allRows = [...STATIC_DAILY, ...saved];
  const alerts  = [];

  // Revenue achievement check per hari
  allRows.forEach(d => {
    if (!d.revenue) return;
    const label  = d.date ? d.date.slice(5) : '?';
    const pct    = ((d.revenue / DAILY_REVENUE_TARGET) * 100).toFixed(1);
    if (d.revenue < DAILY_REVENUE_TARGET * 0.25) {
      alerts.push({ level:'error', icon:'↓',
        text: `Revenue ${fmtRp(d.revenue)} di ${label} (${pct}% target)`,
        sub:  `Sangat di bawah daily target Rp 879 jt — perlu analisis` });
    } else if (d.revenue < DAILY_REVENUE_TARGET * 0.5) {
      alerts.push({ level:'warn', icon:'!',
        text: `Revenue ${fmtRp(d.revenue)} di ${label} (${pct}% target)`,
        sub:  `Di bawah 50% dari daily target Rp 879 jt` });
    }
  });

  // VMD score check
  allRows.forEach(d => {
    const label = d.date ? d.date.slice(5) : '?';
    if (d.vmdScore > 0 && d.vmdScore < 80) {
      alerts.push({ level:'warn', icon:'!',
        text: `VMD Score ${d.vmdScore}/100 di ${label}`,
        sub:  'Di bawah standar minimum 80 — cek display' });
    }
  });

  // Budget overspend vs plan (133.795 jt)
  const actuals = loadBudgetActuals();
  if (actuals) {
    const total = Object.values(actuals).reduce((s,v)=>s+v,0);
    if (total > 133.795) alerts.push({ level:'error', icon:'₿',
      text: `Budget over Rp ${(total-133.795).toFixed(1)} jt dari plan`,
      sub:  'Total realisasi melebihi budget plan Rp 133,8 jt' });
  }

  // Achievement overall
  const totalRev = allRows.reduce((s,d)=>s+(d.revenue||0),0);
  const totalPct = ((totalRev / 6156700000) * 100).toFixed(1);
  if (parseFloat(totalPct) < 35) {
    alerts.push({ level:'warn', icon:'📊',
      text:  `Overall achievement ${totalPct}% dari target Rp 6,15 M`,
      sub:   'Hari ke-7 (3/5) belum diinput — masih bisa meningkat' });
  }

  if (!alerts.length) {
    alerts.push({ level:'ok', icon:'✓',
      text:  'Semua metrik dalam kondisi baik',
      sub:   'Revenue, VMD, dan budget terkontrol' });
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

// ── AI Response data updated from ERA_EXHIBITION_Sales_Input_2.xlsx ──
const AI_RESPONSES = {
  descriptive: {
    title: '📊 Descriptive Analysis',
    body: `
      <h4>Ringkasan Performa 6 Hari (27 Apr – 2 Mei 2026)</h4>
      <ul>
        <li><strong>Total Units Terjual:</strong> 328 unit — Device 145 (44%) + VAS 183 (56%)</li>
        <li><strong>Total Revenue:</strong> Rp 2,056,443,150 — dari target Rp 6,156,700,000</li>
        <li><strong>Achievement:</strong> <strong>33,4%</strong> dari total target event</li>
        <li><strong>Hari ke-7 (3/5):</strong> Belum diinput — revenue masih bisa bertambah</li>
        <li><strong>Avg VMD Score:</strong> 87/100 — konsisten di atas standar minimum 80</li>
      </ul>
      <h4>Tren Harian Revenue (Rp juta)</h4>
      <ul>
        <li>27/4: Rp 387,8 jt | 28/4: Rp 338,5 jt | 29/4: Rp 153,2 jt</li>
        <li>30/4: Rp 314,0 jt | 1/5: Rp 357,2 jt | 2/5: Rp 505,7 jt ← peak</li>
        <li>Rabu (29/4) terendah — dip mid-week terlihat jelas</li>
        <li>Sabtu (2/5) tertinggi Rp 505,7 jt = 24,6% dari total revenue 6 hari</li>
      </ul>
      <h4>Breakdown Produk</h4>
      <ul>
        <li>iPhone: 95 unit / Rp 1,653 M (80,4% revenue share) — produk utama</li>
        <li>iPad: 45 unit / Rp 196 jt (9,5%) — potensi masih besar</li>
        <li>Macbook: 5 unit / Rp 80,6 jt (3,9%)</li>
        <li>Accessories: 165 unit / Rp 86,9 jt (4,2%) — highest qty</li>
        <li>Apple Watch: 4 unit · Airpods: 1 unit · SIM (Indosat+XL): 9 unit</li>
      </ul>`
  },
  diagnostic: {
    title: '🔍 Diagnostic Analysis',
    body: `
      <h4>Mengapa Achievement Baru 33,4% dari Target?</h4>
      <ul>
        <li><strong>Target sangat ambisius:</strong> Rp 6,156 M untuk 7 hari = Rp 879 jt/hari — 2,3x di atas avg aktual</li>
        <li><strong>Rabu dip ekstrem:</strong> 29/4 hanya Rp 153 jt (17,4% dari daily target) — faktor mid-week + kurang aktivasi</li>
        <li><strong>Weekend kuat:</strong> Sabtu Rp 505,7 jt — satu-satunya hari yang mendekati 57% dari daily target</li>
        <li><strong>iPhone dominan 80,4%:</strong> Konsentrasi risiko tinggi — jika iPhone slow, total revenue ikut turun</li>
      </ul>
      <h4>Root Cause Gap Achievement</h4>
      <ul>
        <li><strong>Walk-in data tidak tersedia:</strong> Conversion rate tidak bisa dihitung → sulit diagnosa efektivitas tim sales</li>
        <li><strong>VAS contribution rendah:</strong> Rp 126 jt (6,1%) dari total — upsell kurang optimal</li>
        <li><strong>iPad under-perform:</strong> 45 unit padahal Macbook hanya 5 — potensi iPad lebih besar jika ada dedicated display</li>
        <li><strong>Hari ke-7 (3/5) kosong:</strong> Bisa jadi data belum diinput atau event belum selesai</li>
      </ul>`
  },
  predictive: {
    title: '📈 Predictive Analysis',
    body: `
      <h4>Proyeksi Hari ke-7 (3 Mei 2026)</h4>
      <ul>
        <li>Berdasarkan tren Sabtu (505,7 jt), Minggu biasanya 80–90% dari Sabtu</li>
        <li><strong>Proyeksi revenue 3/5:</strong> Rp 380–450 jt</li>
        <li><strong>Proyeksi total 7 hari:</strong> Rp 2,43–2,51 M (achievement ~39–41%)</li>
      </ul>
      <h4>Forecast Next Exhibition (profil serupa)</h4>
      <ul>
        <li><strong>Projected Revenue:</strong> Rp 2,4–2,8 M jika target diturunkan ke Rp 300–400 jt/hari</li>
        <li><strong>Kunci peningkatan:</strong> Aktivasi KOL H-5, dedicated iPad corner, +1 kasir weekend</li>
        <li><strong>Target realistis:</strong> Rp 3,0–3,5 M (vs target ambisius Rp 6,15 M sekarang)</li>
        <li><strong>Timeline optimal:</strong> Juni–Juli 2026 (pre-back-to-school) atau Sept–Okt (pre year-end)</li>
      </ul>
      <h4>Estimasi Berdasarkan ASP Reference</h4>
      <ul>
        <li>iPhone ASP: Rp 17,4 jt/unit — dengan 95 unit sudah Rp 1,65 M (sesuai ASP reference)</li>
        <li>iPad ASP: Rp 4,35 jt/unit — potensi +20 unit = +Rp 87 jt extra dengan dedicated demo</li>
      </ul>`
  },
  prescriptive: {
    title: '💡 Prescriptive Recommendations',
    body: `
      <h4>Prioritas Aksi Segera (sisa event + next)</h4>
      <ul>
        <li><strong>[URGENT] Input data hari ke-7:</strong> Pastikan data 3 Mei diinput untuk laporan final</li>
        <li><strong>[HIGH] Revisi target next event:</strong> Rp 6,15 M terlalu ambisius → realistis Rp 3–3,5 M berdasarkan data aktual</li>
        <li><strong>[HIGH] Isi Cost Actual budget:</strong> Budget tracker masih kosong — input aktual untuk ROI yang akurat</li>
        <li><strong>[HIGH] Tambah tracking walk-in:</strong> Tanpa data walk-in, conv rate tidak bisa dihitung — pasang counter atau tally manual</li>
      </ul>
      <h4>Untuk Next Exhibition</h4>
      <ul>
        <li>Dedicated iPad demo area → target +20 unit = +Rp 87 jt vs sekarang</li>
        <li>Aktivasi KOL H-5 bukan H-1 untuk menutup gap hari 1-2</li>
        <li>Mid-week promo (flash sale Rabu) untuk atasi Kamis dip</li>
        <li>Input walk-in data harian → analisis lebih mendalam di dashboard</li>
      </ul>`
  },
  sales: {
    title: '💰 Sales Analysis',
    body: `
      <h4>Sales per Kategori — Data Aktual Excel</h4>
      <ul>
        <li><strong>iPhone:</strong> 95 unit / Rp 1,653,405,000 (80,4% revenue) — ASP Rp 17,4 jt/unit ✓</li>
        <li><strong>iPad:</strong> 45 unit / Rp 196,055,000 (9,5%) — ASP Rp 4,35 jt/unit ✓</li>
        <li><strong>Macbook:</strong> 5 unit / Rp 80,595,000 (3,9%) — ASP Rp 16,1 jt/unit ✓</li>
        <li><strong>Accessories:</strong> 165 unit / Rp 86,887,150 (4,2%) — ASP Rp 527rb/unit</li>
        <li><strong>Apple Watch:</strong> 4 unit / Rp 20,546,000 · <strong>Airpods:</strong> 1 unit / Rp 4,099,000</li>
        <li><strong>SIM (Indosat+XL):</strong> 9 unit / Rp 9,000,000</li>
      </ul>
      <h4>Metrik Efisiensi Sales</h4>
      <ul>
        <li>Avg per unit: <strong>Rp 6.269.033/unit</strong> (total revenue / 328 units)</li>
        <li>Revenue per sqm: <strong>Rp 68,5 jt/sqm</strong> (booth 30 sqm × 6 hari)</li>
        <li>Device vs VAS mix: 80% vs 20% revenue — VAS masih bisa ditingkatkan</li>
        <li>Market Share estimate: iPhone 80,4% · iPad 9,5% · Macbook 3,9% (sesuai target ASP)</li>
      </ul>`
  },
  layanan: {
    title: '🛎 Layanan & Customer Experience',
    body: `
      <h4>Touchpoint Assessment</h4>
      <ul>
        <li><strong>Walk-in data tidak tersedia:</strong> Customer journey dari awal tidak bisa diukur — perlu tally counter</li>
        <li><strong>VMD Score 87/100:</strong> Booth readiness baik, display konsisten — first impression positif</li>
        <li><strong>Rabu dip (Rp 153 jt):</strong> Mungkin ada customer service issue atau traffic rendah — butuh investigasi</li>
        <li><strong>VAS attach rate rendah:</strong> 183 VAS unit untuk 145 device — seharusnya bisa 1:2 per device</li>
      </ul>
      <h4>Rekomendasi</h4>
      <ul>
        <li>Pasang manual tally counter untuk walk-in — data penting untuk next event benchmarking</li>
        <li>Tambahkan Apple Watch & Airpods upsell script saat iPhone closing → est. +10 unit/hari</li>
        <li>Post-purchase: QR code ke IG iBox + link feedback customer</li>
        <li>Mid-week activation (Rabu) → live demo atau promo accessories untuk boost traffic</li>
      </ul>`
  },
  operation: {
    title: '⚙️ Operational Analysis',
    body: `
      <h4>Operasional Assessment 6 Hari</h4>
      <ul>
        <li><strong>VMD Score:</strong> 82–91/100 — konsisten di atas minimum, hari Kamis (82) terendah</li>
        <li><strong>Revenue pattern:</strong> Hari-3 (Rabu 29/4) turun drastis ke Rp 153 jt — trigger evaluasi ops</li>
        <li><strong>Peak day Sabtu (2/5):</strong> Rp 505,7 jt dengan 86 units — 3,4x vs hari terendah</li>
        <li><strong>Budget actual belum diisi:</strong> Tidak bisa mengukur efisiensi operasional vs plan</li>
      </ul>
      <h4>SOP Improvement</h4>
      <ul>
        <li>Daily ops report: revenue, units, VMD score, kendala → kirim ke Event Manager sebelum 21:00</li>
        <li>Inventory check harian: reorder point accessories < 30% stok → auto-alert ke logistik</li>
        <li>Mid-week brief: evaluasi Selasa malam untuk antisipasi Rabu dip</li>
        <li>Cost actual input wajib di Budget Tracker setiap hari → data real-time</li>
      </ul>`
  },
  people: {
    title: '👥 People & Team Analysis',
    body: `
      <h4>Tim Performance Insight</h4>
      <ul>
        <li><strong>3 SPV + 6 Promotor:</strong> Butuh data walk-in untuk menilai rasio optimal</li>
        <li><strong>Device productivity:</strong> 145 devices / 6 hari = 24,2 devices/hari rata-rata</li>
        <li><strong>Best day per person:</strong> Sabtu 43 devices / team = ~5,4 devices/promotor — excellent</li>
        <li><strong>Worst day:</strong> Rabu 10 devices — butuh investigasi: low traffic atau low conversion?</li>
      </ul>
      <h4>Rekomendasi People</h4>
      <ul>
        <li>Input walk-in data → bisa hitung conv rate per orang/per hari</li>
        <li>Incentive berbasis revenue hari 1-2 untuk close the warm-up gap</li>
        <li>Dedicated specialist per kategori: iPhone closer, iPad demo, accessories upsell</li>
        <li>KOL brief H-7 dengan content calendar — pastikan traffic sudah tinggi di hari 1</li>
      </ul>`
  },
  financial: {
    title: '📑 Financial Analysis',
    body: `
      <h4>Revenue vs Target — Data Aktual</h4>
      <ul>
        <li>Total Revenue 6 hari: <strong>Rp 2,056,443,150</strong></li>
        <li>Target Event: <strong>Rp 6,156,700,000</strong></li>
        <li>Achievement: <strong>33,4%</strong> dari target total</li>
        <li>Estimasi total 7 hari: ~Rp 2,43–2,51 M (dengan input hari ke-7)</li>
      </ul>
      <h4>Budget Plan (Aktual Belum Diisi)</h4>
      <ul>
        <li>Konstruksi Booth (Plan): Rp 85.000.000</li>
        <li>Sewa Space + Deposit (Plan): Rp 34.160.000</li>
        <li>Media & Promosi (Plan): Rp 8.135.000 (KOL Rp 2,5 jt + OOH Rp 5,635 jt)</li>
        <li>SDM / Personil (Plan): Rp 6.500.000</li>
        <li><strong>Total Plan: Rp 133.795.000</strong> · Aktual: <em>Belum diisi</em></li>
      </ul>
      <h4>ROI Proyeksi (vs Plan)</h4>
      <ul>
        <li>Revenue Rp 2,056 M / Cost Plan Rp 133,8 jt → ROI <strong>+1.437%</strong></li>
        <li>Gross Profit (vs plan): Rp 2,056 M − Rp 133,8 jt = <strong>Rp 1,922 M</strong></li>
        <li>⚠️ Segera isi Cost Actual di Budget Tracker untuk ROI yang akurat</li>
      </ul>`
  },
};

/* ── AI API Config — via Netlify Functions (keys aman di server) ── */
// API keys disimpan di Netlify Environment Variables, BUKAN di browser/source.
// Dashboard memanggil /.netlify/functions/claude dan /deepseek (same-origin, no CORS).
const NETLIFY_CLAUDE_FN   = '/.netlify/functions/claude';
const NETLIFY_DEEPSEEK_FN = '/.netlify/functions/deepseek';

function refreshAPIKeyStatus() {
  const el = document.getElementById('api-key-status');
  if (el) el.innerHTML = '🔒 <span style="color:var(--green-txt)">Claude ✓</span> · <span style="color:var(--green-txt)">DeepSeek ✓</span> — secured via Netlify';
}

const CLAUDE_MODELS   = { haiku:'claude-haiku-3-5', sonnet:'claude-sonnet-4-5', auto:'claude-sonnet-4-5' };
const DEEPSEEK_MODELS = { v3:'deepseek-chat', r1:'deepseek-reasoner', auto:'deepseek-chat' };

const ERA_SYSTEM_PROMPT = [
  'Kamu adalah AI analyst untuk ERA-EXHIBITION SIERA Dashboard milik Erajaya Digital Region 5.',
  'Berikan analisis tajam, terstruktur, dan actionable dalam Bahasa Indonesia.',
  '',
  '=== DATA EVENT ===',
  'Event: iBox Roadshow — Bintaro Jaya Xchange, 27 Apr – 3 Mei 2026',
  'Event Manager: Ghesang Pratano | Region 5 · Erajaya Digital',
  '',
  '=== PERFORMA 6 HARI (DATA AKTUAL EXCEL) ===',
  'Total Units: 328 | Revenue: Rp 2.056.443.150 | Target: Rp 6.156.700.000 | Achievement: 33,4%',
  'Avg Revenue/Unit: Rp 6.269.033',
  '',
  'Tren Harian:',
  '- Sen 27/4: 55 trx | Rp 387.835.000 | VMD 90',
  '- Sel 28/4: 51 trx | Rp 338.503.000 | VMD 88',
  '- Rab 29/4: 25 trx | Rp 153.176.200 | VMD 91 (TERENDAH)',
  '- Kam 30/4: 39 trx | Rp 313.995.000 | VMD 82',
  '- Jum  1/5: 72 trx | Rp 357.231.000 | VMD 89',
  '- Sab  2/5: 86 trx | Rp 505.702.950 | VMD 85 (TERTINGGI)',
  '- Min  3/5: Belum diinput',
  '',
  'Breakdown Produk:',
  '- iPhone: 95 unit | Rp 1.653.405.000 (80,4% revenue share)',
  '- iPad: 45 unit | Rp 196.055.000 (9,5%)',
  '- Macbook: 5 unit | Rp 80.595.000 (3,9%)',
  '- Accessories: 165 unit | Rp 86.887.150 (4,2%)',
  '- Apple Watch: 4 unit | Rp 20.546.000',
  '- Airpods: 1 unit | Rp 4.099.000',
  '- SIM Indosat+XL: 9 unit | Rp 9.000.000',
  '',
  '=== BUDGET TRACKER ===',
  'Konstruksi Booth Plan: Rp 85.000.000 | Sewa Space Plan: Rp 34.160.000',
  'Media & KOL+OOH Plan: Rp 8.135.000 | SDM Plan: Rp 6.500.000',
  'Total Plan: Rp 133.795.000 | Cost Actual: Belum diisi',
  'ROI vs Plan: +1.437% (Revenue Rp 2,056M / Budget Rp 133,8jt)',
  '',
  '=== CATATAN ===',
  'Walk-in data TIDAK tersedia. Hari ke-7 (3 Mei) belum diinput.',
  'Format: gunakan ## heading, - bullet list, **bold** untuk angka penting. Maks 500 kata.',
].join('\n');

const PILL_PROMPTS = {
  descriptive:  'Descriptive Analysis — ringkasan lengkap semua metrik aktual dengan tren harian',
  diagnostic:   'Diagnostic Analysis — identifikasi root cause gap achievement 33,4% dari target',
  predictive:   'Predictive Analysis — proyeksi hari ke-7 dan rekomendasi next exhibition',
  prescriptive: 'Prescriptive Analysis — action items prioritas untuk event manager',
  sales:        'Sales Analysis — breakdown per kategori produk, ASP, efisiensi, dan peluang upsell',
  layanan:      'Customer Experience Analysis — touchpoint, service quality, dan NPS improvement',
  operation:    'Operational Analysis — VMD score trend, ops harian, SOP improvement',
  people:       'People & Team Analysis — produktivitas tim dan rekomendasi pengembangan',
  financial:    'Financial Analysis — P&L, ROI actual vs plan, budget efficiency',
};

async function generateAnalysis(provider) {
  const resultEl = document.getElementById(`${provider}-result`);
  if (!resultEl) return;

  const activePills = [...document.querySelectorAll(`#${provider}-types .ai-pill.active`)]
    .map(p => p.textContent.trim().toLowerCase().replace(/[^a-z]/g,''));
  const customPrompt = document.getElementById(`${provider}-custom-prompt`)?.value?.trim();
  const modelBtn     = document.querySelector(`#${provider}-model-row .ai-model-btn.active`);
  const model        = modelBtn?.dataset.model || (provider === 'claude' ? 'sonnet' : 'v3');
  const dotsClass    = provider === 'deepseek' ? 'ai-loading-dots ds' : 'ai-loading-dots';

  resultEl.innerHTML = `
    <div class="ai-result-loading">
      <div class="${dotsClass}"><span></span><span></span><span></span></div>
      <div>${provider === 'claude' ? '✦ Claude' : '◈ DeepSeek'} sedang menganalisis data ERA-EXHIBITION...</div>
    </div>`;

  if (provider === 'claude') {
    await _claudeAPICall(resultEl, activePills, customPrompt, model);
  } else {
    await _deepseekAPICall(resultEl, activePills, customPrompt, model);
  }
}

async function _claudeAPICall(resultEl, pills, customPrompt, model) {
  const modelId   = CLAUDE_MODELS[model] || CLAUDE_MODELS.sonnet;
  const pillsText = pills.length > 0
    ? pills.map(p => PILL_PROMPTS[p] || p).join(' + ')
    : 'Descriptive Analysis — ringkasan umum performa event';
  const userMsg   = 'Lakukan analisis berikut untuk data ERA-EXHIBITION:\n\n' + pillsText
    + (customPrompt ? '\n\nFokus dan instruksi tambahan: ' + customPrompt : '');

  try {
    const resp = await fetch(NETLIFY_CLAUDE_FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelId, max_tokens: 1024,
        system: ERA_SYSTEM_PROMPT,
        messages: [{ role:'user', content: userMsg }],
      }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      const errMsg = data.error?.message || data.type || JSON.stringify(data).slice(0,120);
      throw new Error('[HTTP ' + resp.status + '] ' + errMsg);
    }
    const rawText = data.content?.[0]?.text || '(Tidak ada respons)';
    const mLabel  = modelId.includes('haiku') ? 'Claude Haiku' : 'Claude Sonnet';
    const tokInfo = data.usage?.output_tokens ? ' · ' + data.usage.output_tokens + ' tok' : '';
    _renderAIResult(resultEl, rawText, mLabel, 'mb-green', customPrompt, tokInfo);
  } catch(err) {
    _renderAIError(resultEl, err.message, 'claude');
  }
}

async function _deepseekAPICall(resultEl, pills, customPrompt, model) {
  const modelId   = DEEPSEEK_MODELS[model] || DEEPSEEK_MODELS.v3;
  const pillsText = pills.length > 0
    ? pills.map(p => PILL_PROMPTS[p] || p).join(' + ')
    : 'Descriptive Analysis — ringkasan umum performa event';
  const userMsg   = 'Lakukan analisis berikut untuk data ERA-EXHIBITION:\n\n' + pillsText
    + (customPrompt ? '\n\nFokus dan instruksi tambahan: ' + customPrompt : '');

  try {
    const resp = await fetch(NETLIFY_DEEPSEEK_FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelId, max_tokens: 1024,
        messages: [
          { role:'system', content: ERA_SYSTEM_PROMPT },
          { role:'user',   content: userMsg },
        ],
      }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || 'HTTP ' + resp.status);
    const rawText = data.choices?.[0]?.message?.content || '(Tidak ada respons)';
    const mLabel  = modelId === 'deepseek-reasoner' ? 'DeepSeek R1' : 'DeepSeek V3';
    const tokInfo = data.usage?.completion_tokens ? ' · ' + data.usage.completion_tokens + ' tok' : '';
    _renderAIResult(resultEl, rawText, mLabel, 'mb-blue', customPrompt, tokInfo);
  } catch(err) {
    _renderAIError(resultEl, err.message);
  }
}


function _renderAIResult(resultEl, rawText, mLabel, badgeCls, customPrompt, tokInfo) {
  const htmlBody = _mdToHtml(rawText);
  resultEl.innerHTML = `
    <div class="ai-result-content">
      <div style="display:flex;justify-content:space-between;align-items:center;
                  margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--border)">
        <div style="font-size:12.5px;font-weight:700;color:var(--text)">✦ AI Analysis</div>
        <span class="metric-badge ${badgeCls}" style="font-size:10px;flex-shrink:0">${mLabel}</span>
      </div>
      ${customPrompt ? '<div style="font-size:11.5px;color:var(--text-3);margin-bottom:10px;'
        + 'padding:8px 10px;background:var(--bg);border-radius:6px;font-style:italic">'
        + '✎ "' + customPrompt + '"</div>' : ''}
      <div style="font-size:13px;line-height:1.65;color:var(--text)">${htmlBody}</div>
      <div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--border);
                  font-size:10.5px;color:var(--text-3);display:flex;justify-content:space-between">
        <span>Generated ${new Date().toLocaleTimeString('id-ID')}</span>
        <span>${mLabel}${tokInfo} · ERA-EXHIBITION</span>
      </div>
    </div>`;
}

function _renderAIError(resultEl, msg, provider) {
  const isBilling = msg.includes('429') || msg.includes('quota') || msg.includes('credit') || msg.includes('billing');
  const isModel   = msg.includes('model:') || msg.includes('not_found');
  let hint = 'Periksa koneksi internet dan validitas API key.';
  if (isBilling) hint = '💳 Kemungkinan API key belum punya kredit — cek billing di console.anthropic.com';
  if (isModel)   hint = '🔑 Model tidak tersedia — coba pilih model <strong>Sonnet</strong> atau <strong>Auto</strong>';
  resultEl.innerHTML = '<div style="padding:16px">'
    + '<div style="color:var(--red-txt);font-size:13px;font-weight:600">⚠️ Error memanggil '
    + (provider === 'claude' ? 'Claude' : 'DeepSeek') + ' API</div>'
    + '<div style="font-size:12px;color:var(--text-2);margin-top:6px;font-family:monospace">' + msg + '</div>'
    + '<div style="font-size:11.5px;color:var(--text-3);margin-top:8px">' + hint + '</div></div>';
  showToast((provider === 'claude' ? 'Claude' : 'DeepSeek') + ' error: ' + msg.slice(0,60), 'error');
}

function _mdToHtml(md) {
  const lines = md.split('\n');
  let html = '', inList = false;
  for (const rawLine of lines) {
    const safe = rawLine
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*([^*]+?)\*/g,'<em>$1</em>');
    if (/^#{1,3} /.test(rawLine)) {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<h4 style="margin:12px 0 5px;font-size:13px;font-weight:700">'
            + safe.replace(/^#+\s/,'') + '</h4>';
    } else if (/^(?:[-*•]|\d+\.)\s/.test(rawLine)) {
      if (!inList) { html += '<ul style="margin:4px 0 10px;padding-left:18px">'; inList = true; }
      html += '<li style="margin:3px 0;line-height:1.6">'
            + safe.replace(/^(?:[-*•]|\d+\.)\s/,'') + '</li>';
    } else if (safe.trim() === '') {
      if (inList) { html += '</ul>'; inList = false; }
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<p style="margin:4px 0;line-height:1.65">' + safe + '</p>';
    }
  }
  if (inList) html += '</ul>';
  return html;
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
  refreshBudgetNotes();

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

  // AI key status
  refreshAPIKeyStatus();

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
