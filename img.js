'use strict';
/* ══════════════════════════════════════════
   img.js — 16 Image Tools
   All QA fixes: EXIF parsing, before/after,
   palette copy-click, aspect ratio crop lock,
   social media presets for resize
══════════════════════════════════════════ */

// ── COMPRESS IMAGE ─────────────────────────────────────
async function doCImg() {
  if (!toolFiles.length) return;
  const quality = (gn('opt-quality') || 78) / 100;
  const maxW = parseInt(gv('opt-maxw')) || 0;
  const results = []; let tO = 0, tN = 0;

  for (let i = 0; i < toolFiles.length; i++) {
    setP(Math.round((i / toolFiles.length) * 90), `Compressing ${i+1}/${toolFiles.length}…`);
    const f = toolFiles[i]; tO += f.size;
    let bm = await createImageBitmap(f); let w = bm.width, h = bm.height;
    if (maxW && w > maxW) { h = Math.round(h * (maxW / w)); w = maxW; }
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    cv.getContext('2d').drawImage(bm, 0, 0, w, h);
    const mime = f.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await (await fetch(cv.toDataURL(mime, quality))).blob();
    tN += blob.size;
    results.push({ name: bn(f.name) + '_c.' + (mime.includes('png') ? 'png' : 'jpg'), blob });
    // Show before/after for single file
    if (toolFiles.length === 1) {
      const ba = document.getElementById('before-after');
      if (ba) {
        ba.style.display = 'grid';
        const burl = URL.createObjectURL(f);
        const aurl = URL.createObjectURL(blob);
        ba.innerHTML = `
          <div class="compare-box">
            <label>Before — ${fmtSz(f.size)}</label>
            <img src="${burl}" onload="URL.revokeObjectURL(this.src)" style="max-width:100%;max-height:200px;border-radius:6px;display:block;margin:0 auto">
            <div class="compare-stat">${bm.width}×${bm.height}px</div>
          </div>
          <div class="compare-box">
            <label>After — ${fmtSz(blob.size)}</label>
            <img src="${aurl}" onload="URL.revokeObjectURL(this.src)" style="max-width:100%;max-height:200px;border-radius:6px;display:block;margin:0 auto">
            <div class="compare-stat">${w}×${h}px · <b>${Math.max(0, Math.round((1 - blob.size / f.size) * 100))}% smaller</b></div>
          </div>`;
      }
    }
  }
  const pct = Math.max(0, Math.round((1 - tN / tO) * 100));
  showRes([
    { v: fmtSz(tO), l: 'Original total' }, { v: fmtSz(tN), l: 'Compressed' },
    { v: pct + '%', l: 'Saved' }, { v: results.length + '', l: 'Images' }
  ], results);
  results.forEach(r => saveFile(r.blob, r.name));
}

