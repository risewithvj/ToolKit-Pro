'use strict';
/* ══════════════════════════════════════
   PDF TOOLS — pdf.js
   19 tools, all using pdf-lib / pdfjs
══════════════════════════════════════ */

async function doCPdf() {
  await need('pdflib'); if (!toolFiles.length) return;
  const f = toolFiles[0]; setP(20, 'Loading PDF…');
  const doc = await PDFLib.PDFDocument.load(await readBuf(f), { ignoreEncryption: true });
  setP(60, 'Optimising…');
  const out = await doc.save({ useObjectStreams: true });
  const blob = new Blob([out], { type: 'application/pdf' });
  const pct = Math.max(0, Math.round((1 - blob.size / f.size) * 100));
  const name = bn(f.name) + '_compressed.pdf';
  showRes([{ v: fmtSz(f.size), l: 'Original' }, { v: fmtSz(blob.size), l: 'Compressed' }, { v: pct + '%', l: 'Saved' }, { v: doc.getPageCount() + '', l: 'Pages' }], [{ name, blob }]);
  saveFile(blob, name);
}

async function doMPdf() {
  await need('pdflib'); if (toolFiles.length < 2) { showErr('Upload at least 2 PDF files.'); return; }
  const merged = await PDFLib.PDFDocument.create(); let total = 0;
  for (let i = 0; i < toolFiles.length; i++) {
    setP(Math.round((i / toolFiles.length) * 90), `Merging ${toolFiles[i].name}…`);
    const doc = await PDFLib.PDFDocument.load(await readBuf(toolFiles[i]), { ignoreEncryption: true });
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach(p => merged.addPage(p)); total += pages.length;
  }
  const out = await merged.save(); const blob = new Blob([out], { type: 'application/pdf' });
  showRes([{ v: toolFiles.length + '', l: 'Files' }, { v: total + '', l: 'Pages' }, { v: fmtSz(blob.size), l: 'Size' }], [{ name: 'merged.pdf', blob }]);
  saveFile(blob, 'merged.pdf');
}

async function doSPdf() {
  await need('pdflib'); if (!toolFiles.length) return;
  const f = toolFiles[0]; const input = (gv('opt-pages') || 'all').trim().toLowerCase();
  setP(20, 'Loading…');
  const doc = await PDFLib.PDFDocument.load(await readBuf(f), { ignoreEncryption: true });
  const total = doc.getPageCount(); let idx = [];
  if (input === 'all') idx = Array.from({ length: total }, (_, i) => i);
  else input.split(',').forEach(p => {
    p = p.trim();
    if (p.includes('-')) { const [a, b] = p.split('-').map(x => parseInt(x) - 1); for (let i = a; i <= Math.min(b, total - 1); i++) idx.push(i); }
    else { const n = parseInt(p) - 1; if (n >= 0 && n < total) idx.push(n); }
  });
  if (!idx.length) { showErr(`No valid pages. PDF has ${total} pages.`); return; }
  setP(60, 'Extracting…');
  const nd = await PDFLib.PDFDocument.create(); const cp = await nd.copyPages(doc, idx); cp.forEach(p => nd.addPage(p));
  const out = await nd.save(); const blob = new Blob([out], { type: 'application/pdf' }); const name = bn(f.name) + '_extracted.pdf';
  showRes([{ v: total + '', l: 'Source' }, { v: idx.length + '', l: 'Extracted' }, { v: fmtSz(blob.size), l: 'Size' }], [{ name, blob }]);
  saveFile(blob, name);
}

async function doRotPdf() {
  await need('pdflib'); if (!toolFiles.length) return;
  const f = toolFiles[0]; const dir = gv('opt-angle') || '90° Clockwise';
  const deg = dir.includes('Counter') ? 270 : dir.includes('180') ? 180 : 90;
  setP(30, 'Loading…');
  const doc = await PDFLib.PDFDocument.load(await readBuf(f), { ignoreEncryption: true });
  doc.getPages().forEach(p => { const cur = p.getRotation().angle; p.setRotation(PDFLib.degrees((cur + deg) % 360)); });
  const out = await doc.save(); const blob = new Blob([out], { type: 'application/pdf' }); const name = bn(f.name) + '_rotated.pdf';
  showRes([{ v: doc.getPageCount() + '', l: 'Pages' }, { v: dir, l: 'Direction' }, { v: fmtSz(blob.size), l: 'Size' }], [{ name, blob }]);
  saveFile(blob, name);
}

