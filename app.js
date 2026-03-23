'use strict';
/* ═══════════════════════════════════════════
   ToolKit Pro — app.js
   Core: nav, theme, stats, history, tool page
   builder, helpers, file handling, error system
═══════════════════════════════════════════ */

// ── THEME ────────────────────────────────────────────
const savedTheme = localStorage.getItem('tkp-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('tkp-theme', next);
  const sun = document.getElementById('ico-sun');
  const moon = document.getElementById('ico-moon');
  if (sun) sun.style.display = next === 'dark' ? '' : 'none';
  if (moon) moon.style.display = next === 'dark' ? 'none' : '';
}

// ── STATS ────────────────────────────────────────────
let _st = (() => { try { return JSON.parse(localStorage.getItem('tkp-st')) || { p:0, f:0 }; } catch { return { p:0, f:0 }; } })();
function incST(files) {
  _st.p++; _st.f += files;
  localStorage.setItem('tkp-st', JSON.stringify(_st));
  const sp = document.getElementById('stat-p'); if (sp) sp.textContent = _st.p;
  const sf = document.getElementById('stat-f'); if (sf) sf.textContent = _st.f;
  const hp = document.getElementById('h-proc'); if (hp) hp.textContent = _st.p;
}
function renderStats() {
  ['stat-p','h-proc'].forEach(id => { const e = document.getElementById(id); if (e) e.textContent = _st.p; });
  const sf = document.getElementById('stat-f'); if (sf) sf.textContent = _st.f;
}

// ── OUTPUT FOLDER ─────────────────────────────────────
let _dirHandle = null;
async function pickFolder() {
  if (!window.showDirectoryPicker) { toast('Your browser does not support folder access. Files will download normally.', 'bad'); return; }
  try {
    _dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    const lbl = _dirHandle.name;
    ['nfolder-lbl','hero-folder-lbl'].forEach(id => { const e = document.getElementById(id); if (e) e.textContent = '📁 ' + lbl; });
    ['nfolder-btn','hero-folder-btn'].forEach(id => { const e = document.getElementById(id); if (e) e.classList.add('set'); });
    toast('Output folder set: ' + lbl, 'ok');
  } catch(e) { if (e.name !== 'AbortError') toast('Could not set folder.', 'bad'); }
}
async function saveFile(blob, filename) {
  if (_dirHandle) {
    try {
      const fh = await _dirHandle.getFileHandle(filename, { create: true });
      const w  = await fh.createWritable();
      await w.write(blob); await w.close();
      toast('Saved: ' + filename, 'ok');
      addHist(filename, blob); incST(1); return;
    } catch(e) { console.warn('Folder save failed, falling back', e); }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 6000);
  toast('Downloaded: ' + filename, 'ok');
  addHist(filename, blob); incST(1);
}