// ── RESIZE IMAGE (with live preview + social presets) ──
function buildResizeOpts() {
  return `<div class="opts-card"><div class="opts-hd">${IC.settings}<h4>Resize Options</h4></div><div class="opts-body">
    <div class="orow"><div class="olbl">Mode</div><div class="oc"><select class="osel" id="opt-mode" onchange="toggleRM()"><option>By Pixels</option><option>By Percentage</option></select></div></div>
    <div id="px-opts">
      <div class="orow"><div class="olbl">Social Preset<div class="osub">Auto-fills width &amp; height</div></div><div class="oc"><select class="osel" id="opt-preset" onchange="applyPreset()" style="width:210px"><option value="">— Custom —</option><option value="1200,630">Facebook / OG (1200×630)</option><option value="1080,1080">Instagram Square (1080×1080)</option><option value="1080,1920">Instagram Story (1080×1920)</option><option value="1200,628">LinkedIn Post (1200×628)</option><option value="1500,500">Twitter Header (1500×500)</option><option value="1280,720">YouTube Thumbnail (1280×720)</option><option value="800,800">WhatsApp DP (800×800)</option><option value="512,512">App Icon (512×512)</option></select></div></div>
      <div class="orow"><div class="olbl">Width (px)</div><div class="oc"><input type="number" class="oinp" id="opt-rw" placeholder="e.g. 1920" oninput="updatePrev()"></div></div>
      <div class="orow"><div class="olbl">Height (px)</div><div class="oc"><input type="number" class="oinp" id="opt-rh" placeholder="e.g. 1080" oninput="updatePrev()"></div></div>
    </div>
    <div id="pct-opts" style="display:none">
      <div class="orow"><div class="olbl">Scale</div><div class="oc"><div class="rng"><input type="range" min="5" max="200" step="5" value="50" id="opt-rpct" oninput="document.getElementById('rv-rpct').textContent=this.value+'%';updatePrev()"><span class="rv" id="rv-rpct">50%</span></div></div></div>
    </div>
    <div class="orow"><div class="olbl">Keep Aspect Ratio</div><div class="oc"><label class="tog"><input type="checkbox" id="opt-aspect" checked onchange="updatePrev()"><span class="tog-tr"></span></label></div></div>
    <div class="orow"><div class="olbl">JPEG Quality</div><div class="oc"><div class="rng"><input type="range" min="60" max="100" step="1" value="92" id="opt-rq" oninput="document.getElementById('rv-rq').textContent=this.value+'%'"><span class="rv" id="rv-rq">92%</span></div></div></div>
  </div></div>`;
}
function applyPreset() {
  const v = gv('opt-preset'); if (!v) return;
  const [pw, ph] = v.split(',');
  const rw = document.getElementById('opt-rw'); const rh = document.getElementById('opt-rh');
  if (rw) rw.value = pw; if (rh) rh.value = ph;
  const asp = document.getElementById('opt-aspect'); if (asp) asp.checked = false;
  updatePrev();
}
function toggleRM() {
  const m = gv('opt-mode');
  const px = document.getElementById('px-opts'); const pc = document.getElementById('pct-opts');
  if (px) px.style.display = m === 'By Percentage' ? 'none' : '';
  if (pc) pc.style.display = m === 'By Percentage' ? '' : 'none';
  updatePrev();
}
function initRW() {}
async function loadRI(f) { _rBM = await createImageBitmap(f); updatePrev(); }
function updatePrev() {
  if (!_rBM) return;
  const pc = document.getElementById('prev-card'); if (pc) pc.classList.add('show');
  const mode = gv('opt-mode') || 'By Pixels'; const ka = gk('opt-aspect');
  let tw, th;
  if (mode === 'By Percentage') {
    const pct = (parseFloat(gv('opt-rpct')) || 50) / 100;
    tw = Math.round(_rBM.width * pct); th = Math.round(_rBM.height * pct);
  } else {
    tw = parseInt(gv('opt-rw')) || _rBM.width; th = parseInt(gv('opt-rh')) || _rBM.height;
    if (ka) { const r = Math.min(tw / _rBM.width, th / _rBM.height); tw = Math.round(_rBM.width * r); th = Math.round(_rBM.height * r); }
  }
  const cv = document.getElementById('prev-cv'); if (!cv) return;
  const maxW = Math.min(tw, 760); const s = maxW / tw;
  cv.width = Math.round(tw * s); cv.height = Math.round(th * s); cv.style.maxWidth = '100%';
  cv.getContext('2d').drawImage(_rBM, 0, 0, cv.width, cv.height);
  const d = document.getElementById('prev-dims'); if (d) d.textContent = `${tw} × ${th} px`;
}
async function doRImg() {
  if (!toolFiles.length) return;
  const f = toolFiles[0]; const bm = _rBM || await createImageBitmap(f);
  const mode = gv('opt-mode') || 'By Pixels'; const ka = gk('opt-aspect'); const quality = (parseFloat(gv('opt-rq')) || 92) / 100;
  let tw, th;
  if (mode === 'By Percentage') { const pct = (parseFloat(gv('opt-rpct')) || 50) / 100; tw = Math.round(bm.width * pct); th = Math.round(bm.height * pct); }
  else { tw = parseInt(gv('opt-rw')) || bm.width; th = parseInt(gv('opt-rh')) || bm.height; if (ka) { const r = Math.min(tw / bm.width, th / bm.height); tw = Math.round(bm.width * r); th = Math.round(bm.height * r); } }
  if (tw < 1 || th < 1) throw new Error('Invalid dimensions — width and height must be at least 1px.');
  setP(50, `Resizing to ${tw}×${th}…`);
  const cv = document.createElement('canvas'); cv.width = tw; cv.height = th;
  cv.getContext('2d').drawImage(bm, 0, 0, tw, th);
  const mime = f.type || 'image/jpeg'; const blob = await (await fetch(cv.toDataURL(mime, quality))).blob();
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
  const name = bn(f.name) + `_${tw}x${th}.` + ext;
  showRes([
    { v: `${bm.width}×${bm.height}`, l: 'Original' }, { v: `${tw}×${th}`, l: 'New size' },
    { v: fmtSz(f.size) + ' → ' + fmtSz(blob.size), l: 'File size' }
  ], [{ name, blob }]);
  saveFile(blob, name);
}

// ── CROP IMAGE (with aspect lock + rule of thirds) ─────
let _cDrg = false, _cSX = 0, _cSY = 0, _cropLock = null;