async function doPtoJ() {
  await need('pdfjs'); await need('jszip'); if (!toolFiles.length) return;
  const f = toolFiles[0]; const scale = parseFloat(gv('opt-scale')) || 2; const quality = (parseFloat(gv('opt-quality')) || 92) / 100;
  setP(5, 'Loading PDF…');
  const pdf = await pdfjsLib.getDocument({ data: await readBuf(f) }).promise;
  const total = pdf.numPages; const zip = new JSZip(); const folder = zip.folder(bn(f.name));
  for (let i = 1; i <= total; i++) {
    setP(Math.round(5 + (i / total) * 80), `Rendering page ${i}/${total}…`);
    const page = await pdf.getPage(i); const vp = page.getViewport({ scale });
    const cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
    await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
    folder.file(`page_${String(i).padStart(3, '0')}.jpg`, cv.toDataURL('image/jpeg', quality).split(',')[1], { base64: true });
  }
  setP(92, 'Packing ZIP…');
  const zipBlob = await zip.generateAsync({ type: 'blob' }); const name = bn(f.name) + '_pages.zip';
  showRes([{ v: total + '', l: 'Pages' }, { v: scale + '×', l: 'Resolution' }, { v: fmtSz(zipBlob.size), l: 'ZIP' }], [{ name, blob: zipBlob }]);
  saveFile(zipBlob, name);
}

async function doJtoP() {
  await need('pdflib'); if (!toolFiles.length) return;
  const ps = gv('opt-pagesize') || 'A4 Portrait'; const mg = gv('opt-margin') || 'Medium';
  const mgMap = { None: 0, Small: 10, Medium: 20, Large: 40 }; const m = mgMap[mg.split(' ')[0]] || 20;
  let pw = 595, ph = 842;
  if (ps === 'A4 Landscape') { pw = 842; ph = 595; } else if (ps === 'Letter Portrait') { pw = 612; ph = 792; } else if (ps === 'Letter Landscape') { pw = 792; ph = 612; }
  const doc = await PDFLib.PDFDocument.create();
  for (let i = 0; i < toolFiles.length; i++) {
    setP(Math.round(10 + (i / toolFiles.length) * 85), `Embedding ${i + 1}/${toolFiles.length}…`);
    const buf = await readBuf(toolFiles[i]); let img;
    try { img = (toolFiles[i].type.includes('jpeg') || toolFiles[i].type.includes('jpg')) ? await doc.embedJpg(buf) : await doc.embedPng(buf); }
    catch { const bm = await createImageBitmap(toolFiles[i]); const cv = document.createElement('canvas'); cv.width = bm.width; cv.height = bm.height; cv.getContext('2d').drawImage(bm, 0, 0); const du = cv.toDataURL('image/jpeg', .92); img = await doc.embedJpg(await (await fetch(du)).arrayBuffer()); }
    const ppw = ps === 'Fit to Image' ? img.width : pw, pph = ps === 'Fit to Image' ? img.height : ph;
    const page = doc.addPage([ppw, pph]); const aw = ppw - m * 2, ah = pph - m * 2;
    const sc = Math.min(aw / img.width, ah / img.height, 1);
    page.drawImage(img, { x: m + (aw - img.width * sc) / 2, y: m + (ah - img.height * sc) / 2, width: img.width * sc, height: img.height * sc });
  }
  const out = await doc.save(); const blob = new Blob([out], { type: 'application/pdf' });
  const name = toolFiles.length === 1 ? bn(toolFiles[0].name) + '.pdf' : 'images_combined.pdf';
  showRes([{ v: toolFiles.length + '', l: 'Images' }, { v: doc.getPageCount() + '', l: 'Pages' }, { v: fmtSz(blob.size), l: 'Size' }], [{ name, blob }]);
  saveFile(blob, name);
}

async function doUPdf() {
  await need('pdflib'); if (!toolFiles.length) return;
  const f = toolFiles[0]; const pass = gv('opt-pass') || '';
  setP(20, 'Loading PDF…'); let doc;
  try { doc = await PDFLib.PDFDocument.load(await readBuf(f), { password: pass }); }
  catch { try { doc = await PDFLib.PDFDocument.load(await readBuf(f), { ignoreEncryption: true }); } catch { throw new Error('Could not unlock — check the password.'); } }
  setP(65, 'Creating clean copy…');
  const clean = await PDFLib.PDFDocument.create(); const pages = await clean.copyPages(doc, doc.getPageIndices()); pages.forEach(p => clean.addPage(p));
  const out = await clean.save(); const blob = new Blob([out], { type: 'application/pdf' }); const name = bn(f.name) + '_unlocked.pdf';
  showRes([{ v: 'Removed', l: 'Password' }, { v: doc.getPageCount() + '', l: 'Pages' }, { v: fmtSz(blob.size), l: 'Size' }], [{ name, blob }]);
  saveFile(blob, name);
}