// ── HISTORY ──────────────────────────────────────────
let hist = [];
function addHist(name, blob) {
  hist.unshift({ id: Date.now(), name, size: blob.size, blob, time: new Date().toLocaleTimeString() });
  if (hist.length > 100) hist.pop();
  const b = document.getElementById('hist-badge');
  if (b) { b.textContent = hist.length; b.style.display = ''; }
}
function clearHist() { hist = []; const b = document.getElementById('hist-badge'); if (b) b.style.display = 'none'; renderHist(); }
function renderHist() {
  const c = document.getElementById('hlist'); if (!c) return;
  if (!hist.length) {
    c.innerHTML = `<div class="hempty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
      <h3>No history yet</h3><p>Process any file and your outputs will appear here for re-download.</p>
    </div>`; return;
  }
  const ico = n => {
    if (n.endsWith('.pdf'))  return `<div class="hico cpdf">${IC.pdf}</div>`;
    if (n.endsWith('.zip'))  return `<div class="hico cutil">${IC.dl}</div>`;
    if (n.endsWith('.txt') || n.endsWith('.json') || n.endsWith('.csv') || n.endsWith('.md')) return `<div class="hico ctext">${IC.text}</div>`;
    if (n.match(/\.(jpg|jpeg|png|webp|gif)$/i)) return `<div class="hico cimg">${IC.img}</div>`;
    return `<div class="hico cutil">${IC.dl}</div>`;
  };
  c.innerHTML = `<div class="hlist">${hist.map(h => `
    <div class="hitem">
      ${ico(h.name)}
      <div class="hinfo">
        <div class="hname">${h.name}</div>
        <div class="hmeta"><span>${fmtSz(h.size)}</span><span>${h.time}</span></div>
      </div>
      <div class="hacts">
        <button class="hdl" onclick="redownload(${h.id})">Download</button>
        <button class="hrm" onclick="removeHist(${h.id})" title="Remove">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>`).join('')}</div>`;
}
function redownload(id) {
  const h = hist.find(x => x.id === id); if (!h) return;
  const url = URL.createObjectURL(h.blob);
  const a = document.createElement('a'); a.href = url; a.download = h.name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
function removeHist(id) { hist = hist.filter(x => x.id !== id); renderHist(); const b = document.getElementById('hist-badge'); if (b) { b.textContent = hist.length; if (!hist.length) b.style.display = 'none'; } }

// ── NAVIGATION ───────────────────────────────────────
function goHome() { showV('home-view'); setTab('tab-home'); renderStats(); }
function goHistory() { showV('hist-view'); setTab('tab-hist'); renderHist(); }
function showV(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function setTab(id) {
  document.querySelectorAll('.ntab').forEach(t => t.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}
function openTool(id) {
  curTool = id; toolFiles = []; _rBM = null; _cBM = null; _cDS = 1; _cropLock = null;
  showV('tool-view');
  document.querySelectorAll('.ntab').forEach(t => t.classList.remove('active'));
  buildPage(id);
}
function filterCat(cat) {
  goHome();
  setTimeout(() => {
    const el = document.getElementById('cat-' + cat);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
}

// ── TOAST ────────────────────────────────────────────
let _tTimer;
function toast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  const ico = document.getElementById('t-ico');
  const tmsg = document.getElementById('t-msg');
  if (ico) ico.innerHTML = type === 'ok'
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1fccaa" stroke-width="2.5"><polyline points="20,6 9,17 4,12"/></svg>`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff5c5c" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  if (tmsg) tmsg.textContent = msg;
  if (t) { t.className = 'show ' + type; clearTimeout(_tTimer); _tTimer = setTimeout(() => t.className = '', 4200); }
}

// ── SEARCH ───────────────────────────────────────────
function handleSearch(q) {
  q = (q || '').trim().toLowerCase();
  const xbtn = document.getElementById('search-x');
  const banner = document.getElementById('search-banner');
  if (xbtn) xbtn.style.display = q ? 'flex' : 'none';
  if (!q) {
    document.querySelectorAll('.tc').forEach(c => c.classList.remove('hidden'));
    document.querySelectorAll('.cat-block').forEach(b => b.style.display = '');
    if (banner) banner.style.display = 'none';
    return;
  }
  let total = 0;
  document.querySelectorAll('.tc').forEach(c => {
    const match = (c.dataset.label||'').includes(q) || (c.dataset.desc||'').includes(q) || (c.dataset.cat||'').includes(q);
    c.classList.toggle('hidden', !match);
    if (match) total++;
  });
  document.querySelectorAll('.cat-block').forEach(b => {
    b.style.display = b.querySelectorAll('.tc:not(.hidden)').length ? '' : 'none';
  });
  if (banner) {
    banner.style.display = 'flex';
    const rt = document.getElementById('sbanner-txt');
    if (rt) rt.textContent = `Found ${total} tool${total !== 1 ? 's' : ''} for "${q}"`;
  }
}
function clearSearch() {
  const inp = document.getElementById('search-inp');
  if (inp) inp.value = '';
  handleSearch('');
}

// ── HELPERS ──────────────────────────────────────────
function fmtSz(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
  return (b/1048576).toFixed(2) + ' MB';
}
function bn(n) { return n.replace(/\.[^/.]+$/, ''); }
function readBuf(f) { return new Promise((r,j) => { const fr = new FileReader(); fr.onload = e => r(e.target.result); fr.onerror = j; fr.readAsArrayBuffer(f); }); }
function readText(f) { return new Promise((r,j) => { const fr = new FileReader(); fr.onload = e => r(e.target.result); fr.onerror = j; fr.readAsText(f); }); }
function gv(id) { const e = document.getElementById(id); return e ? e.value : ''; }
function gn(id) { return parseFloat(gv(id)) || 0; }
function gk(id) { const e = document.getElementById(id); return e ? e.checked : false; }
function escHtml(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── LIBRARY LOADER ────────────────────────────────────
const _libs = {};
async function need(lib) {
  if (_libs[lib]) return;
  const urls = {
    pdflib:  'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
    pdfjs:   'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
    jszip:   'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
    qr:      'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js',
  };
  await new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = urls[lib];
    s.onload = () => {
      if (lib === 'pdfjs') { pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'; }
      _libs[lib] = true; res();
    };
    s.onerror = () => rej(new Error(`Failed to load ${lib}. Check your internet connection.`));
    document.head.appendChild(s);
  });
}

// ── TOOL STATE ────────────────────────────────────────
let curTool = null, toolFiles = [], _rBM = null, _cBM = null, _cDS = 1, _cropLock = null;

// ── TOOL PAGE BUILDER ─────────────────────────────────
// Note: CAT is defined in tools.js which loads first

function buildPage(id) {
  const t = TOOLS[id]; if (!t) return;
  const c = CAT[t.cat] || CAT.util;
  const sv = IC[t.ic] || IC.pdf;
  const catLbl = { pdf:'PDF Tools', img:'Image Tools', text:'Text & Office', sec:'Security & Privacy', media:'Media', dev:'Developer', util:'Utilities' }[t.cat] || 'Tools';
  const needsFile = t.accept !== null && !NO_FILE.has(id);

  // Sidebar
  const sbi = document.getElementById('sb-info');
  if (sbi) sbi.innerHTML = `
    <div class="sb-tic ${c.cls}" style="background:${c.bg};color:${c.fg}">${sv}</div>
    <h3>${t.label}</h3><p>${t.desc}</p>`;
  const sbt = document.getElementById('sb-tips');
  if (sbt) sbt.innerHTML = `<div class="sbt-title">Tips</div>` +
    (t.tips||[]).map(tip => `<div class="tip-r"><div class="tip-dot"></div>${tip}</div>`).join('');

  // Options
  let opts = '';
  if (t.opts === '__resize__') opts = buildResizeOpts();
  else if (t.opts && t.opts.length)
    opts = `<div class="opts-card"><div class="opts-hd">${IC.settings}<h4>Options</h4></div><div class="opts-body">${t.opts.map(buildORow).join('')}</div></div>`;

  // Warn banners
  let warn = '';
  if (id === 'pdf-to-csv') warn = `<div class="warn-banner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span>Works best on simple text-based tables. Complex layouts and scanned PDFs may not extract correctly — always verify output.</span></div>`;
  if (id === 'unlock-pdf') warn = `<div class="warn-banner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>You must know the current password. Truly encrypted PDFs cannot be bypassed.</span></div>`;

  // Special UIs per tool
  let sp = '';
  if (id === 'compress-image') sp = `<div class="compare-wrap" id="before-after" style="display:none"></div>`;
  if (id === 'crop-image') sp = `
    <div class="crop-card" id="crop-card">
      <div class="crop-hd">
        <h4>Crop Editor</h4>
        <span class="crop-hint">Click &amp; drag to select crop area</span>
      </div>
      <div class="crop-cv-wrap"><canvas id="crop-cv"></canvas><canvas id="crop-ov"></canvas></div>
      <div class="crop-coords">
        <div class="cf"><label>X</label><input type="number" id="cx" value="0" oninput="drawCOv()"></div>
        <div class="cf"><label>Y</label><input type="number" id="cy" value="0" oninput="drawCOv()"></div>
        <div class="cf"><label>Width</label><input type="number" id="cw" value="100" oninput="drawCOv()"></div>
        <div class="cf"><label>Height</label><input type="number" id="ch" value="100" oninput="drawCOv()"></div>
      </div>
    </div>`;
  if (id === 'resize-image') sp = `
    <div class="prev-card" id="prev-card">
      <div class="prev-hd"><h4>Live Preview</h4><span class="prev-dims" id="prev-dims">Upload image to preview</span></div>
      <div class="prev-body"><canvas id="prev-cv" style="max-width:100%;max-height:400px;display:block;margin:0 auto"></canvas></div>
    </div>`;
  if (id === 'qr-generator')   sp = `<div class="qr-out" id="qr-out"><canvas id="qr-cv" style="max-width:260px;margin:0 auto;display:block"></canvas></div>`;
  if (id === 'barcode-gen')    sp = `<div class="bc-out" id="bc-out"><canvas id="bc-cv" style="max-width:100%;margin:0 auto;display:block"></canvas></div>`;
  if (id === 'colour-palette') sp = `<div id="palette-out" style="display:none;flex-wrap:wrap;gap:14px;margin-bottom:14px"></div>`;
  if (id === 'font-preview')   sp = `<div class="font-prev" id="font-prev"><p style="color:var(--t3);font-size:13px;text-align:center;padding:28px 0">Upload a font file (.ttf .otf .woff .woff2) to see a live preview</p></div>`;
  if (id === 'video-thumbnail') sp = `<video id="vid-el" controls></video>`;
  if (id === 'html-preview') sp = `
    <div class="html-prev show" id="html-prev">
      <div class="html-prev-hd">
        <h4>Live Preview</h4>
        <div class="html-prev-btns">
          <button class="hpbtn active" id="btn-dt" onclick="setHV('desktop')">Desktop</button>
          <button class="hpbtn" id="btn-mb" onclick="setHV('mobile')">Mobile (375px)</button>
        </div>
      </div>
      <iframe id="html-iframe" sandbox="allow-scripts allow-same-origin"></iframe>
    </div>`;

  // Diff — side by side
  if (id === 'diff-checker') sp = `
    <div class="diff-layout">
      <div class="diff-col"><label>Original Text</label><textarea class="ota" id="opt-text1" placeholder="Paste original text…" style="min-height:190px">The quick brown fox\njumps over the lazy dog\nHello world</textarea></div>
      <div class="diff-col"><label>New / Modified Text</label><textarea class="ota" id="opt-text2" placeholder="Paste new text…" style="min-height:190px">The quick brown fox\nleaps over the lazy cat\nHello world!\nNew line added</textarea></div>
    </div>
    <div class="tout-wrap" id="tout-wrap"><div class="tout diff" id="tout" style="min-height:80px"></div><button class="copy-btn" onclick="copyOut()">${IC.copy} Copy Result</button></div>`;

  // Regex — quick pattern chips + live output
  if (id === 'regex-tester') sp = `
    <div class="opts-card" style="margin-bottom:14px">
      <div class="opts-hd">${IC.settings}<h4>Quick Patterns</h4></div>
      <div style="padding:12px 18px;display:flex;flex-wrap:wrap;gap:7px">
        ${[['Email','[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'],['URL','https?://[^\\s/$.?#].[^\\s]*'],['Phone','[\\+]?[(]?[0-9]{3}[)]?[-\\s\\.]?[0-9]{3}[-\\s\\.]?[0-9]{4,6}'],['IP Address','\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b'],['Date (YYYY-MM-DD)','\\d{4}-\\d{2}-\\d{2}'],['Hex Color','#[0-9A-Fa-f]{3,6}'],['ZIP Code','\\b\\d{5}(?:-\\d{4})?\\b'],['Number','\\d+\\.?\\d*']].map(([lbl,pat])=>`<button class="rpat-btn" onclick="insertPattern('${pat.replace(/'/g,"\\'")}')">${lbl}</button>`).join('')}
      </div>
    </div>
    <div class="tout-wrap" id="tout-wrap"><div class="tout" id="tout" style="min-height:80px"></div><div class="regex-stats" id="regex-stats"></div><button class="copy-btn" onclick="copyOut()">${IC.copy} Copy Result</button></div>`;

  // Text output tools
  const textOutTools = new Set(['text-case','lorem-ipsum','find-replace','json-formatter','xml-formatter','csv-json','url-tool','text-encrypt','timestamp','uuid-gen','password-gen']);
  if (textOutTools.has(id))
    sp += `<div class="tout-wrap" id="tout-wrap"><div class="tout" id="tout"></div><button class="copy-btn" onclick="copyOut()">${IC.copy} Copy to Clipboard</button></div>`;

  // Dropzone
  let dz = '';
  if (t.accept !== null) {
    const fmtMap = {
      '.pdf':['PDF'],'image/*':['JPG','PNG','WEBP','GIF','BMP'],
      'image/jpeg,image/png,image/webp':['JPG','PNG','WEBP'],
      'image/png,image/webp,image/gif,image/bmp':['PNG','WEBP','GIF','BMP'],
      'image/jpeg,image/jpg':['JPG'],
      '.txt,.md,.csv,.json,.xml,.html':['TXT','CSV','JSON','HTML'],
      '.txt,.md,.pdf,.csv':['TXT','PDF','CSV'],'.json,.txt':['JSON','TXT'],
      '.xml,.svg,.txt':['XML','SVG'],'.csv,.json,.txt':['CSV','JSON'],
      '.csv':['CSV'],'.html,.htm':['HTML'],'.svg':['SVG'],
      '.ttf,.otf,.woff,.woff2':['TTF','OTF','WOFF','WOFF2'],
      'video/*':['MP4','WEBM','MOV'],
      '.pdf,image/jpeg,image/png':['PDF','JPG','PNG'],
      '*/*':['Any file'],
    };
    const fmts = fmtMap[t.accept] || ['File'];
    dz = `<label class="dropzone" id="dz" for="fi">
      <input type="file" id="fi" accept="${t.accept}" ${t.multi?'multiple':''} onchange="onPick(this.files)" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%">
      <div class="dz-in">
        <div class="dz-ico" style="color:${c.fg}">${sv}</div>
        <h3>${t.multi ? 'Drop files here or click to browse' : 'Drop file here or click to browse'}</h3>
        <p>${t.multi ? 'You can upload multiple files at once' : 'Select a single file to process'}</p>
        <div class="dz-tags">${fmts.map(f=>`<span class="dz-tag">${f}</span>`).join('')}</div>
      </div>
    </label>`;
  }

  document.getElementById('tmain').innerHTML = `
    <div class="tmain-inner">
      <button class="mback" onclick="goHome()">
        <div class="mback-ic"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15,18 9,12 15,6"/></svg></div>
        Back to All Tools
      </button>
      <div class="bc">
        <span onclick="goHome()">All Tools</span>
        <span class="sep">/</span>
        <span onclick="filterCat('${t.cat}')">${catLbl}</span>
        <span class="sep">/</span>
        <span class="cur">${t.label}</span>
      </div>
      <div class="tool-hd">
        <h1><div class="th-ic ${c.cls}" style="background:${c.bg};color:${c.fg}">${sv}</div>${t.label}</h1>
        <p>${t.desc}</p>
      </div>
      ${warn}
      ${dz}
      <div class="flist" id="flist"></div>
      ${opts}
      ${sp}
      <div class="act-area">
        <button class="act-btn" id="act-btn" onclick="runTool()" ${needsFile?'disabled':''}>${IC.bolt} ${t.label}</button>
        <button class="reset-btn" onclick="resetTool()">Reset</button>
      </div>
      <div class="prog" id="prog">
        <div class="prog-top"><span class="prog-lbl" id="prog-lbl">Processing…</span><span class="prog-pct" id="prog-pct">0%</span></div>
        <div class="prog-track"><div class="prog-bar" id="prog-bar"></div></div>
      </div>
      <div class="result" id="result">
        <div class="result-hd">${IC.check}<h4>Complete!</h4></div>
        <div class="result-bd"><div class="rstats" id="rstats"></div><div class="rfiles" id="rfiles"></div></div>
      </div>
      <div class="err-card" id="err">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div><div id="err-msg"></div><div id="err-hint"></div></div>
      </div>
    </div>`;

  // Wire events
  const dzel = document.getElementById('dz');
  if (dzel) {
    dzel.addEventListener('dragover', e => { e.preventDefault(); dzel.classList.add('over'); });
    dzel.addEventListener('dragleave', () => dzel.classList.remove('over'));
    dzel.addEventListener('drop', e => { e.preventDefault(); dzel.classList.remove('over'); onPick(e.dataTransfer.files); });
  }
  // Post-build hooks
  if (id === 'resize-image') initRW();
  if (id === 'timestamp') setTimeout(() => {
    const ms = document.getElementById('opt-mode');
    if (ms) ms.addEventListener('change', tsUpdateInput);
    tsUpdateInput();
  }, 60);
  if (id === 'regex-tester') setTimeout(() => {
    const flagSel = document.getElementById('opt-flags'); if (flagSel) flagSel.addEventListener('change', liveRegex);
    liveRegex();
  }, 60);
}

// ── OPT ROW BUILDER ──────────────────────────────────
function buildORow(o) {
  if (o.type === '__ta__') {
    const live = curTool === 'regex-tester' ? ' oninput="liveRegex()"' : '';
    return `<div class="orow ocol"><div class="olbl">${o.label}${o.sub?`<div class="osub">${o.sub}</div>`:''}</div><textarea class="ota" id="opt-${o.id}"${live}>${o.def||''}</textarea></div>`;
  }
  let ctrl = '';
  if (o.type === 'select')
    ctrl = `<select class="osel" id="opt-${o.id}">${o.choices.map(ch=>`<option${ch===o.def?' selected':''}>${ch}</option>`).join('')}</select>`;
  else if (o.type === 'range')
    ctrl = `<div class="rng"><input type="range" min="${o.min}" max="${o.max}" step="${o.step}" value="${o.def}" id="opt-${o.id}" oninput="document.getElementById('rv-${o.id}').textContent=this.value+'${o.unit||''}';if(curTool==='resize-image')updatePrev()"><span class="rv" id="rv-${o.id}">${o.def}${o.unit||''}</span></div>`;
  else if (o.type === 'datetime')
    ctrl = `<input type="datetime-local" class="oinp" id="opt-${o.id}" style="width:240px" oninput="tsDateSync()">`;
  else if (o.type === 'number' || o.type === 'text') {
    const live = (curTool === 'regex-tester' && o.id === 'pattern') ? ' oninput="liveRegex()"' : (curTool === 'resize-image' ? ' oninput="updatePrev()"' : '');
    ctrl = `<input type="${o.type==='number'?'number':'text'}" class="oinp" id="opt-${o.id}" value="${o.def||''}" placeholder="${o.def||''}"${live}>`;
  }
  else if (o.type === 'password')
    ctrl = `<input type="password" class="oinp" id="opt-${o.id}" placeholder="Enter password">`;
  else if (o.type === 'toggle')
    ctrl = `<label class="tog"><input type="checkbox" id="opt-${o.id}"${o.def?' checked':''}><span class="tog-tr"></span></label>`;
  return `<div class="orow"><div class="olbl">${o.label}${o.sub?`<div class="osub">${o.sub}</div>`:''}</div><div class="oc">${ctrl}</div></div>`;
}

// ── REGEX LIVE ────────────────────────────────────────
function insertPattern(pat) {
  const inp = document.getElementById('opt-pattern'); if (!inp) return;
  inp.value = pat; liveRegex();
}
function liveRegex() {
  const pattern = gv('opt-pattern') || '';
  const flagsRaw = (gv('opt-flags') || 'gi').split(' ')[0];
  const testText = gv('opt-testText') || '';
  const tout = document.getElementById('tout'); const wrap = document.getElementById('tout-wrap');
  const statsEl = document.getElementById('regex-stats');
  const subEl = document.querySelector('#opt-pattern')?.closest('.orow')?.querySelector('.osub');
  if (!pattern) { if (wrap) wrap.classList.add('show'); if (tout) { tout.className = 'tout'; tout.innerHTML = `<span style="color:var(--t3)">Enter a regex pattern above to see matches highlighted here.</span>`; } return; }
  try {
    const g = new RegExp(pattern, flagsRaw.includes('g') ? flagsRaw : flagsRaw + 'g');
    const matches = []; let m;
    while ((m = g.exec(testText)) !== null && matches.length < 1000) {
      matches.push({ index: m.index, len: m[0].length, match: m[0] });
      if (m[0].length === 0) { g.lastIndex++; }
      if (!flagsRaw.includes('g')) break;
    }
    let html = ''; let last = 0;
    matches.forEach(({ index, len, match }) => {
      html += escHtml(testText.slice(last, index));
      html += `<mark style="background:rgba(124,111,255,.35);border-radius:3px;padding:0 2px;font-weight:700;color:var(--t1)">${escHtml(match)}</mark>`;
      last = index + len;
    });
    html += escHtml(testText.slice(last));
    if (wrap) wrap.classList.add('show');
    if (tout) { tout.className = 'tout'; tout.innerHTML = html || `<span style="color:var(--t3)">(empty text)</span>`; }
    if (statsEl) statsEl.innerHTML = matches.length > 0
      ? `<span class="regex-stat" style="color:var(--gr)">✓ ${matches.length} match${matches.length!==1?'es':''}</span>`
      : `<span class="regex-stat" style="color:var(--rd)">✗ No matches</span>`;
    if (subEl) subEl.textContent = matches.length > 0 ? `✓ ${matches.length} match${matches.length!==1?'es':''} found` : 'No matches';
  } catch(e) {
    if (subEl) subEl.textContent = '✗ Invalid regex: ' + e.message;
  }
}

// ── TIMESTAMP HELPERS ─────────────────────────────────
function tsDateSync() {
  const dt = document.getElementById('opt-dateInput');
  const inp = document.getElementById('opt-inputVal');
  if (dt && inp && dt.value) inp.value = dt.value;
}
function tsUpdateInput() {
  const mode = gv('opt-mode');
  const dtRow = document.getElementById('opt-dateInput')?.closest?.('.orow');
  const valRow = document.getElementById('opt-inputVal')?.closest?.('.orow');
  if (dtRow) dtRow.style.display = mode === 'Date → Unix' ? '' : 'none';
  if (valRow) valRow.style.display = mode === 'Date → Unix' ? 'none' : '';
}

// ── FILE HANDLING ────────────────────────────────────
function onPick(files) {
  if (!files || !files.length) return;
  const t = TOOLS[curTool];
  if (t && t.multi) toolFiles = [...toolFiles, ...Array.from(files)];
  else toolFiles = [files[0]];
  renderFL();
  const btn = document.getElementById('act-btn');
  if (btn) btn.disabled = false;
  clearErr();
  if (curTool === 'crop-image')     loadCI(toolFiles[0]);
  if (curTool === 'resize-image')   loadRI(toolFiles[0]);
  if (curTool === 'image-info')     runImgInfo(toolFiles[0]);
  if (curTool === 'html-preview')   loadHP(toolFiles[0]);
  if (curTool === 'font-preview')   loadFP(toolFiles[0]);
  if (curTool === 'video-thumbnail') loadVid(toolFiles[0]);
}
async function renderFL() {
  const el = document.getElementById('flist'); if (!el) return;
  const items = await Promise.all(toolFiles.map(async (f, i) => {
    let thumb = '';
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      thumb = `<div class="fi-th"><img src="${url}" onload="URL.revokeObjectURL(this.src)"></div>`;
    } else {
      const ico = f.name.endsWith('.pdf') ? IC.pdf : f.name.endsWith('.svg') ? IC.svgopt : f.type.startsWith('video/') ? IC.video : IC.text;
      const col = f.name.endsWith('.pdf') ? 'cpdf' : f.type.startsWith('video/') ? 'cmedia' : 'cutil';
      thumb = `<div class="fi-th ${col}" style="font-size:14px">${ico}</div>`;
    }
    return `<div class="fi" id="fi-${i}">
      ${thumb}
      <div class="fi-info"><div class="fi-name">${f.name}</div><div class="fi-sz">${fmtSz(f.size)}</div></div>
      <button class="fi-rm" onclick="removeFile(${i})" title="Remove">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>`;
  }));
  el.innerHTML = items.join('');
}
function removeFile(i) {
  toolFiles.splice(i, 1); renderFL();
  if (!toolFiles.length) { const btn = document.getElementById('act-btn'); if (btn && TOOLS[curTool]?.accept !== null && !NO_FILE.has(curTool)) btn.disabled = true; }
}

// ── RUN / RESET ──────────────────────────────────────
// Map uses STRING names - functions are resolved at call time (after all scripts load)
const TOOL_FNS = {
  // PDF
  'compress-pdf':'doCPdf','merge-pdf':'doMPdf','split-pdf':'doSPdf','rotate-pdf':'doRotPdf',
  'pdf-to-jpg':'doPtoJ','jpg-to-pdf':'doJtoP','unlock-pdf':'doUPdf','protect-pdf':'doPtPdf',
  'add-page-numbers':'doPN','stamp-pdf':'doStamp','pdf-info':'doPInfo','delete-pdf-pages':'doDelP',
  'duplicate-pdf-pages':'doDupP','reorder-pdf':'doReOrd','pdf-header-footer':'doPHF',
  'flatten-pdf':'doFlat','pdf-thumbnail':'doPThumb','pdf-to-csv':'doPCsv','pdf-bookmarks':'doPBM',
  // Image
  'compress-image':'doCImg','resize-image':'doRImg','crop-image':'doCropImg',
  'convert-to-jpg':'doC2J','convert-from-jpg':'doCFJ','grayscale':'doGray',
  'watermark-image':'doWM','flip-image':'doFlip','image-borders':'doBorder',
  'round-corners':'doRound','blur-image':'doBlur','exif-tool':'doExif',
  'colour-palette':'doPal','image-collage':'doCollage','image-info':'doImgInfoRun','sprite-sheet':'doSprite',
  // Text
  'text-case':'doTC','lorem-ipsum':'doLorem','find-replace':'doFR','json-formatter':'doJSON',
  'xml-formatter':'doXML','csv-json':'doCJ','html-to-pdf':'doH2P','html-preview':'doHPExport',
  'invoice-generator':'doInvoice','meeting-minutes':'doMeeting',
  // Security
  'password-gen':'doPWGen','uuid-gen':'doUUID','file-hash':'doHash','url-tool':'doURL',
  'text-encrypt':'doTE','barcode-gen':'doBarcode','metadata-scrubber':'doMetaScrub','file-encrypt':'doFEnc',
  // Media
  'ico-generator':'doICO','svg-optimizer':'doSVGOpt','font-preview':'doFontRun','video-thumbnail':'doVThumb',
  // Dev
  'qr-generator':'doQR','timestamp':'doTS','regex-tester':'doRegex','diff-checker':'doDiff',
  // Util
  'pdf-text':'doPText','bulk-rename':'doBRen','img-to-portfolio':'doPFolio',
  'word-counter':'doWCount','csv-to-pdf':'doC2Pdf','base64-tool':'doB64',
};

async function runTool() {
  clearErr();
  document.getElementById('result')?.classList.remove('show');
  document.getElementById('prog')?.classList.add('show');
  setP(5, 'Starting…');
  const fnName = TOOL_FNS[curTool];
  const fn = fnName ? window[fnName] : null;
  try {
    if (typeof fn === 'function') {
      await fn();
    } else {
      showErr('Tool "' + curTool + '" is not implemented yet.', '');
    }
  } catch(e) {
    showErr(friendlyErr(e.message || 'An unexpected error occurred.'), getErrHint(curTool, e.message));
    console.error('[ToolKit Pro] Error in', curTool, e);
  }
  setP(100, 'Done');
  setTimeout(() => document.getElementById('prog')?.classList.remove('show'), 600);
}
function friendlyErr(msg) {
  if (!msg) return 'Something went wrong. Please try again.';
  if (msg.includes('Failed to fetch') || msg.includes('Failed to load')) return 'Could not load required library. Check your internet connection.';
  if (msg.includes('Cannot read') || msg.includes('undefined')) return 'File could not be processed. It may be corrupted or unsupported.';
  return msg;
}
function getErrHint(tool, msg) {
  if (!msg) return '';
  if (msg.includes('password') || msg.includes('decrypt')) return 'Tip: Ensure you are using the correct password.';
  if (msg.includes('No file') || msg.includes('toolFiles')) return 'Tip: Upload a file first using the dropzone above.';
  if (msg.includes('Invalid') && tool?.includes('pdf')) return 'Tip: Ensure the file is a valid, non-corrupted PDF.';
  return '';
}
function resetTool() {
  toolFiles = []; _rBM = null; _cBM = null; _cDS = 1; _cropLock = null;
  const flist = document.getElementById('flist'); if (flist) flist.innerHTML = '';
  const fi = document.getElementById('fi'); if (fi) fi.value = '';
  clearErr();
  document.getElementById('result')?.classList.remove('show');
  document.getElementById('prog')?.classList.remove('show');
  const tout = document.getElementById('tout'); if (tout) tout.innerHTML = '';
  document.getElementById('tout-wrap')?.classList.remove('show');
  const btn = document.getElementById('act-btn');
  if (btn && TOOLS[curTool]?.accept !== null && !NO_FILE.has(curTool)) btn.disabled = true;
  const ba = document.getElementById('before-after'); if (ba) ba.style.display = 'none';
  const po = document.getElementById('palette-out'); if (po) po.style.display = 'none';
  const qo = document.getElementById('qr-out'); if (qo) qo.classList.remove('show');
  const bo = document.getElementById('bc-out'); if (bo) bo.classList.remove('show');
}

// ── PROGRESS ─────────────────────────────────────────
function setP(pct, lbl) {
  const bar = document.getElementById('prog-bar'); if (bar) bar.style.width = pct + '%';
  const plbl = document.getElementById('prog-lbl'); if (plbl && lbl) plbl.textContent = lbl;
  const ppct = document.getElementById('prog-pct'); if (ppct) ppct.textContent = pct + '%';
}

// ── RESULT DISPLAY ────────────────────────────────────
function showRes(stats, files) {
  const rEl = document.getElementById('result'); if (!rEl) return;
  rEl.classList.add('show');
  const rs = document.getElementById('rstats');
  if (rs) rs.innerHTML = stats.map(s => `<div class="rstat"><strong>${s.v}</strong>${s.l}</div>`).join('');
  const rf = document.getElementById('rfiles');
  if (rf) rf.innerHTML = files.map((f, i) => `
    <div class="dl-row">
      <div class="dl-ico">${IC.dl}</div>
      <div class="dl-name">${f.name}</div>
      <span class="dl-sz">${fmtSz(f.blob.size)}</span>
      <button class="dl-btn" onclick="dlFile(${i})">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Download
      </button>
    </div>`).join('');
  rEl._files = files;
}
function dlFile(i) {
  const rEl = document.getElementById('result'); if (!rEl || !rEl._files) return;
  const f = rEl._files[i]; if (!f) return;
  saveFile(f.blob, f.name);
}

// ── ERROR ──────────────────────────────────────────────
function showErr(msg, hint) {
  document.getElementById('prog')?.classList.remove('show');
  const e = document.getElementById('err');
  const em = document.getElementById('err-msg');
  const eh = document.getElementById('err-hint');
  if (em) em.textContent = msg;
  if (eh) eh.textContent = hint || '';
  if (e) e.classList.add('show');
}
function clearErr() { document.getElementById('err')?.classList.remove('show'); }

// ── TEXT OUTPUT ───────────────────────────────────────
function showTO(html, isRaw) {
  const wrap = document.getElementById('tout-wrap'); const tout = document.getElementById('tout');
  if (wrap) wrap.classList.add('show');
  if (tout) { if (isRaw) tout.innerHTML = html; else tout.textContent = html; }
}
function copyOut() {
  const tout = document.getElementById('tout'); if (!tout) return;
  navigator.clipboard.writeText(tout.innerText || tout.textContent || '')
    .then(() => toast('Copied to clipboard!', 'ok'))
    .catch(() => toast('Copy failed.', 'bad'));
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  renderStats();
  // Sync theme icon state
  const t = localStorage.getItem('tkp-theme') || 'dark';
  const sun = document.getElementById('ico-sun');
  const moon = document.getElementById('ico-moon');
  if (sun)  sun.style.display  = t === 'dark' ? '' : 'none';
  if (moon) moon.style.display = t === 'dark' ? 'none' : '';
  document.documentElement.setAttribute('data-theme', t);
});