async function loadCI(f) {
  _cBM = await createImageBitmap(f);
  const nw = _cBM.width, nh = _cBM.height;
  const maxW = Math.min(nw, 780); _cDS = maxW / nw;
  const dw = Math.round(nw * _cDS), dh = Math.round(nh * _cDS);
  const card = document.getElementById('crop-card');
  const cv = document.getElementById('crop-cv'); const ov = document.getElementById('crop-ov');
  if (!card || !cv || !ov) return;
  card.classList.add('show');
  cv.width = dw; cv.height = dh; cv.style.width = '100%';
  ov.width = dw; ov.height = dh; ov.style.width = '100%'; ov.style.height = 'auto';
  cv.getContext('2d').drawImage(_cBM, 0, 0, dw, dh);
  document.getElementById('cx').value = 0; document.getElementById('cy').value = 0;
  document.getElementById('cw').value = nw; document.getElementById('ch').value = nh;
  drawCOv();
  // Inject aspect lock buttons if not present
  const hd = document.querySelector('.crop-hd');
  if (hd && !document.getElementById('crop-lock-btns')) {
    const btns = document.createElement('div');
    btns.id = 'crop-lock-btns';
    btns.style.cssText = 'display:flex;gap:5px;flex-wrap:wrap;align-items:center';
    [['Free',''],['1:1','1'],['4:3','1.333'],['16:9','1.778'],['3:2','1.5'],['9:16','0.5625']].forEach(([lbl, ratio], i) => {
      const b = document.createElement('button');
      b.textContent = lbl;
      b.dataset.ratio = ratio;
      b.style.cssText = `padding:3px 9px;border-radius:6px;border:1px solid var(--b2);background:${i===0?'var(--ac)':'var(--s2)'};color:${i===0?'#fff':'var(--t2)'};font-size:11px;cursor:pointer;font-weight:600;transition:all .12s`;
      b.onclick = () => {
        _cropLock = ratio || null;
        btns.querySelectorAll('button').forEach(x => { x.style.background = 'var(--s2)'; x.style.color = 'var(--t2)'; });
        b.style.background = 'var(--ac)'; b.style.color = '#fff';
        if (_cropLock) { // Apply lock to current selection
          const cw = parseInt(document.getElementById('cw').value) || 100;
          const newH = Math.round(cw / parseFloat(_cropLock));
          document.getElementById('ch').value = newH; drawCOv();
        }
      };
      btns.appendChild(b);
    });
    hd.appendChild(btns);
  }
  const getCoords = (e, isTouch) => {
    const t = isTouch ? e.touches[0] : e;
    const r = ov.getBoundingClientRect(); const sc = dw / ov.offsetWidth;
    return [(t.clientX - r.left) * sc, (t.clientY - r.top) * sc];
  };
  const onStart = (ex, ey) => { _cDrg = true; _cSX = Math.max(0, Math.min(ex, dw)); _cSY = Math.max(0, Math.min(ey, dh)); };
  const onMove = (ex, ey) => {
    if (!_cDrg) return;
    ex = Math.max(0, Math.min(ex, dw)); ey = Math.max(0, Math.min(ey, dh));
    let cw = Math.max(4, Math.abs(ex - _cSX));
    let ch = _cropLock ? Math.round(cw / parseFloat(_cropLock)) : Math.max(4, Math.abs(ey - _cSY));
    document.getElementById('cx').value = Math.round(Math.min(_cSX, ex) / _cDS);
    document.getElementById('cy').value = Math.round(Math.min(_cSY, ey) / _cDS);
    document.getElementById('cw').value = Math.round(cw / _cDS);
    document.getElementById('ch').value = Math.round(ch / _cDS);
    drawCOv();
  };
  ov.onmousedown = e => onStart(...getCoords(e, false));
  ov.onmousemove = e => onMove(...getCoords(e, false));
  ov.onmouseup = ov.onmouseleave = () => { _cDrg = false; };
  ov.ontouchstart = e => { e.preventDefault(); onStart(...getCoords(e, true)); };
  ov.ontouchmove = e => { e.preventDefault(); onMove(...getCoords(e, true)); };
  ov.ontouchend = () => { _cDrg = false; };
}

function drawCOv() {
  const ov = document.getElementById('crop-ov'); if (!ov) return;
  const ctx = ov.getContext('2d'); const ds = _cDS || 1;
  const cx = (parseInt(document.getElementById('cx')?.value) || 0) * ds;
  const cy = (parseInt(document.getElementById('cy')?.value) || 0) * ds;
  const cw = (parseInt(document.getElementById('cw')?.value) || 0) * ds;
  const ch = (parseInt(document.getElementById('ch')?.value) || 0) * ds;
  ctx.clearRect(0, 0, ov.width, ov.height);
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 0, ov.width, ov.height);
  ctx.clearRect(cx, cy, cw, ch);
  ctx.strokeStyle = '#7c6fff'; ctx.lineWidth = 2; ctx.strokeRect(cx, cy, cw, ch);
  // Corner handles
  const hs = 8; ctx.fillStyle = '#7c6fff';
  [[cx, cy], [cx+cw-hs, cy], [cx, cy+ch-hs], [cx+cw-hs, cy+ch-hs]].forEach(([x, y]) => ctx.fillRect(x, y, hs, hs));
  // Rule of thirds
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  [1/3, 2/3].forEach(f => {
    ctx.beginPath(); ctx.moveTo(cx + cw*f, cy); ctx.lineTo(cx + cw*f, cy+ch); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy + ch*f); ctx.lineTo(cx+cw, cy+ch*f); ctx.stroke();
  });
  ctx.setLineDash([]);
  // Dimensions label
  const rawW = Math.round(cw / ds); const rawH = Math.round(ch / ds);
  if (rawW > 30 && rawH > 20) {
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(cx+2, cy+2, 80, 18);
    ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.fillText(`${rawW}×${rawH}`, cx+6, cy+14);
  }
}

async function doCropImg() {
  if (!toolFiles.length || !_cBM) throw new Error('Upload an image first, then drag to select the crop area.');
  const cx = parseInt(document.getElementById('cx')?.value) || 0;
  const cy = parseInt(document.getElementById('cy')?.value) || 0;
  const cw = parseInt(document.getElementById('cw')?.value) || 0;
  const ch = parseInt(document.getElementById('ch')?.value) || 0;
  if (cw < 2 || ch < 2) throw new Error('Draw a crop area on the image first by clicking and dragging.');
  const safeCx = Math.max(0, Math.min(cx, _cBM.width - 1));
  const safeCy = Math.max(0, Math.min(cy, _cBM.height - 1));
  const safeCw = Math.min(cw, _cBM.width - safeCx);
  const safeCh = Math.min(ch, _cBM.height - safeCy);
  setP(50, `Cropping ${safeCw}×${safeCh}…`);
  const bm = await createImageBitmap(_cBM, safeCx, safeCy, safeCw, safeCh);
  const cv = document.createElement('canvas'); cv.width = safeCw; cv.height = safeCh;
  cv.getContext('2d').drawImage(bm, 0, 0);
  const mime = toolFiles[0].type || 'image/jpeg';
  const blob = await (await fetch(cv.toDataURL(mime, .95))).blob();
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
  const name = bn(toolFiles[0].name) + '_cropped.' + ext;
  showRes([
    { v: `${safeCw}×${safeCh}`, l: 'Cropped size' }, { v: `${_cBM.width}×${_cBM.height}`, l: 'Original' },
    { v: fmtSz(blob.size), l: 'File size' }
  ], [{ name, blob }]);
  saveFile(blob, name);
}