async function doPtPdf() {
  await need('pdflib'); if (!toolFiles.length) return;
  const p1 = gv('opt-p1'), p2 = gv('opt-p2');
  if (!p1) throw new Error('Enter a password.'); if (p1 !== p2) throw new Error('Passwords do not match.'); if (p1.length < 4) throw new Error('Minimum 4 characters.');
  const f = toolFiles[0]; setP(30, 'Loading…');
  const doc = await PDFLib.PDFDocument.load(await readBuf(f), { ignoreEncryption: true }); setP(70, 'Encrypting…');
  const out = await doc.save({ userPassword: p1, ownerPassword: p1 + '_o', permissions: { printing: gk('opt-noPrint') ? 'none' : 'highResolution', copying: !gk('opt-noCopy'), modifying: false, annotating: true, fillingForms: true, documentAssembly: false } });
  const blob = new Blob([out], { type: 'application/pdf' }); const name = bn(f.name) + '_protected.pdf';
  showRes([{ v: 'Set', l: 'Password' }, { v: doc.getPageCount() + '', l: 'Pages' }, { v: fmtSz(blob.size), l: 'Size' }], [{ name, blob }]);
  saveFile(blob, name);
}

async function doPN() {
  await need('pdflib'); if (!toolFiles.length) return;
  const f = toolFiles[0]; const pos = gv('opt-pos') || 'Bottom Centre'; const start = parseInt(gv('opt-start')) || 1; const prefix = gv('opt-prefix') || '';
  setP(20, 'Loading…');
  const doc = await PDFLib.PDFDocument.load(await readBuf(f), { ignoreEncryption: true });
  const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica); const pages = doc.getPages();
  pages.forEach((page, i) => {
    const { width, height } = page.getSize(); const num = prefix + (start + i); const fs = 10; const tw = font.widthOfTextAtSize(num, fs); const pad = 22;
    let x, y;
    if (pos === 'Bottom Centre') { x = (width - tw) / 2; y = pad; } else if (pos === 'Bottom Right') { x = width - tw - pad; y = pad; } else if (pos === 'Bottom Left') { x = pad; y = pad; } else if (pos === 'Top Centre') { x = (width - tw) / 2; y = height - pad - fs; } else { x = width - tw - pad; y = height - pad - fs; }
    page.drawText(num, { x, y, size: fs, font, color: PDFLib.rgb(.35, .35, .45), opacity: .9 });
  });
  const out = await doc.save(); const blob = new Blob([out], { type: 'application/pdf' }); const name = bn(f.name) + '_numbered.pdf';
  showRes([{ v: pages.length + '', l: 'Pages' }, { v: pos, l: 'Position' }], [{ name, blob }]);
  saveFile(blob, name);
}

async function doStamp() {
  await need('pdflib'); if (!toolFiles.length) return;
  const f = toolFiles[0]; const text = (gv('opt-text') || 'CONFIDENTIAL').toUpperCase();
  const opacity = gn('opt-opacity') / 100 || .15;
  const cMap = { Red: PDFLib.rgb(.85, .1, .1), Blue: PDFLib.rgb(.1, .1, .85), Grey: PDFLib.rgb(.5, .5, .5), Black: PDFLib.rgb(0, 0, 0), Green: PDFLib.rgb(.1, .7, .2) };
  const color = cMap[gv('opt-color')] || cMap.Red; setP(20, 'Loading…');
  const doc = await PDFLib.PDFDocument.load(await readBuf(f), { ignoreEncryption: true });
  const font = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
  doc.getPages().forEach(page => { const { width, height } = page.getSize(); const fs = Math.min(width, height) * .1; const tw = font.widthOfTextAtSize(text, fs); page.drawText(text, { x: (width - tw) / 2, y: (height + font.heightAtSize(fs)) / 2, size: fs, font, color, opacity, rotate: PDFLib.degrees(-35) }); });
  const out = await doc.save(); const blob = new Blob([out], { type: 'application/pdf' }); const name = bn(f.name) + '_stamped.pdf';
  showRes([{ v: doc.getPageCount() + '', l: 'Pages' }, { v: '"' + text + '"', l: 'Stamp' }], [{ name, blob }]);
  saveFile(blob, name);
}

async function doPInfo() {
  await need('pdflib'); if (!toolFiles.length) return;
  const f = toolFiles[0]; setP(40, 'Analysing…');
  const doc = await PDFLib.PDFDocument.load(await readBuf(f), { ignoreEncryption: true }); const pages = doc.getPages();
  let r = `PDF Inspector\n${'─'.repeat(36)}\nFile: ${f.name}\nSize: ${fmtSz(f.size)}\nPages: ${pages.length}\n`;
  ['Title', 'Author', 'Subject', 'Keywords', 'Creator', 'Producer'].forEach(k => { try { const v = doc['get' + k](); if (v) r += `${k}: ${v}\n`; } catch {} });
  try { const d = doc.getCreationDate(); if (d) r += `Created: ${d.toLocaleDateString()}\n`; } catch {}
  if (pages.length) { const { width, height } = pages[0].getSize(); r += `Page Size: ${Math.round(width)}×${Math.round(height)}pt\n`; }
  showTO(r); const blob = new Blob([r], { type: 'text/plain' });
  showRes([{ v: pages.length + '', l: 'Pages' }, { v: fmtSz(f.size), l: 'File size' }], [{ name: bn(f.name) + '_info.txt', blob }]);
}

async function doDelP() {
  await need('pdflib'); if (!toolFiles.length) return;
  const f = toolFiles[0]; const input = (gv('opt-pages') || '').trim(); if (!input) throw new Error('Enter page numbers to delete.');
  setP(20, 'Loading…');
  const doc = await PDFLib.PDFDocument.load(await readBuf(f), { ignoreEncryption: true }); const total = doc.getPageCount(); const del = new Set();
  input.split(',').forEach(p => { p = p.trim(); if (p.includes('-')) { const [a, b] = p.split('-').map(x => parseInt(x) - 1); for (let i = a; i <= Math.min(b, total - 1); i++) del.add(i); } else { const n = parseInt(p) - 1; if (n >= 0 && n < total) del.add(n); } });
  const keep = Array.from({ length: total }, (_, i) => i).filter(i => !del.has(i)); if (!keep.length) throw new Error('Cannot delete all pages.');
  const nd = await PDFLib.PDFDocument.create(); const cp = await nd.copyPages(doc, keep); cp.forEach(p => nd.addPage(p));
  const out = await nd.save(); const blob = new Blob([out], { type: 'application/pdf' }); const name = bn(f.name) + '_deleted.pdf';
  showRes([{ v: total + '', l: 'Original' }, { v: del.size + '', l: 'Deleted' }, { v: keep.length + '', l: 'Remaining' }], [{ name, blob }]);
  saveFile(blob, name);
}

async function doDupP() {
  await need('pdflib'); if (!toolFiles.length) return;
  const f = toolFiles[0]; const pg = parseInt(gv('opt-pagenum')) || 1; const copies = parseInt(gv('opt-copies')) || 2;
  setP(20, 'Loading…');
  const doc = await PDFLib.PDFDocument.load(await readBuf(f), { ignoreEncryption: true }); const total = doc.getPageCount();
  if (pg < 1 || pg > total) throw new Error(`Page ${pg} doesn't exist. PDF has ${total} pages.`);
  const nd = await PDFLib.PDFDocument.create(); const cp = await nd.copyPages(doc, doc.getPageIndices());
  cp.forEach((p, i) => { nd.addPage(p); if (i === pg - 1) for (let c = 1; c < copies; c++) nd.addPage(cp[pg - 1]); });
  const out = await nd.save(); const blob = new Blob([out], { type: 'application/pdf' }); const name = bn(f.name) + '_dup.pdf';
  showRes([{ v: total + '', l: 'Original' }, { v: nd.getPageCount() + '', l: 'New total' }, { v: copies + '×', l: 'Copies' }], [{ name, blob }]);
  saveFile(blob, name);
}