// ── CONVERT TO JPG ─────────────────────────────────────
async function doC2J() {
  if (!toolFiles.length) return;
  const quality = (gn('opt-quality') || 92) / 100;
  const bgMap = { 'White': '#fff', 'Black': '#000', 'Light Grey': '#f0f0f0' };
  const bg = bgMap[gv('opt-bgcolor')] || '#fff'; const results = [];
  for (let i = 0; i < toolFiles.length; i++) {
    setP(Math.round((i / toolFiles.length) * 90), `Converting ${i+1}/${toolFiles.length}…`);
    const bm = await createImageBitmap(toolFiles[i]);
    const cv = document.createElement('canvas'); cv.width = bm.width; cv.height = bm.height;
    const ctx = cv.getContext('2d'); ctx.fillStyle = bg; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(bm, 0, 0);
    const blob = await (await fetch(cv.toDataURL('image/jpeg', quality))).blob();
    results.push({ name: bn(toolFiles[i].name) + '.jpg', blob });
  }
  showRes([{ v: results.length + '', l: 'Converted' }, { v: 'JPEG', l: 'Output format' }], results);
  results.forEach(r => saveFile(r.blob, r.name));
}

// ── CONVERT FROM JPG ───────────────────────────────────
async function doCFJ() {
  if (!toolFiles.length) return;
  const fmt = gv('opt-fmt') || 'PNG — Lossless';
  const isWp = fmt.includes('WEBP'); const mime = isWp ? 'image/webp' : 'image/png'; const ext = isWp ? 'webp' : 'png';
  const results = [];
  for (let i = 0; i < toolFiles.length; i++) {
    setP(Math.round((i / toolFiles.length) * 90), `Converting ${i+1}/${toolFiles.length}…`);
    const bm = await createImageBitmap(toolFiles[i]);
    const cv = document.createElement('canvas'); cv.width = bm.width; cv.height = bm.height;
    cv.getContext('2d').drawImage(bm, 0, 0);
    const blob = await (await fetch(cv.toDataURL(mime))).blob();
    results.push({ name: bn(toolFiles[i].name) + '.' + ext, blob });
  }
  showRes([{ v: results.length + '', l: 'Converted' }, { v: ext.toUpperCase(), l: 'Output format' }], results);
  results.forEach(r => saveFile(r.blob, r.name));
}

// ── GRAYSCALE ──────────────────────────────────────────
async function doGray() {
  if (!toolFiles.length) return; const enhance = gk('opt-contrast'); const results = [];
  for (let i = 0; i < toolFiles.length; i++) {
    setP(Math.round((i / toolFiles.length) * 90), `Processing ${i+1}/${toolFiles.length}…`);
    const bm = await createImageBitmap(toolFiles[i]);
    const cv = document.createElement('canvas'); cv.width = bm.width; cv.height = bm.height;
    const ctx = cv.getContext('2d'); ctx.drawImage(bm, 0, 0);
    const id = ctx.getImageData(0, 0, cv.width, cv.height); const d = id.data;
    for (let j = 0; j < d.length; j += 4) {
      let g = d[j] * .299 + d[j+1] * .587 + d[j+2] * .114;
      if (enhance) g = Math.min(255, Math.max(0, (g - 128) * 1.35 + 128));
      d[j] = d[j+1] = d[j+2] = g;
    }
    ctx.putImageData(id, 0, 0);
    const blob = await (await fetch(cv.toDataURL('image/jpeg', .92))).blob();
    results.push({ name: bn(toolFiles[i].name) + '_bw.jpg', blob });
  }
  showRes([{ v: results.length + '', l: 'Converted' }, { v: enhance ? 'High contrast' : 'Normal', l: 'Mode' }], results);
  results.forEach(r => saveFile(r.blob, r.name));
}