async function doReOrd() {
  await need('pdflib'); if (!toolFiles.length) return;
  const f = toolFiles[0]; const orderStr = (gv('opt-order') || '').trim(); if (!orderStr) throw new Error('Enter the new page order.');
  setP(20, 'Loading…');
  const doc = await PDFLib.PDFDocument.load(await readBuf(f), { ignoreEncryption: true }); const total = doc.getPageCount();
  const indices = orderStr.split(',').map(x => parseInt(x.trim()) - 1);
  if (indices.some(i => i < 0 || i >= total)) throw new Error(`Invalid page number. PDF has ${total} pages.`);
  const nd = await PDFLib.PDFDocument.create(); const cp = await nd.copyPages(doc, indices); cp.forEach(p => nd.addPage(p));
  const out = await nd.save(); const blob = new Blob([out], { type: 'application/pdf' }); const name = bn(f.name) + '_reordered.pdf';
  showRes([{ v: total + '', l: 'Source' }, { v: nd.getPageCount() + '', l: 'Output' }], [{ name, blob }]);
  saveFile(blob, name);
}

async function doPHF() {
  await need('pdflib'); if (!toolFiles.length) return;
  const f = toolFiles[0]; const hdr = gv('opt-header'), ftr = gv('opt-footer') || 'Page {page}'; const align = gv('opt-align') || 'Centre';
  if (!hdr && !ftr) throw new Error('Enter header or footer text.'); setP(20, 'Loading…');
  const doc = await PDFLib.PDFDocument.load(await readBuf(f), { ignoreEncryption: true });
  const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica); const today = new Date().toLocaleDateString(); const fs = 10;
  doc.getPages().forEach((page, i) => {
    const { width, height } = page.getSize(); const num = String(i + 1);
    const parse = t => t.replace(/{page}/g, num).replace(/{date}/g, today);
    const getX = t => { const tw = font.widthOfTextAtSize(t, fs); return align === 'Centre' ? (width - tw) / 2 : align === 'Right' ? width - tw - 24 : 24; };
    if (hdr) { const t = parse(hdr); page.drawText(t, { x: getX(t), y: height - fs - 10, size: fs, font, color: PDFLib.rgb(.4, .4, .4) }); }
    if (ftr) { const t = parse(ftr); page.drawText(t, { x: getX(t), y: 14, size: fs, font, color: PDFLib.rgb(.4, .4, .4) }); }
  });
  const out = await doc.save(); const blob = new Blob([out], { type: 'application/pdf' }); const name = bn(f.name) + '_hf.pdf';
  showRes([{ v: doc.getPageCount() + '', l: 'Pages' }, { v: hdr ? 'Yes' : 'No', l: 'Header' }, { v: ftr ? 'Yes' : 'No', l: 'Footer' }], [{ name, blob }]);
  saveFile(blob, name);
}

async function doFlat() {
  await need('pdflib'); if (!toolFiles.length) return;
  const f = toolFiles[0]; setP(30, 'Loading…');
  const doc = await PDFLib.PDFDocument.load(await readBuf(f), { ignoreEncryption: true });
  try { doc.getForm().flatten(); } catch {}
  const out = await doc.save(); const blob = new Blob([out], { type: 'application/pdf' }); const name = bn(f.name) + '_flat.pdf';
  showRes([{ v: 'Done', l: 'Flattened' }, { v: doc.getPageCount() + '', l: 'Pages' }, { v: fmtSz(blob.size), l: 'Size' }], [{ name, blob }]);
  saveFile(blob, name);
}