// ── WATERMARK ──────────────────────────────────────────
async function doWM() {
  if (!toolFiles.length) return; const f = toolFiles[0];
  const text = gv('opt-text') || '© Your Company';
  const opacity = gn('opt-opacity') / 100 || .3;
  const pos = gv('opt-pos') || 'Centre (diagonal)';
  const colorName = gv('opt-color') || 'White';
  const cMap = { 'White': [255,255,255], 'Black': [0,0,0], 'Red': [220,30,30], 'Blue': [30,30,220], 'Grey': [128,128,128] };
  const rgb = cMap[colorName] || cMap.White;
  const bm = await createImageBitmap(f);
  const cv = document.createElement('canvas'); cv.width = bm.width; cv.height = bm.height;
  const ctx = cv.getContext('2d'); ctx.drawImage(bm, 0, 0);
  const fs = Math.max(18, Math.min(bm.width, bm.height) * (pos.includes('Tiled') ? .04 : .08));
  ctx.font = `bold ${fs}px 'Inter',Arial,sans-serif`;
  ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${opacity})`;
  const tw = ctx.measureText(text).width;
  if (pos.includes('Tiled')) {
    for (let y = -fs*4; y < bm.height + fs*4; y += fs*3.5)
      for (let x = -tw*2; x < bm.width + tw*2; x += tw*1.8) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI/6); ctx.fillText(text, 0, 0); ctx.restore();
      }
  } else if (pos.includes('diagonal')) {
    ctx.save(); ctx.translate(bm.width/2, bm.height/2); ctx.rotate(-Math.PI/7);
    ctx.textAlign = 'center'; ctx.fillText(text, 0, 0); ctx.restore();
  } else {
    let x, y; const pad = 24;
    if (pos.includes('Bottom Right'))     { x = bm.width - tw - pad; y = bm.height - pad; }
    else if (pos.includes('Bottom Left')) { x = pad; y = bm.height - pad; }
    else if (pos.includes('Top Right'))   { x = bm.width - tw - pad; y = fs + pad; }
    else                                   { x = pad; y = fs + pad; }
    ctx.fillText(text, x, y);
  }
  const blob = await (await fetch(cv.toDataURL('image/jpeg', .92))).blob();
  const name = bn(f.name) + '_wm.jpg';
  showRes([{ v: '"' + text + '"', l: 'Text' }, { v: Math.round(opacity*100) + '%', l: 'Opacity' }, { v: pos, l: 'Position' }], [{ name, blob }]);
  saveFile(blob, name);
}

// ── FLIP & MIRROR ──────────────────────────────────────
async function doFlip() {
  if (!toolFiles.length) return; const dir = gv('opt-dir') || 'Horizontal (Mirror)'; const results = [];
  for (let i = 0; i < toolFiles.length; i++) {
    setP(Math.round((i / toolFiles.length) * 90), `Flipping ${i+1}/${toolFiles.length}…`);
    const bm = await createImageBitmap(toolFiles[i]);
    const cv = document.createElement('canvas'); cv.width = bm.width; cv.height = bm.height;
    const ctx = cv.getContext('2d'); ctx.save();
    if (dir === 'Both')               { ctx.setTransform(-1, 0, 0, -1, bm.width, bm.height); }
    else if (dir.includes('Horizontal')) { ctx.translate(bm.width, 0); ctx.scale(-1, 1); }
    else                              { ctx.translate(0, bm.height); ctx.scale(1, -1); }
    ctx.drawImage(bm, 0, 0); ctx.restore();
    const suf = dir === 'Both' ? '_both' : dir.includes('Horizontal') ? '_mirror' : '_flip';
    const blob = await (await fetch(cv.toDataURL('image/jpeg', .92))).blob();
    results.push({ name: bn(toolFiles[i].name) + suf + '.jpg', blob });
  }
  showRes([{ v: results.length + '', l: 'Processed' }, { v: dir, l: 'Direction' }], results);
  results.forEach(r => saveFile(r.blob, r.name));
}

// ── ADD BORDER ─────────────────────────────────────────
async function doBorder() {
  if (!toolFiles.length) return; const f = toolFiles[0];
  const bsize = Math.max(1, parseInt(gv('opt-bsize')) || 20);
  const bcolor = gv('opt-bcolor') || '#ffffff'; const bradius = parseInt(gv('opt-bradius')) || 0;
  setP(40, 'Adding border…');
  const bm = await createImageBitmap(f);
  const cv = document.createElement('canvas'); cv.width = bm.width + bsize*2; cv.height = bm.height + bsize*2;
  const ctx = cv.getContext('2d'); ctx.fillStyle = bcolor; ctx.fillRect(0, 0, cv.width, cv.height);
  if (bradius > 0) {
    ctx.save(); ctx.beginPath(); ctx.roundRect(bsize, bsize, bm.width, bm.height, Math.min(bradius, bsize/2)); ctx.clip();
  }
  ctx.drawImage(bm, bsize, bsize); if (bradius > 0) ctx.restore();
  const blob = await (await fetch(cv.toDataURL('image/jpeg', .94))).blob();
  const name = bn(f.name) + '_bordered.jpg';
  showRes([{ v: bsize + 'px', l: 'Border width' }, { v: bcolor, l: 'Colour' }, { v: `${cv.width}×${cv.height}`, l: 'New size' }], [{ name, blob }]);
  saveFile(blob, name);
}

// ── ROUND CORNERS ──────────────────────────────────────
async function doRound() {
  if (!toolFiles.length) return; const f = toolFiles[0];
  const radius = Math.max(1, parseInt(gv('opt-radius')) || 40);
  const bg = gv('opt-bg') || 'Transparent (PNG)';
  setP(40, 'Rounding corners…');
  const bm = await createImageBitmap(f);
  const cv = document.createElement('canvas'); cv.width = bm.width; cv.height = bm.height;
  const ctx = cv.getContext('2d');
  if (bg !== 'Transparent (PNG)') { ctx.fillStyle = bg === 'Black' ? '#000' : '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); }
  ctx.beginPath(); ctx.roundRect(0, 0, bm.width, bm.height, Math.min(radius, bm.width/2, bm.height/2)); ctx.clip();
  ctx.drawImage(bm, 0, 0);
  const mime = bg === 'Transparent (PNG)' ? 'image/png' : 'image/jpeg';
  const blob = await (await fetch(cv.toDataURL(mime, .95))).blob();
  const ext = mime.includes('png') ? 'png' : 'jpg';
  const name = bn(f.name) + '_rounded.' + ext;
  showRes([{ v: radius + 'px', l: 'Radius' }, { v: bg, l: 'Background' }, { v: fmtSz(blob.size), l: 'Size' }], [{ name, blob }]);
  saveFile(blob, name);
}

// ── BLUR IMAGE ─────────────────────────────────────────
async function doBlur() {
  if (!toolFiles.length) return; const f = toolFiles[0]; const radius = Math.max(1, gn('opt-radius') || 5);
  setP(40, `Blurring at ${radius}px…`);
  const bm = await createImageBitmap(f);
  const cv = document.createElement('canvas'); cv.width = bm.width; cv.height = bm.height;
  const ctx = cv.getContext('2d');
  // Draw with blur (extend draw area to avoid edge fading)
  ctx.filter = `blur(${radius}px)`;
  ctx.drawImage(bm, -radius*2, -radius*2, bm.width + radius*4, bm.height + radius*4);
  ctx.filter = 'none';
  const blob = await (await fetch(cv.toDataURL('image/jpeg', .92))).blob();
  const name = bn(f.name) + `_blur${radius}.jpg`;
  showRes([{ v: radius + 'px', l: 'Blur radius' }, { v: fmtSz(blob.size), l: 'Output size' }], [{ name, blob }]);
  saveFile(blob, name);
}

// ── EXIF VIEWER (real binary parser) ───────────────────
async function doExif() {
  if (!toolFiles.length) return; const f = toolFiles[0]; const mode = gv('opt-mode') || 'View EXIF data';
  setP(20, 'Reading…');
  if (mode.startsWith('Strip')) {
    const bm = await createImageBitmap(f);
    const cv = document.createElement('canvas'); cv.width = bm.width; cv.height = bm.height;
    cv.getContext('2d').drawImage(bm, 0, 0);
    const blob = await (await fetch(cv.toDataURL('image/jpeg', .95))).blob();
    const name = bn(f.name) + '_noexif.jpg';
    showRes([{ v: 'Removed', l: 'EXIF status' }, { v: fmtSz(f.size) + ' → ' + fmtSz(blob.size), l: 'Size' }], [{ name, blob }]);
    saveFile(blob, name);
    return;
  }
  const buf = await readBuf(f); const view = new DataView(buf);
  const TAGS = {
    0x010F:'Make', 0x0110:'Model', 0x0112:'Orientation',
    0x011A:'X Resolution', 0x011B:'Y Resolution', 0x0128:'Resolution Unit',
    0x0132:'DateTime Modified', 0x013B:'Artist', 0x8298:'Copyright',
    0x9000:'Exif Version', 0x9003:'DateTime Original', 0x9004:'DateTime Digitised',
    0x9201:'Shutter Speed', 0x9202:'Aperture (FNumber)',
    0x9204:'Exposure Bias EV', 0x9205:'Max Aperture', 0x9206:'Subject Distance',
    0x9207:'Metering Mode', 0x9208:'Light Source', 0x9209:'Flash',
    0x920A:'Focal Length mm', 0xA001:'Colour Space',
    0xA002:'Pixel Width', 0xA003:'Pixel Height',
    0xA402:'Exposure Mode', 0xA403:'White Balance',
    0xA404:'Digital Zoom Ratio', 0xA405:'Focal Length 35mm Equiv',
    0xA406:'Scene Capture Type', 0x8825:'GPS IFD Offset',
  };
  const METERING = { 0:'Unknown',1:'Average',2:'Centre-weighted',3:'Spot',4:'Multi-spot',5:'Multi-segment',6:'Partial' };
  const FLASH = { 0:'No flash',1:'Flash fired',5:'Flash fired, no strobe',7:'Flash fired, strobe',9:'Flash fired, compulsory',13:'Flash fired, compulsory, no strobe',15:'Flash fired, compulsory, strobe',16:'No flash, compulsory',24:'No flash, auto',25:'Flash fired, auto',29:'Flash fired, auto, no strobe',31:'Flash fired, auto, strobe' };
  const parsed = {}; let exifFound = false;
  try {
    if (view.getUint16(0) !== 0xFFD8) throw new Error('Not a valid JPEG file.');
    let offset = 2;
    while (offset < Math.min(buf.byteLength - 4, 131072)) {
      const marker = view.getUint16(offset);
      if (marker === 0xFFE1) {
        const segLen = view.getUint16(offset + 2);
        const header = String.fromCharCode(...new Uint8Array(buf, offset+4, 4));
        if (header === 'Exif') {
          exifFound = true;
          const tiff = offset + 10;
          const bigEnd = view.getUint16(tiff) === 0x4D4D;
          const rd16 = o => bigEnd ? view.getUint16(o) : view.getUint16(o, true);
          const rd32 = o => bigEnd ? view.getUint32(o) : view.getUint32(o, true);
          const readStr = (off, len) => { let s = ''; for (let j=0; j<Math.min(len-1,200); j++) { const c = view.getUint8(off+j); if (c===0) break; s += String.fromCharCode(c); } return s.trim(); };
          const readRat = (off) => { const n = rd32(off); const d = rd32(off+4); return d ? parseFloat((n/d).toFixed(4)) : 0; };
          const parseIFD = (ifdBase) => {
            try {
              const n = rd16(ifdBase); if (n > 256 || n < 0) return;
              for (let i = 0; i < n; i++) {
                const eOff = ifdBase + 2 + i * 12;
                const tag = rd16(eOff); const type = rd16(eOff+2); const count = rd32(eOff+4);
                const byteLen = [0,1,1,2,4,8,1,1,2,4,8,4,8][type] || 0;
                const valOff = (byteLen * count) <= 4 ? eOff+8 : tiff + rd32(eOff+8);
                if (!TAGS[tag]) continue;
                let v = null;
                if (type === 2) v = readStr(valOff, count);
                else if (type === 3) v = rd16(valOff);
                else if (type === 4) v = rd32(valOff);
                else if (type === 5) v = readRat(valOff);
                else if (type === 10) v = readRat(valOff);
                if (v !== null && v !== '' && v !== 0) {
                  if (tag === 0x9207) v = METERING[v] || v;
                  if (tag === 0x9209) v = FLASH[v] || v;
                  if (tag === 0x920A) v = v + ' mm';
                  if (tag === 0x9202) v = 'f/' + v;
                  if (tag === 0x9204) v = v + ' EV';
                  if (tag === 0x9206) v = v + ' m';
                  if (tag === 0xA405) v = v + ' mm';
                  parsed[TAGS[tag]] = v;
                }
              }
              // Recurse into Exif SubIFD
              for (let i = 0; i < n; i++) {
                const eOff = ifdBase + 2 + i * 12; const tag = rd16(eOff);
                if (tag === 0x8769) { try { parseIFD(tiff + rd32(eOff+8)); } catch {} }
              }
            } catch {}
          };
          parseIFD(tiff + rd32(tiff + 4));
        }
        offset += 2 + segLen; continue;
      }
      if ((marker & 0xFF00) !== 0xFF00) break;
      try { offset += 2 + view.getUint16(offset + 2); } catch { break; }
    }
  } catch(e) { console.warn('EXIF parse error:', e); }

  const bm = await createImageBitmap(f);
  const fileFields = {
    'File Name': f.name, 'File Size': fmtSz(f.size),
    'Image Width': bm.width + ' px', 'Image Height': bm.height + ' px',
    'Megapixels': (bm.width * bm.height / 1e6).toFixed(2) + ' MP',
    'MIME Type': f.type, 'Last Modified': new Date(f.lastModified).toLocaleString(),
  };
  const allFields = { ...fileFields, ...(exifFound ? parsed : { 'EXIF Status': 'No EXIF metadata found in this file' }) };
  let report = `EXIF & Image Report\n${'─'.repeat(42)}\n`;
  Object.entries(allFields).forEach(([k, v]) => { report += `${k.padEnd(26)}: ${v}\n`; });
  if (exifFound) report += `\nFields found: ${Object.keys(parsed).length}`;
  report += `\n${'─'.repeat(42)}\nTip: Use "Strip all EXIF" to remove metadata before sharing.`;
  setP(100, 'Done');
  showTO(report);
  const blob = new Blob([report], { type: 'text/plain' });
  showRes([
    { v: exifFound ? '✓ Found' : 'None', l: 'EXIF data' },
    { v: Object.keys(parsed).length + '', l: 'Fields' },
    { v: `${bm.width}×${bm.height}`, l: 'Dimensions' }
  ], [{ name: bn(f.name) + '_exif.txt', blob }]);
}

// ── COLOUR PALETTE (copy-click hex) ────────────────────
async function doPal() {
  if (!toolFiles.length) return; const count = Math.max(2, Math.min(Math.round(gn('opt-count')) || 6, 16)); const f = toolFiles[0];
  setP(20, 'Sampling…');
  const bm = await createImageBitmap(f);
  const cv = document.createElement('canvas');
  const scale = Math.min(120 / Math.max(bm.width, bm.height), 1);
  cv.width = Math.round(bm.width * scale); cv.height = Math.round(bm.height * scale);
  cv.getContext('2d').drawImage(bm, 0, 0, cv.width, cv.height);
  const data = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  setP(50, 'Clustering colours…');
  const pixels = [];
  for (let i = 0; i < data.length; i += 4) if (data[i+3] > 128) pixels.push([data[i], data[i+1], data[i+2]]);
  if (!pixels.length) throw new Error('No opaque pixels found in image.');
  // K-means
  let centers = Array.from({ length: count }, (_, i) => pixels[Math.floor(i / count * pixels.length)] || [128,128,128]);
  for (let it = 0; it < 15; it++) {
    const sums = Array.from({ length: count }, () => [0,0,0,0]);
    for (const p of pixels) {
      let best = 0, bd = Infinity;
      for (let j = 0; j < centers.length; j++) { const d = (p[0]-centers[j][0])**2+(p[1]-centers[j][1])**2+(p[2]-centers[j][2])**2; if (d < bd) { bd = d; best = j; } }
      sums[best][0]+=p[0]; sums[best][1]+=p[1]; sums[best][2]+=p[2]; sums[best][3]++;
    }
    centers = sums.map((s, i) => s[3] > 0 ? [Math.round(s[0]/s[3]),Math.round(s[1]/s[3]),Math.round(s[2]/s[3])] : centers[i]);
  }
  const toHex = ([r,g,b]) => '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('').toUpperCase();
  const palette = centers.map(toHex);
  setP(90, 'Rendering…');
  const po = document.getElementById('palette-out');
  if (po) {
    po.style.display = 'flex';
    po.innerHTML = palette.map(hex => {
      const lum = parseInt(hex.slice(1,3),16)*0.299 + parseInt(hex.slice(3,5),16)*0.587 + parseInt(hex.slice(5,7),16)*0.114;
      const textCol = lum > 140 ? '#333' : '#fff';
      return `<div title="Click to copy ${hex}" onclick="navigator.clipboard.writeText('${hex}').then(()=>toast('${hex} copied!','ok'))" style="cursor:pointer;text-align:center;transition:transform .15s" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
        <div style="width:56px;height:56px;border-radius:12px;background:${hex};display:flex;align-items:center;justify-content:center;margin-bottom:5px;box-shadow:0 2px 8px rgba(0,0,0,.2)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${textCol}" stroke-width="2.5" opacity=".7"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </div>
        <div style="font-size:10px;color:var(--t3);font-family:monospace;font-weight:600">${hex}</div>
      </div>`;
    }).join('');
  }
  const cssVars = palette.map((h,i) => `  --color-${i+1}: ${h};`).join('\n');
  const txt = `Colour Palette\n${palette.join('\n')}\n\nCSS Variables:\n:root {\n${cssVars}\n}`;
  const blob = new Blob([txt], { type: 'text/plain' });
  showRes([{ v: count + '', l: 'Colours' }, { v: palette[0], l: 'Primary' }, { v: 'Click swatches to copy', l: 'Tip' }], [{ name: bn(f.name) + '_palette.txt', blob }]);
}

// ── IMAGE COLLAGE ──────────────────────────────────────
async function doCollage() {
  if (toolFiles.length < 2) throw new Error('Upload at least 2 images to create a collage.');
  const layout = gv('opt-layout') || 'Auto Grid'; const gap = parseInt(gn('opt-gap')) || 4;
  const bg = gv('opt-bg') || '#ffffff'; const outW = Math.min(parseInt(gv('opt-size')) || 1200, 5000);
  setP(10, 'Loading images…');
  const bitmaps = await Promise.all(toolFiles.map(f => createImageBitmap(f))); const n = bitmaps.length;
  let cols = layout.includes('2 Col') ? 2 : layout.includes('3 Col') ? 3 : layout.includes('Horizontal') ? n : layout.includes('Vertical') ? 1 : Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols); const cellW = Math.floor((outW-(cols+1)*gap)/cols); const cellH = cellW;
  const outH = (cellH+gap)*rows+gap;
  const cv = document.createElement('canvas'); cv.width = outW; cv.height = outH;
  const ctx = cv.getContext('2d'); ctx.fillStyle = bg; ctx.fillRect(0,0,outW,outH);
  bitmaps.forEach((bm,i) => {
    const col = i%cols, row = Math.floor(i/cols);
    const x = gap+col*(cellW+gap), y = gap+row*(cellH+gap);
    const sc = Math.max(cellW/bm.width, cellH/bm.height);
    ctx.drawImage(bm, (bm.width-cellW/sc)/2, (bm.height-cellH/sc)/2, cellW/sc, cellH/sc, x,y, cellW, cellH);
    setP(Math.round(10+(i+1)/n*85), `Placing image ${i+1}/${n}…`);
  });
  const blob = await (await fetch(cv.toDataURL('image/jpeg',.92))).blob();
  showRes([{ v:n+'',l:'Images' }, { v:`${outW}×${outH}`,l:'Output size' }, { v:layout,l:'Layout' }],[{name:'collage.jpg',blob}]);
  saveFile(blob,'collage.jpg');
}

// ── IMAGE INSPECTOR ────────────────────────────────────
async function runImgInfo(f) {
  const bm = await createImageBitmap(f);
  const gcd = (a,b) => b ? gcd(b,a%b) : a; const g = gcd(bm.width,bm.height);
  const aspect = `${bm.width/g}:${bm.height/g}`;
  const mp = (bm.width*bm.height/1e6).toFixed(2);
  const r = `Image Inspector\n${'─'.repeat(40)}\nFile: ${f.name}\nSize: ${fmtSz(f.size)}\nWidth: ${bm.width} px\nHeight: ${bm.height} px\nMegapixels: ${mp} MP\nAspect ratio: ${aspect}\nFormat: ${f.type||'unknown'}\nModified: ${new Date(f.lastModified).toLocaleString()}\n`;
  showTO(r);
  const blob = new Blob([r],{type:'text/plain'});
  showRes([{v:`${bm.width}×${bm.height}`,l:'Dimensions'},{v:mp+' MP',l:'Megapixels'},{v:aspect,l:'Aspect ratio'}],[{name:bn(f.name)+'_info.txt',blob}]);
}
async function doImgInfoRun() { if (toolFiles.length) await runImgInfo(toolFiles[0]); }

// ── SPRITE SHEET ───────────────────────────────────────
async function doSprite() {
  if (!toolFiles.length) throw new Error('Upload at least one image.');
  const cellW = Math.max(1,parseInt(gv('opt-cellW'))||64);
  const cellH = Math.max(1,parseInt(gv('opt-cellH'))||64);
  const cols = Math.max(1,parseInt(gv('opt-cols'))||4);
  const bitmaps = await Promise.all(toolFiles.map(f=>createImageBitmap(f)));
  const rows = Math.ceil(bitmaps.length/cols);
  const cv = document.createElement('canvas'); cv.width=cols*cellW; cv.height=rows*cellH;
  const ctx = cv.getContext('2d');
  let css = `/* Sprite Sheet — generated by ToolKit Pro */\n.sprite { background-image: url('sprite.png'); background-repeat: no-repeat; }\n\n`;
  bitmaps.forEach((bm,i)=>{
    const col=i%cols, row=Math.floor(i/cols);
    const x=col*cellW, y=row*cellH;
    ctx.drawImage(bm,0,0,bm.width,bm.height,x,y,cellW,cellH);
    const name2=bn(toolFiles[i].name).replace(/[^a-zA-Z0-9]/g,'-').toLowerCase();
    css+=`.sprite-${name2} { background-position: -${x}px -${y}px; width: ${cellW}px; height: ${cellH}px; }\n`;
  });
  const imgBlob = await (await fetch(cv.toDataURL('image/png'))).blob();
  const cssBlob = new Blob([css],{type:'text/css'});
  showRes([{v:bitmaps.length+'',l:'Sprites'},{v:`${cv.width}×${cv.height}`,l:'Sheet size'},{v:`${cellW}×${cellH}`,l:'Cell size'}],[{name:'sprite.png',blob:imgBlob},{name:'sprite.css',blob:cssBlob}]);
  saveFile(imgBlob,'sprite.png'); saveFile(cssBlob,'sprite.css');
}