async function doPThumb() {
  await need('pdfjs'); await need('jszip'); if (!toolFiles.length) return;
  const f = toolFiles[0]; const scaleSel = gv('opt-scale') || 'Medium (1×)';
  const scale = { 'Small (0.5×)': .5, 'Medium (1×)': 1, 'Large (1.5×)': 1.5 }[scaleSel] || 1;
  setP(5, 'Loading…');
  const pdf = await pdfjsLib.getDocument({ data: await readBuf(f) }).promise;
  const total = pdf.numPages; const zip = new JSZip(); const folder = zip.folder(bn(f.name));
  for (let i = 1; i <= total; i++) {
    setP(Math.round(5 + (i / total) * 85), `Rendering ${i}/${total}…`);
    const page = await pdf.getPage(i); const vp = page.getViewport({ scale });
    const cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
    await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
    folder.file(`thumb_${String(i).padStart(3, '0')}.jpg`, cv.toDataURL('image/jpeg', .85).split(',')[1], { base64: true });
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' }); const name = bn(f.name) + '_thumbs.zip';
  showRes([{ v: total + '', l: 'Thumbnails' }, { v: scale + '×', l: 'Scale' }, { v: fmtSz(zipBlob.size), l: 'ZIP' }], [{ name, blob: zipBlob }]);
  saveFile(zipBlob, name);
}

async function doPCsv() {
  await need('pdfjs'); if (!toolFiles.length) return;
  const f = toolFiles[0]; const sep = (gv('opt-separator') || '').includes('Semi') ? ';' : (gv('opt-separator') || '').includes('Tab') ? '\t' : ',';
  setP(10, 'Loading…');
  const pdf = await pdfjsLib.getDocument({ data: await readBuf(f) }).promise; let rows = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    setP(Math.round(10 + (i / pdf.numPages) * 80), `Page ${i}/${pdf.numPages}…`);
    const page = await pdf.getPage(i); const c = await page.getTextContent();
    const yMap = {}; c.items.forEach(item => { const y = Math.round(item.transform[5]); if (!yMap[y]) yMap[y] = []; yMap[y].push(item.str); });
    Object.keys(yMap).sort((a, b) => b - a).forEach(y => { const row = yMap[y].join(sep); if (row.trim()) rows.push(row); });
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' }); const name = bn(f.name) + '.csv';
  showRes([{ v: rows.length + '', l: 'Rows' }, { v: pdf.numPages + '', l: 'Pages' }, { v: fmtSz(blob.size), l: 'CSV' }], [{ name, blob }]);
  saveFile(blob, name);
}

async function doPBM() {
  await need('pdflib'); if (!toolFiles.length) return;
  const f = toolFiles[0]; const bmText = gv('opt-bookmarks') || ''; if (!bmText.trim()) throw new Error('Enter at least one bookmark.');
  setP(20, 'Loading…');
  const doc = await PDFLib.PDFDocument.load(await readBuf(f), { ignoreEncryption: true });
  const total = doc.getPageCount(); const pages = doc.getPages();
  const bms = bmText.trim().split('\n').map(l => { const p = l.lastIndexOf(':'); return { title: l.substring(0, p).trim(), page: parseInt(l.substring(p + 1).trim()) - 1 }; }).filter(b => b.title && b.page >= 0 && b.page < total);
  if (!bms.length) throw new Error('No valid bookmarks. Use "Title: PageNumber".');
  try { bms.forEach(b => { try { doc.addBookmark(b.title, pages[b.page]); } catch {} }); } catch {}
  const out = await doc.save(); const blob = new Blob([out], { type: 'application/pdf' }); const name = bn(f.name) + '_bookmarked.pdf';
  showRes([{ v: bms.length + '', l: 'Bookmarks' }, { v: total + '', l: 'Pages' }], [{ name, blob }]);
  saveFile(blob, name);
}

async function doPToWord() {
  if (!toolFiles.length) { showErr('Upload a PDF file first.'); return; }

  const file = toolFiles[0];
  if (!/\.pdf$/i.test(file.name)) { showErr('Only PDF files are supported.'); return; }

  try {
    setP(15, 'Uploading file to local conversion engine…');
    const formData = new FormData();
    formData.append('file', file, file.name);

    const res = await fetch('http://127.0.0.1:8000/api/pdf-to-word', {
      method: 'POST',
      body: formData
    });

    setP(62, 'Parsing layout, fonts, text blocks, and movable objects…');

    if (!res.ok) {
      let detail = `Request failed (${res.status})`;
      try {
        const payload = await res.json();
        if (payload?.detail) detail = payload.detail;
      } catch {}
      throw new Error(detail);
    }

    setP(88, 'Downloading generated editable Word document…');
    const blob = await res.blob();

    const failedPages = (res.headers.get('X-Conversion-Failed-Pages') || '').trim();
    const outputName = bn(file.name) + '_editable.docx';
    showRes([
      { v: 'FastAPI + pdf2docx', l: 'Engine' },
      { v: fmtSz(file.size), l: 'Source' },
      { v: fmtSz(blob.size), l: 'DOCX Size' },
      { v: 'Editable', l: 'Output Type' },
      { v: failedPages ? failedPages : 'None', l: 'Image fallback pages' }
    ], [{ name: outputName, blob }]);

    if (failedPages) showErr('Some pages were too complex for full text reconstruction. Fallback image pages: ' + failedPages);
    saveFile(blob, outputName);
    setP(100, 'Done.');
  } catch (err) {
    showErr('PDF → Word conversion failed: ' + (err?.message || err));
    throw err;
  }
}
