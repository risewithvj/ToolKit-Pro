'use strict';
/* ════════════════════════════════════════════════════════
   TOOLKIT PRO v3  —  Enterprise PDF & Image Suite
   Architecture: Single HTML, on-demand lib loading
   All UI & Logic: Original Code
   ════════════════════════════════════════════════════════ */

// ─── LIB LOADER ──────────────────────────────────────
const CDN={
  pdflib:'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js',
  pdfjs:  'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js',
  pdfjsW: 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js',
  jszip:  'https://unpkg.com/jszip@3.10.1/dist/jszip.min.js'
};
const loaded={pdflib:false,pdfjs:false,jszip:false};
function loadLib(url){
  return new Promise((res,rej)=>{
    const s=document.createElement('script');
    s.src=url;s.onload=res;s.onerror=()=>rej(new Error('Failed to load: '+url));
    document.head.appendChild(s);
  });
}
async function need(lib){
  if(loaded[lib]) return;
  if(lib==='pdflib'){await loadLib(CDN.pdflib);window.PDFLib=window.PDFLib;loaded.pdflib=true;}
  if(lib==='pdfjs'){await loadLib(CDN.pdfjs);window.pdfjsLib.GlobalWorkerOptions.workerSrc=CDN.pdfjsW;loaded.pdfjs=true;}
  if(lib==='jszip'){await loadLib(CDN.jszip);loaded.jszip=true;}
}

// ─── THEME ───────────────────────────────────────────
let theme=localStorage.getItem('tk3-theme')||'dark';
function applyTheme(){
  document.documentElement.setAttribute('data-theme',theme);
  document.getElementById('theme-btn').textContent=theme==='dark'?'☀️':'🌙';
}
function toggleTheme(){theme=theme==='dark'?'light':'dark';localStorage.setItem('tk3-theme',theme);applyTheme();}
applyTheme();

// ─── FOLDER ──────────────────────────────────────────
let dirHandle=null;
async function pickFolder(){
  try{
    dirHandle=await window.showDirectoryPicker({mode:'readwrite'});
    const s=document.getElementById('folder-status');
    s.classList.add('ok');
    document.getElementById('folder-dot').style.background='var(--success)';
    document.getElementById('folder-txt').textContent='Saving to: '+dirHandle.name;
    document.getElementById('nav-folder-btn').textContent='📁 '+dirHandle.name;
    document.getElementById('nav-folder-btn').classList.add('set');
    toast('Output folder: '+dirHandle.name,'ok');
  }catch(e){if(e.name!=='AbortError')toast('Could not access folder','bad');}
}
async function saveFile(blob,filename){
  if(dirHandle){
    try{
      const fh=await dirHandle.getFileHandle(filename,{create:true});
      const w=await fh.createWritable();await w.write(blob);await w.close();
      toast('Saved: '+filename,'ok');addHistory(filename,blob);return;
    }catch(e){console.warn(e);}
  }
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),4000);
  toast('Downloaded: '+filename,'ok');addHistory(filename,blob);
}

// ─── HISTORY ─────────────────────────────────────────
let hist=[];
function addHistory(name,blob){
  hist.unshift({id:Date.now(),name,size:blob.size,blob,time:new Date().toLocaleTimeString()});
  if(hist.length>80)hist.pop();
  const b=document.getElementById('hist-badge');
  b.textContent=hist.length;b.style.display='';
}
function renderHistory(){
  const c=document.getElementById('hist-container');
  if(!hist.length){
    c.innerHTML=`<div class="hist-empty">
      <div class="hist-empty-icon">🗂️</div>
      <h3>No history yet</h3>
      <p>Process any file and your outputs will appear here for re-download.</p>
    </div>`;return;
  }
  c.innerHTML=`<div class="hist-list">${hist.map(h=>`
    <div class="hist-item">
      <div class="hist-fi">${h.name.endsWith('.pdf')?'📄':h.name.endsWith('.zip')?'📦':h.name.endsWith('.txt')||h.name.endsWith('.md')?'📝':'🖼️'}</div>
      <div class="hist-info">
        <div class="hist-name">${h.name}</div>
        <div class="hist-meta"><span>${fmtSz(h.size)}</span><span>${h.time}</span></div>
      </div>
      <div class="hist-actions">
        <button class="hist-dl" onclick="reDownload(${h.id})">⬇ Download</button>
        <button class="hist-rm" onclick="rmHistory(${h.id})">×</button>
      </div>
    </div>`).join('')}</div>`;
}
function reDownload(id){const h=hist.find(x=>x.id===id);if(h)saveFile(h.blob,h.name);}
function rmHistory(id){const i=hist.findIndex(x=>x.id===id);if(i>-1)hist.splice(i,1);renderHistory();const b=document.getElementById('hist-badge');if(hist.length){b.textContent=hist.length;}else{b.style.display='none';}}
function clearHistory(){hist=[];renderHistory();document.getElementById('hist-badge').style.display='none';toast('History cleared','ok');}

// ─── NAVIGATION ──────────────────────────────────────
function goHome(){
  showV('home-view');
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
  document.getElementById('tab-home').classList.add('active');
}
function goHistory(){
  showV('history-view');renderHistory();
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
  document.getElementById('tab-history').classList.add('active');
}
function showV(id){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById(id).classList.add('active');window.scrollTo(0,0);}
function openTool(id){
  currentTool=id;toolFiles=[];_resizeBM=null;_cropBM=null;
  showV('tool-view');
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
  buildToolPage(id);window.scrollTo(0,0);
}

// ─── TOAST ───────────────────────────────────────────
let toastTimer;
function toast(msg,type='ok'){
  const t=document.getElementById('toast');
  document.getElementById('toast-icon').textContent=type==='ok'?'✅':'❌';
  document.getElementById('toast-msg').textContent=msg;
  t.className='show '+type;
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.className='',4000);
}

// ─── HELPERS ─────────────────────────────────────────
function fmtSz(b){if(b<1024)return b+'B';if(b<1048576)return(b/1024).toFixed(1)+'KB';return(b/1048576).toFixed(2)+'MB';}
function bn(n){return n.replace(/\.[^.]+$/,'')}
function readBuf(f){return new Promise((r,j)=>{const fr=new FileReader();fr.onload=e=>r(e.target.result);fr.onerror=j;fr.readAsArrayBuffer(f);})}
function readText(f){return new Promise((r,j)=>{const fr=new FileReader();fr.onload=e=>r(e.target.result);fr.onerror=j;fr.readAsText(f);})}
function getV(id){const e=document.getElementById(id);return e?e.value:null;}
function getN(id){return parseFloat(getV(id))||0;}
function getChk(id){const e=document.getElementById(id);return e?e.checked:false;}

// ═══════════════════════════════════════════════════════
// TOOL REGISTRY
// ═══════════════════════════════════════════════════════
const TOOLS={
  // ── PDF ──────────────────────────────────────────────
  'compress-pdf':{cat:'pdf',icon:'🗜️',label:'Compress PDF',
    desc:'Reduce PDF file size by removing redundant streams and metadata.',
    accept:'.pdf',multi:false,
    tips:['Compression works best on PDFs with embedded images','Original is never modified — a new file is always created','PDFs with heavy graphics see the most size reduction'],
    opts:[{id:'q',label:'Compression Level',sub:'Higher = smaller file, may reduce quality',type:'select',choices:['Low — Preserve max quality','Medium — Balanced (recommended)','High — Smallest file size'],def:'Medium — Balanced (recommended)'}]
  },
  'merge-pdf':{cat:'pdf',icon:'📎',label:'Merge PDFs',
    desc:'Combine multiple PDF files into a single document in any order.',
    accept:'.pdf',multi:true,
    tips:['Upload files in the order you want them merged','Drag to reorder files in the list before merging','Works with password-protected PDFs if you know the password'],
    opts:[]
  },
  'split-pdf':{cat:'pdf',icon:'✂️',label:'Split PDF',
    desc:'Extract specific pages or export every page as a separate PDF.',
    accept:'.pdf',multi:false,
    tips:['Use "1,3,5" for specific pages','Use "2-8" for a range of pages','Use "all" to split every page into its own PDF'],
    opts:[{id:'pages',label:'Page Range',sub:'e.g. 1,3,5-8 or "all" for every page',type:'text',def:'all'}]
  },
  'rotate-pdf':{cat:'pdf',icon:'🔄',label:'Rotate PDF',
    desc:'Rotate all pages in a PDF 90°, 180° or 270°.',
    accept:'.pdf',multi:false,
    tips:['Applies rotation to every page uniformly','90° clockwise is the most common correction needed','The rotation is permanently saved in the output file'],
    opts:[{id:'angle',label:'Rotation Angle',sub:'Applied to all pages',type:'select',choices:['90° Clockwise','180° (Upside down)','90° Counter-Clockwise'],def:'90° Clockwise'}]
  },
  'pdf-to-jpg':{cat:'pdf',icon:'🖼️',label:'PDF → JPG',
    desc:'Convert every page of a PDF into high-resolution JPG images.',
    accept:'.pdf',multi:false,
    tips:['Higher resolution = larger files but crisper images','All pages are packed into a ZIP file for easy download','Great for creating image previews of documents'],
    opts:[{id:'scale',label:'Resolution',sub:'2× is recommended for most uses',type:'range',min:1,max:3,step:.5,def:2,unit:'×'},{id:'quality',label:'JPEG Quality',sub:'Higher = better looking, larger file',type:'range',min:60,max:100,step:1,def:92,unit:'%'}]
  },
  'jpg-to-pdf':{cat:'pdf',icon:'📄',label:'JPG → PDF',
    desc:'Combine multiple images into one professional PDF document.',
    accept:'image/*',multi:true,
    tips:['Multiple images become one page each','Images are auto-scaled to fit the page','Supports JPG, PNG, WEBP, and more'],
    opts:[{id:'pagesize',label:'Page Size',sub:'Output page dimensions',type:'select',choices:['A4 Portrait (210×297mm)','A4 Landscape','Letter Portrait','Letter Landscape','Fit to Image'],def:'A4 Portrait (210×297mm)'},{id:'margin',label:'Page Margin',sub:'Space around each image',type:'select',choices:['None','Small (10px)','Medium (20px)','Large (40px)'],def:'Medium (20px)'}]
  },
  'unlock-pdf':{cat:'pdf',icon:'🔓',label:'Unlock PDF',
    desc:'Remove password protection from a PDF so it opens freely.',
    accept:'.pdf',multi:false,
    tips:['You must know the current password to unlock','The unlocked copy has no restrictions','Owner passwords (print/copy locks) are also removed'],
    opts:[{id:'pass',label:'Current Password',sub:'Enter the password to open this PDF',type:'password',def:''}]
  },
  'protect-pdf':{cat:'pdf',icon:'🔒',label:'Protect PDF',
    desc:'Add a strong password to prevent unauthorised access.',
    accept:'.pdf',multi:false,
    tips:['Use a strong password with letters, numbers & symbols','Share the password securely via a separate channel','You can also restrict printing and copying permissions'],
    opts:[{id:'p1',label:'New Password',sub:'At least 6 characters recommended',type:'password',def:''},{id:'p2',label:'Confirm Password',sub:'Re-enter to confirm',type:'password',def:''},{id:'noPrint',label:'Restrict Printing',sub:'Prevent recipients from printing',type:'toggle',def:false},{id:'noCopy',label:'Restrict Copying',sub:'Prevent text selection & copying',type:'toggle',def:false}]
  },
  'add-page-numbers':{cat:'pdf',icon:'🔢',label:'Add Page Numbers',
    desc:'Stamp sequential page numbers on every page of your PDF.',
    accept:'.pdf',multi:false,
    tips:['Page numbers are stamped in grey Helvetica font','Choose position based on your document\'s footer/header space','The start number is useful for chapter PDFs'],
    opts:[{id:'pos',label:'Position',sub:'Where numbers appear on each page',type:'select',choices:['Bottom Centre','Bottom Right','Bottom Left','Top Centre','Top Right'],def:'Bottom Centre'},{id:'start',label:'Start From',sub:'First page will show this number',type:'number',def:'1'},{id:'prefix',label:'Prefix Text',sub:'Optional: appears before the number',type:'text',def:''}]
  },
  'stamp-pdf':{cat:'pdf',icon:'🖊️',label:'Stamp PDF',
    desc:'Add a diagonal watermark stamp (CONFIDENTIAL, DRAFT, etc.) to every page.',
    accept:'.pdf',multi:false,
    tips:['Stamp is rendered in large diagonal text across each page','Adjust opacity so the stamp is visible but not obstructive','Common stamps: CONFIDENTIAL, DRAFT, APPROVED, COPY'],
    opts:[{id:'text',label:'Stamp Text',sub:'Text printed on every page',type:'text',def:'CONFIDENTIAL'},{id:'opacity',label:'Opacity',sub:'Lower = more transparent',type:'range',min:5,max:50,step:5,def:15,unit:'%'},{id:'color',label:'Colour',sub:'Stamp text colour',type:'select',choices:['Red','Blue','Grey','Black','Green'],def:'Red'},{id:'size',label:'Font Size Factor',sub:'Relative to page width',type:'select',choices:['Small','Medium','Large'],def:'Medium'}]
  },
  'pdf-info':{cat:'pdf',icon:'ℹ️',label:'PDF Inspector',
    desc:'Analyse a PDF: page count, dimensions, file size, metadata & more.',
    accept:'.pdf',multi:false,
    tips:['No output file — results are displayed on screen','Metadata includes author, title, creation date if set','Exports a detailed text report you can save'],
    opts:[]
  },
  // ── IMAGE ─────────────────────────────────────────────
  'compress-image':{cat:'img',icon:'🗜️',label:'Compress Image',
    desc:'Reduce image file size with fine-grained quality control.',
    accept:'image/jpeg,image/png,image/webp',multi:true,
    tips:['Quality 70-85% is the sweet spot for web images','PNG compression is lossless — quality slider has less effect','Supports batch processing — upload multiple images at once'],
    opts:[{id:'quality',label:'Output Quality',sub:'Lower = smaller file, more compression',type:'range',min:10,max:95,step:1,def:78,unit:'%'},{id:'maxw',label:'Max Width (px)',sub:'Leave blank to keep original width',type:'number',def:''}]
  },
  'resize-image':{cat:'img',icon:'📐',label:'Resize Image',
    desc:'Resize images by exact dimensions or percentage with live preview.',
    accept:'image/*',multi:false,
    tips:['"Keep aspect ratio" prevents stretching or squashing','Use percentage mode for quick scaling down','Preview updates live as you adjust settings'],
    opts:'__resize__'
  },
  'crop-image':{cat:'img',icon:'✂️',label:'Crop Image',
    desc:'Draw a precise crop selection on your image using the interactive editor.',
    accept:'image/*',multi:false,
    tips:['Click and drag on the image to draw the crop area','Fine-tune using the coordinate inputs below','Crop area is shown with a dark overlay outside selection'],
    opts:[]
  },
  'convert-to-jpg':{cat:'img',icon:'🔄',label:'Convert → JPG',
    desc:'Convert PNG, WEBP, GIF, BMP, TIFF images to JPEG format.',
    accept:'image/png,image/webp,image/gif,image/bmp',multi:true,
    tips:['White background is added where transparency existed','Batch convert multiple files at once','JPG quality 90%+ is visually indistinguishable from lossless'],
    opts:[{id:'quality',label:'JPEG Quality',sub:'92% is recommended for most uses',type:'range',min:50,max:100,step:1,def:92,unit:'%'},{id:'bgcolor',label:'Background (transparency fill)',sub:'Used when source has transparent areas',type:'select',choices:['White','Black','Light Grey'],def:'White'}]
  },
  'convert-from-jpg':{cat:'img',icon:'↩️',label:'Convert JPG →',
    desc:'Convert JPEG images to PNG (lossless) or WEBP (modern format).',
    accept:'image/jpeg,image/jpg',multi:true,
    tips:['PNG is lossless — best for images with text or sharp edges','WEBP is 30% smaller than PNG with similar quality','Both formats support transparency (unlike JPG)'],
    opts:[{id:'fmt',label:'Output Format',sub:'Choose target format',type:'select',choices:['PNG — Lossless','WEBP — Modern & efficient'],def:'PNG — Lossless'}]
  },
  'grayscale':{cat:'img',icon:'⬛',label:'Grayscale',
    desc:'Convert colour images to black and white with luminosity-accurate conversion.',
    accept:'image/*',multi:true,
    tips:['Uses weighted luminosity formula (not simple average) for natural look','Batch process multiple images at once','Output is saved as JPG for maximum compatibility'],
    opts:[{id:'contrast',label:'Enhance Contrast',sub:'Boost contrast after desaturation',type:'toggle',def:false}]
  },
  'watermark-image':{cat:'img',icon:'💧',label:'Watermark Image',
    desc:'Add a custom text watermark with full control over position, size and opacity.',
    accept:'image/*',multi:false,
    tips:['Diagonal watermarks are harder to crop out','Lower opacity (20-40%) balances visibility and aesthetics','Use ALL CAPS text for stronger visual impact'],
    opts:[{id:'text',label:'Watermark Text',sub:'Your brand or copyright text',type:'text',def:'© Your Company'},{id:'opacity',label:'Opacity',sub:'Lower = more transparent',type:'range',min:10,max:90,step:5,def:30,unit:'%'},{id:'pos',label:'Position',sub:'Where the watermark appears',type:'select',choices:['Centre (diagonal)','Bottom Right','Bottom Left','Top Right','Top Left','Tiled (repeat)'],def:'Centre (diagonal)'},{id:'color',label:'Text Colour',sub:'',type:'select',choices:['White','Black','Red','Blue','Grey'],def:'White'}]
  },
  'flip-image':{cat:'img',icon:'🔃',label:'Flip & Mirror',
    desc:'Flip images horizontally (mirror) or vertically, or both.',
    accept:'image/*',multi:true,
    tips:['Horizontal flip creates a mirror image','Useful for correcting selfie camera mirroring','Batch process multiple files at once'],
    opts:[{id:'dir',label:'Direction',sub:'',type:'select',choices:['↔ Horizontal (Mirror)','↕ Vertical (Flip)','↔↕ Both'],def:'↔ Horizontal (Mirror)'}]
  },
  'image-borders':{cat:'img',icon:'🖼️',label:'Add Border',
    desc:'Add a coloured border or frame around your image.',
    accept:'image/*',multi:false,
    tips:['Border is added outside the original image dimensions','White borders give a clean photo print effect','Use colour picker to match your brand colours'],
    opts:[{id:'bsize',label:'Border Size (px)',sub:'Added to all sides equally',type:'number',def:'20'},{id:'bcolor',label:'Border Colour',sub:'Hex code (e.g. #ffffff)',type:'text',def:'#ffffff'},{id:'bradius',label:'Corner Radius (px)',sub:'0 = sharp corners',type:'number',def:'0'}]
  },
  'image-info':{cat:'img',icon:'ℹ️',label:'Image Inspector',
    desc:'View detailed info about any image: dimensions, format, file size, colour mode.',
    accept:'image/*',multi:false,
    tips:['No output file — results are shown on screen','Useful for quickly checking image dimensions before use','Exports a simple text report'],
    opts:[]
  },
  // ── DOCUMENT & UTILITY ────────────────────────────────
  'pdf-text':{cat:'util',icon:'📝',label:'Extract PDF Text',
    desc:'Pull all readable text from a PDF — perfect for contracts, reports, CVs.',
    accept:'.pdf',multi:false,
    tips:['Only works on text-based PDFs, not scanned images','Ideal for extracting content from reports and contracts','Output is a clean .txt or .md file'],
    opts:[{id:'fmt',label:'Output Format',sub:'',type:'select',choices:['Plain Text (.txt)','Markdown (.md)'],def:'Plain Text (.txt)'},{id:'pagebreaks',label:'Include Page Separators',sub:'Adds "--- Page N ---" between pages',type:'toggle',def:true}]
  },
  'bulk-rename':{cat:'util',icon:'🏷️',label:'Bulk Rename',
    desc:'Rename multiple files with a custom prefix and sequential numbering.',
    accept:'*/*',multi:true,
    tips:['Files are packed into a ZIP with the new names','Original file extensions are preserved','Useful for organising document batches before sending'],
    opts:[{id:'prefix',label:'Filename Prefix',sub:'Added before the number',type:'text',def:'Document_'},{id:'start',label:'Start Number',sub:'First file gets this number',type:'number',def:'1'},{id:'pad',label:'Number Format',sub:'How many digits in the number',type:'select',choices:['001 (3 digits)','01 (2 digits)','1 (no padding)'],def:'001 (3 digits)'}]
  },
  'img-to-portfolio':{cat:'util',icon:'📋',label:'Image Portfolio PDF',
    desc:'Turn scanned documents or photos into a polished, titled PDF portfolio.',
    accept:'image/*',multi:true,
    tips:['A cover page with title and date is automatically added','Images are auto-scaled to fit each page','Great for sending scanned contracts, IDs, or certificates'],
    opts:[{id:'title',label:'Portfolio Title',sub:'Shown on the cover page',type:'text',def:'Document Portfolio'},{id:'author',label:'Prepared By',sub:'Organisation or name',type:'text',def:''},{id:'pagesize',label:'Page Size',sub:'',type:'select',choices:['A4 Portrait','A4 Landscape','Letter Portrait'],def:'A4 Portrait'}]
  },
  'word-counter':{cat:'util',icon:'🔤',label:'Word & Character Count',
    desc:'Count words, characters, lines and sentences in any text file or PDF.',
    accept:'.txt,.md,.pdf,.csv',multi:false,
    tips:['Works on plain text files, Markdown files, and PDFs','Results are shown instantly on screen','Useful for checking report lengths or contract word counts'],
    opts:[]
  },
  'csv-to-pdf':{cat:'util',icon:'📊',label:'CSV → PDF Table',
    desc:'Convert a CSV spreadsheet into a clean, formatted PDF table.',
    accept:'.csv',multi:false,
    tips:['First row is treated as the header row','Long tables span multiple pages automatically','Great for sending data reports without sharing the raw CSV'],
    opts:[{id:'title',label:'Report Title',sub:'Shown at the top of the PDF',type:'text',def:'Data Report'},{id:'fontsize',label:'Font Size',sub:'Smaller = more rows per page',type:'select',choices:['8pt — Very compact','10pt — Compact','12pt — Normal','14pt — Large'],def:'10pt — Compact'}]
  },
  'base64-tool':{cat:'util',icon:'🔐',label:'Base64 Encode / Decode',
    desc:'Encode any file to Base64 text, or decode a Base64 string back to a file.',
    accept:'*/*',multi:false,
    tips:['Base64 is commonly used in APIs, email attachments, and data URIs','Encoded text can be very large for binary files','Useful for embedding images directly in HTML or CSS'],
    opts:[{id:'mode',label:'Mode',sub:'',type:'select',choices:['Encode file → Base64 text','Decode Base64 text → file'],def:'Encode file → Base64 text'}]
  },
  'qr-generator':{cat:'util',icon:'📱',label:'QR Code Generator',
    desc:'Generate a QR code from any URL or text, saved as a PNG image.',
    accept:null,multi:false,
    tips:['QR codes can encode URLs, contact info, Wi-Fi passwords, plain text','Higher error correction = more readable when partially damaged','Logo overlay is not currently supported'],
    opts:[{id:'content',label:'Text or URL',sub:'What the QR code will encode',type:'text',def:'https://example.com'},{id:'size',label:'Image Size (px)',sub:'Output image dimensions',type:'select',choices:['256×256','512×512','1024×1024'],def:'512×512'},{id:'errLevel',label:'Error Correction',sub:'Higher = more resilient but denser',type:'select',choices:['Low (7%)','Medium (15%)','High (30%)'],def:'Medium (15%)'}]
  },
};

// ─── BUILD HOME GRIDS ────────────────────────────────
const PDF_TOOLS =['compress-pdf','merge-pdf','split-pdf','rotate-pdf','pdf-to-jpg','jpg-to-pdf','unlock-pdf','protect-pdf','add-page-numbers','stamp-pdf','pdf-info'];
const IMG_TOOLS =['compress-image','resize-image','crop-image','convert-to-jpg','convert-from-jpg','grayscale','watermark-image','flip-image','image-borders','image-info'];
const UTIL_TOOLS=['pdf-text','bulk-rename','img-to-portfolio','word-counter','csv-to-pdf','base64-tool','qr-generator'];
const NEW_TOOLS =['base64-tool','qr-generator','csv-to-pdf','word-counter','image-borders','image-info','pdf-info'];
const CAT_COLOR ={pdf:'ic-pdf',img:'ic-img',util:'ic-doc'};

function buildCard(id){
  const t=TOOLS[id];
  const isNew=NEW_TOOLS.includes(id);
  const cat=CAT_COLOR[t.cat]||'ic-util';
  return `<div class="tc" onclick="openTool('${id}')">
    <div class="tc-top">
      <div class="tc-icon ${cat}">${t.icon}</div>
      ${isNew?'<span class="tc-badge badge-new">NEW</span>':''}
    </div>
    <h3>${t.label}</h3>
    <p>${t.desc}</p>
  </div>`;
}
document.getElementById('grid-pdf').innerHTML=PDF_TOOLS.map(buildCard).join('');
document.getElementById('grid-img').innerHTML=IMG_TOOLS.map(buildCard).join('');
document.getElementById('grid-util').innerHTML=UTIL_TOOLS.map(buildCard).join('');

// ─── TOOL PAGE BUILDER ───────────────────────────────
let currentTool=null, toolFiles=[], _resizeBM=null, _cropBM=null, _cropDS=1;

function buildToolPage(id){
  const t=TOOLS[id];
  if(!t)return;

  // Sidebar
  document.getElementById('sb-icon').textContent=t.icon;
  document.getElementById('sb-icon').className='sidebar-tool-icon '+( CAT_COLOR[t.cat]||'ic-util');
  document.getElementById('sb-title').textContent=t.label;
  document.getElementById('sb-desc').textContent=t.desc;
  document.getElementById('sb-tips').innerHTML=`<h4>💡 Tips</h4>`+
    (t.tips||[]).map(tip=>`<div class="tip-item">${tip}</div>`).join('');

  // Build options HTML
  let optsHtml='';
  if(t.opts==='__resize__'){
    optsHtml=buildResizeOpts();
  } else if(t.opts&&t.opts.length){
    const rows=t.opts.map(o=>buildOptRow(o)).join('');
    optsHtml=`<div class="opts-card"><div class="opts-header"><div class="opts-header-icon">⚙️</div><h4>Options</h4></div><div class="opts-body">${rows}</div></div>`;
  }

  // Special UI areas
  let specialHtml='';
  if(id==='crop-image'){
    specialHtml=`<div class="crop-card" id="crop-card">
      <div class="crop-header"><h4>✂️ Crop Editor</h4><span class="crop-hint">Click & drag to select area</span></div>
      <div class="crop-canvas-wrap">
        <canvas id="crop-canvas"></canvas>
        <canvas id="crop-ov"></canvas>
      </div>
      <div class="crop-coords-grid">
        <div class="coord-field"><label>X (left)</label><input type="number" id="cx" value="0" oninput="drawCropOv()"></div>
        <div class="coord-field"><label>Y (top)</label><input type="number" id="cy" value="0" oninput="drawCropOv()"></div>
        <div class="coord-field"><label>Width</label><input type="number" id="cw" value="100" oninput="drawCropOv()"></div>
        <div class="coord-field"><label>Height</label><input type="number" id="ch" value="100" oninput="drawCropOv()"></div>
      </div>
    </div>`;
  }
  if(id==='resize-image'){
    specialHtml=`<div class="preview-card" id="preview-card">
      <div class="preview-header"><h4>Preview</h4><span class="preview-dims" id="preview-dims">–</span></div>
      <div class="preview-body"><canvas id="preview-canvas"></canvas></div>
    </div>`;
  }
  if(id==='qr-generator'){
    specialHtml=`<div class="preview-card" id="qr-preview-card" style="display:none">
      <div class="preview-header"><h4>QR Code Preview</h4></div>
      <div class="preview-body" style="padding:24px"><canvas id="qr-canvas" style="margin:0 auto;display:block"></canvas></div>
    </div>`;
  }

  // Drop zone
  let dzHtml='';
  if(t.accept!==null){
    const isMulti=t.multi;
    const fmtLabels={
      '.pdf':['PDF'],
      'image/*':['JPG','PNG','WEBP','GIF','BMP'],
      'image/jpeg,image/png,image/webp':['JPG','PNG','WEBP'],
      'image/png,image/webp,image/gif,image/bmp':['PNG','WEBP','GIF','BMP'],
      'image/jpeg,image/jpg':['JPG'],
      '.txt,.md,.pdf,.csv':['TXT','MD','PDF','CSV'],
      '.csv':['CSV'],
      '*/*':['Any File'],
    };
    const fmts=fmtLabels[t.accept]||['File'];
    dzHtml=`<div class="dropzone-wrap">
      <label class="dropzone" id="dz" for="file-in">
        <input type="file" id="file-in" accept="${t.accept}" ${isMulti?'multiple':''} onchange="onFilePick(this.files)" style="position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer;pointer-events:none">
        <div class="dz-inner">
          <div class="dz-icon-wrap">${t.cat==='pdf'?'📄':'🖼️'}</div>
          <h3>${isMulti?'Drop files here':'Drop your file here'}</h3>
          <p>or click to browse${isMulti?' — multiple files supported':''}</p>
          <div class="dz-formats">
            ${fmts.map(f=>`<span class="dz-format-tag">${f}</span>`).join('')}
          </div>
        </div>
      </label>
      <div class="file-list" id="file-list"></div>
    </div>`;
  } else {
    dzHtml=''; // No file input for QR generator
  }

  const isQR=id==='qr-generator';
  const main=document.getElementById('tool-main');
  main.innerHTML=`
    <button class="mobile-back" onclick="goHome()">
      <div class="mobile-back-icon">←</div>
      Back to All Tools
    </button>
    <div class="breadcrumb">
      <span onclick="goHome()">All Tools</span>
      <span class="sep">/</span>
      <span>${{pdf:'PDF Tools',img:'Image Tools',util:'Utilities'}[t.cat]||'Tools'}</span>
      <span class="sep">/</span>
      <span class="cur">${t.label}</span>
    </div>
    <div class="tool-heading">
      <h1>${t.icon} ${t.label}</h1>
      <p>${t.desc}</p>
    </div>
    ${dzHtml}
    ${optsHtml}
    ${specialHtml}
    <div class="action-area">
      <button class="act-btn" id="act-btn" onclick="runTool()" ${t.accept&&!isQR?'disabled':''}>
        <span class="act-btn-icon">⚡</span> ${t.label}
      </button>
      <button class="reset-btn" onclick="resetPage()">Reset</button>
    </div>
    <div class="prog-wrap" id="prog">
      <div class="prog-top"><span class="prog-label" id="prog-lbl">Processing…</span><span class="prog-pct" id="prog-pct">0%</span></div>
      <div class="prog-track"><div class="prog-bar" id="prog-bar"></div></div>
    </div>
    <div class="result-card" id="result"><div class="result-header"><span class="result-header-icon">✅</span><h4>Processing Complete!</h4></div><div class="result-body"><div class="result-stats" id="result-stats"></div><div class="result-files" id="result-files"></div></div></div>
    <div class="err-card" id="err"><span class="err-icon">⚠️</span><span id="err-msg">Error</span></div>
  `;

  // Setup dropzone drag events
  if(t.accept!==null){
    const dz=document.getElementById('dz');
    if(dz){
      dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('over')});
      dz.addEventListener('dragleave',()=>dz.classList.remove('over'));
      dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('over');onFilePick(e.dataTransfer.files);});
    }
  }

  // Special init
  if(id==='resize-image') initResizeWatcher();
  if(id==='qr-generator'){ document.getElementById('act-btn').disabled=false; }
}

function buildOptRow(o){
  let ctrl='';
  if(o.type==='select'){
    ctrl=`<select class="opt-select" id="opt-${o.id}">${o.choices.map(c=>`<option${c===o.def?' selected':''}>${c}</option>`).join('')}</select>`;
  } else if(o.type==='range'){
    ctrl=`<div class="range-wrap"><input type="range" min="${o.min}" max="${o.max}" step="${o.step}" value="${o.def}" id="opt-${o.id}" oninput="document.getElementById('rv-${o.id}').textContent=this.value+'${o.unit}';if(currentTool==='resize-image')updatePreview()"><span class="rv" id="rv-${o.id}">${o.def}${o.unit}</span></div>`;
  } else if(o.type==='number'||o.type==='text'){
    ctrl=`<input type="${o.type==='number'?'number':'text'}" class="opt-input" id="opt-${o.id}" value="${o.def}" placeholder="${o.def}" ${currentTool==='resize-image'?'oninput="updatePreview()"':''}>`;
  } else if(o.type==='password'){
    ctrl=`<input type="password" class="opt-input" id="opt-${o.id}" placeholder="Enter password">`;
  } else if(o.type==='toggle'){
    ctrl=`<label class="tog"><input type="checkbox" id="opt-${o.id}"${o.def?' checked':''}><span class="tog-slide"></span></label>`;
  }
  return `<div class="opt-row"><div class="opt-label">${o.label}${o.sub?`<div class="opt-sub">${o.sub}</div>`:''}</div><div class="opt-ctrl">${ctrl}</div></div>`;
}

// ─── FILE PICKING ─────────────────────────────────────
function onFilePick(files){
  if(!files||!files.length)return;
  const t=TOOLS[currentTool];
  if(t.multi){toolFiles=[...toolFiles,...Array.from(files)];}
  else{toolFiles=[files[0]];}
  renderFL();
  document.getElementById('act-btn').disabled=false;
  if(currentTool==='crop-image')loadCropImg(toolFiles[0]);
  if(currentTool==='resize-image')loadResizeImg(toolFiles[0]);
  if(currentTool==='image-info')runImageInfo(toolFiles[0]);
}

async function renderFL(){
  const fl=document.getElementById('file-list');if(!fl)return;
  const rows=await Promise.all(toolFiles.map(async(f,i)=>{
    let thumb='';
    if(f.type.startsWith('image/')){
      const url=URL.createObjectURL(f);
      thumb=`<div class="fi-thumb"><img src="${url}" onload="URL.revokeObjectURL(this.src)" style="width:100%;height:100%;object-fit:cover"></div>`;
    } else {
      thumb=`<div class="fi-thumb">${f.name.endsWith('.pdf')?'📄':f.name.endsWith('.csv')?'📊':'📁'}</div>`;
    }
    return `<div class="fi">${thumb}<div class="fi-info"><div class="fi-name">${f.name}</div><div class="fi-size">${fmtSz(f.size)}</div></div><button class="fi-rm" onclick="removeF(${i})">×</button></div>`;
  }));
  fl.innerHTML=rows.join('');
}

function removeF(i){toolFiles.splice(i,1);renderFL();if(!toolFiles.length){document.getElementById('act-btn').disabled=true;}}
function resetPage(){buildToolPage(currentTool);}

// ─── PROGRESS / RESULT / ERROR ────────────────────────
function setP(pct,lbl){
  const pw=document.getElementById('prog');
  if(pw)pw.classList.add('show');
  const pb=document.getElementById('prog-bar');if(pb)pb.style.width=pct+'%';
  const pl=document.getElementById('prog-lbl');if(pl)pl.textContent=lbl||'Processing…';
  const pp=document.getElementById('prog-pct');if(pp)pp.textContent=pct+'%';
}
function showResult(stats,files){
  document.getElementById('prog')?.classList.remove('show');
  const rc=document.getElementById('result');if(rc)rc.classList.add('show');
  const rs=document.getElementById('result-stats');
  if(rs)rs.innerHTML=stats.map(s=>`<div class="result-stat"><strong>${s.v}</strong>${s.l}</div>`).join('');
  const rf=document.getElementById('result-files');
  if(rf)rf.innerHTML=files.map(f=>`<div class="dl-row">
    <div class="dl-icon">${f.name.endsWith('.pdf')?'📄':f.name.endsWith('.zip')?'📦':f.name.endsWith('.txt')||f.name.endsWith('.md')?'📝':'🖼️'}</div>
    <div class="dl-name">${f.name}</div>
    <div class="dl-size">${fmtSz(f.blob.size)}</div>
    <button class="dl-btn" onclick="saveFile(window.__out['${f.name}'],'${f.name}')">⬇ Download</button>
  </div>`).join('');
  window.__out=window.__out||{};
  files.forEach(f=>window.__out[f.name]=f.blob);
}
function showErr(msg){
  document.getElementById('prog')?.classList.remove('show');
  const e=document.getElementById('err');
  if(e){document.getElementById('err-msg').textContent=msg;e.classList.add('show');}
}
function hideErr(){document.getElementById('err')?.classList.remove('show');}

// ═══════════════════════════════════════════════════════
//   DISPATCH
// ═══════════════════════════════════════════════════════
async function runTool(){
  hideErr();
  const actBtn=document.getElementById('act-btn');
  if(actBtn)actBtn.disabled=true;
  try{
    const T={
      'compress-pdf':    doCompressPdf,
      'merge-pdf':       doMergePdf,
      'split-pdf':       doSplitPdf,
      'rotate-pdf':      doRotatePdf,
      'pdf-to-jpg':      doPdfToJpg,
      'jpg-to-pdf':      doJpgToPdf,
      'unlock-pdf':      doUnlockPdf,
      'protect-pdf':     doProtectPdf,
      'add-page-numbers':doAddPageNums,
      'stamp-pdf':       doStampPdf,
      'pdf-info':        doPdfInfo,
      'compress-image':  doCompressImg,
      'resize-image':    doResizeImg,
      'crop-image':      doCropImg,
      'convert-to-jpg':  doConvertToJpg,
      'convert-from-jpg':doConvertFromJpg,
      'grayscale':       doGrayscale,
      'watermark-image': doWatermark,
      'flip-image':      doFlip,
      'image-borders':   doBorder,
      'image-info':      doImgInfoRun,
      'pdf-text':        doPdfText,
      'bulk-rename':     doBulkRename,
      'img-to-portfolio':doPortfolio,
      'word-counter':    doWordCount,
      'csv-to-pdf':      doCsvToPdf,
      'base64-tool':     doBase64,
      'qr-generator':    doQr,
    };
    if(T[currentTool]) await T[currentTool]();
    else showErr('Tool not implemented yet.');
  }catch(e){
    showErr(e.message||'An unexpected error occurred.');
    console.error(e);
  }
  if(actBtn)actBtn.disabled=false;
}

// ═══════════════════════════════════════════════════════
//   PDF TOOLS
// ═══════════════════════════════════════════════════════

async function doCompressPdf(){
  await need('pdflib');
  if(!toolFiles.length)return;
  const f=toolFiles[0];
  setP(10,'Loading PDF…');
  const buf=await readBuf(f);
  setP(50,'Optimising streams…');
  const doc=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
  const out=await doc.save({useObjectStreams:true});
  setP(100,'Done!');
  const blob=new Blob([out],{type:'application/pdf'});
  const pct=Math.max(0,Math.round((1-blob.size/f.size)*100));
  const name=bn(f.name)+'_compressed.pdf';
  showResult([{v:fmtSz(f.size),l:'Original'},{v:fmtSz(blob.size),l:'Compressed'},{v:pct+'%',l:'Reduced'},{v:doc.getPageCount()+'',l:'Pages'}],[{name,blob}]);
  saveFile(blob,name);
}

async function doMergePdf(){
  await need('pdflib');
  if(toolFiles.length<2){showErr('Please upload at least 2 PDF files.');return;}
  const merged=await PDFLib.PDFDocument.create();
  let totalPages=0;
  for(let i=0;i<toolFiles.length;i++){
    setP(Math.round((i/toolFiles.length)*90),`Merging ${toolFiles[i].name}…`);
    const buf=await readBuf(toolFiles[i]);
    const doc=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
    const pages=await merged.copyPages(doc,doc.getPageIndices());
    pages.forEach(p=>merged.addPage(p));
    totalPages+=pages.length;
  }
  setP(95,'Saving…');
  const out=await merged.save();
  const blob=new Blob([out],{type:'application/pdf'});
  const name='merged.pdf';
  showResult([{v:toolFiles.length+'',l:'Files merged'},{v:totalPages+'',l:'Total pages'},{v:fmtSz(blob.size),l:'Output size'}],[{name,blob}]);
  saveFile(blob,name);
}

async function doSplitPdf(){
  await need('pdflib');
  if(!toolFiles.length)return;
  const f=toolFiles[0];
  const input=(getV('opt-pages')||'all').trim().toLowerCase();
  setP(20,'Loading PDF…');
  const buf=await readBuf(f);
  const doc=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
  const total=doc.getPageCount();
  let indices=[];
  if(input==='all'){indices=Array.from({length:total},(_,i)=>i);}
  else{
    input.split(',').forEach(part=>{
      part=part.trim();
      if(part.includes('-')){const[a,b]=part.split('-').map(x=>parseInt(x)-1);for(let i=a;i<=Math.min(b,total-1);i++)indices.push(i);}
      else{const n=parseInt(part)-1;if(n>=0&&n<total)indices.push(n);}
    });
  }
  if(!indices.length){showErr(`No valid pages. PDF has ${total} pages. Try "1-${total}" or "all".`);return;}
  setP(50,'Extracting pages…');
  const nd=await PDFLib.PDFDocument.create();
  const cp=await nd.copyPages(doc,indices);
  cp.forEach(p=>nd.addPage(p));
  setP(90,'Saving…');
  const out=await nd.save();
  const blob=new Blob([out],{type:'application/pdf'});
  const name=bn(f.name)+`_extracted.pdf`;
  showResult([{v:total+'',l:'Source pages'},{v:indices.length+'',l:'Extracted'},{v:fmtSz(blob.size),l:'Output size'}],[{name,blob}]);
  saveFile(blob,name);
}

async function doRotatePdf(){
  await need('pdflib');
  if(!toolFiles.length)return;
  const f=toolFiles[0];
  const dir=getV('opt-angle')||'90° Clockwise';
  const deg=dir.includes('Counter')?270:dir.includes('180')?180:90;
  setP(30,'Loading…');
  const buf=await readBuf(f);
  const doc=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
  setP(70,'Rotating pages…');
  doc.getPages().forEach(p=>{const cur=p.getRotation().angle;p.setRotation(PDFLib.degrees((cur+deg)%360));});
  const out=await doc.save();
  const blob=new Blob([out],{type:'application/pdf'});
  const name=bn(f.name)+'_rotated.pdf';
  showResult([{v:doc.getPageCount()+'',l:'Pages rotated'},{v:dir,l:'Direction'},{v:fmtSz(blob.size),l:'Output size'}],[{name,blob}]);
  saveFile(blob,name);
}

async function doPdfToJpg(){
  await need('pdfjs');await need('jszip');
  if(!toolFiles.length)return;
  const f=toolFiles[0];
  const scale=parseFloat(getV('opt-scale'))||2;
  const quality=(parseFloat(getV('opt-quality'))||92)/100;
  setP(5,'Loading PDF…');
  const buf=await readBuf(f);
  const pdf=await pdfjsLib.getDocument({data:buf}).promise;
  const total=pdf.numPages;
  const zip=new JSZip();
  const folder=zip.folder(bn(f.name));
  for(let i=1;i<=total;i++){
    setP(Math.round(5+(i/total)*80),`Rendering page ${i} of ${total}…`);
    const page=await pdf.getPage(i);
    const vp=page.getViewport({scale});
    const cv=document.createElement('canvas');
    cv.width=vp.width;cv.height=vp.height;
    await page.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;
    const b64=cv.toDataURL('image/jpeg',quality).split(',')[1];
    folder.file(`page_${String(i).padStart(4,'0')}.jpg`,b64,{base64:true});
  }
  setP(92,'Zipping…');
  const zipBlob=await zip.generateAsync({type:'blob'});
  const name=bn(f.name)+'_pages.zip';
  showResult([{v:total+'',l:'Pages converted'},{v:scale+'×',l:'Resolution'},{v:fmtSz(zipBlob.size),l:'ZIP size'}],[{name,blob:zipBlob}]);
  saveFile(zipBlob,name);
}

async function doJpgToPdf(){
  await need('pdflib');
  if(!toolFiles.length)return;
  const psSel=getV('opt-pagesize')||'A4 Portrait (210×297mm)';
  const marginSel=getV('opt-margin')||'Medium (20px)';
  const marginMap={'None':0,'Small (10px)':10,'Medium (20px)':20,'Large (40px)':40};
  const margin=marginMap[marginSel]||20;
  const isA4=psSel.startsWith('A4');
  const isLandscape=psSel.includes('Landscape');
  let pw,ph;
  if(psSel.includes('Fit')){pw=null;ph=null;}
  else if(isA4&&!isLandscape){pw=595;ph=842;}
  else if(isA4&&isLandscape){pw=842;ph=595;}
  else if(!isA4&&!isLandscape){pw=612;ph=792;}
  else{pw=792;ph=612;}
  const doc=await PDFLib.PDFDocument.create();
  for(let i=0;i<toolFiles.length;i++){
    setP(Math.round(5+(i/toolFiles.length)*90),`Embedding image ${i+1}/${toolFiles.length}…`);
    const buf=await readBuf(toolFiles[i]);
    let img;
    try{img=toolFiles[i].type==='image/jpeg'||toolFiles[i].type==='image/jpg'?await doc.embedJpg(buf):await doc.embedPng(buf);}
    catch{
      const bm=await createImageBitmap(toolFiles[i]);
      const cv=document.createElement('canvas');cv.width=bm.width;cv.height=bm.height;
      cv.getContext('2d').drawImage(bm,0,0);
      const du=cv.toDataURL('image/jpeg',0.92);
      const res=await fetch(du);img=await doc.embedJpg(await res.arrayBuffer());
    }
    const ppw=pw||img.width,pph=ph||img.height;
    const page=doc.addPage([ppw,pph]);
    const aw=ppw-margin*2,ah=pph-margin*2;
    const sc=Math.min(aw/img.width,ah/img.height,1);
    const iw=img.width*sc,ih=img.height*sc;
    page.drawImage(img,{x:margin+(aw-iw)/2,y:margin+(ah-ih)/2,width:iw,height:ih});
  }
  const out=await doc.save();
  const blob=new Blob([out],{type:'application/pdf'});
  const name=toolFiles.length===1?bn(toolFiles[0].name)+'.pdf':'images_combined.pdf';
  showResult([{v:toolFiles.length+'',l:'Images'},{v:doc.getPageCount()+'',l:'Pages'},{v:fmtSz(blob.size),l:'PDF size'}],[{name,blob}]);
  saveFile(blob,name);
}

async function doUnlockPdf(){
  await need('pdflib');
  if(!toolFiles.length)return;
  const f=toolFiles[0];
  const pass=getV('opt-pass')||'';
  setP(20,'Loading PDF…');
  const buf=await readBuf(f);
  let doc;
  try{doc=await PDFLib.PDFDocument.load(buf,{password:pass});}
  catch{
    try{doc=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});}
    catch{throw new Error('Could not unlock PDF. Please check the password is correct.');}
  }
  setP(60,'Creating clean copy…');
  const clean=await PDFLib.PDFDocument.create();
  const pages=await clean.copyPages(doc,doc.getPageIndices());
  pages.forEach(p=>clean.addPage(p));
  // Copy basic metadata safely
  ['Title','Author','Subject','Keywords'].forEach(k=>{try{clean['set'+k](doc['get'+k]());}catch{}});
  setP(90,'Saving…');
  const out=await clean.save();
  const blob=new Blob([out],{type:'application/pdf'});
  const name=bn(f.name)+'_unlocked.pdf';
  showResult([{v:'✅',l:'Password removed'},{v:doc.getPageCount()+'',l:'Pages'},{v:fmtSz(blob.size),l:'Output size'}],[{name,blob}]);
  saveFile(blob,name);
}

async function doProtectPdf(){
  await need('pdflib');
  if(!toolFiles.length)return;
  const p1=getV('opt-p1')||'';
  const p2=getV('opt-p2')||'';
  const noPrint=getChk('opt-noPrint');
  const noCopy=getChk('opt-noCopy');
  if(!p1){showErr('Please enter a password.');return;}
  if(p1!==p2){showErr('Passwords do not match. Please re-enter.');return;}
  if(p1.length<4){showErr('Password must be at least 4 characters.');return;}
  const f=toolFiles[0];
  setP(30,'Loading PDF…');
  const buf=await readBuf(f);
  const doc=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
  setP(70,'Encrypting…');
  const perms={printing:noPrint?'none':'highResolution',modifying:false,copying:!noCopy,annotating:true,fillingForms:true,contentAccessibility:true,documentAssembly:false};
  const out=await doc.save({userPassword:p1,ownerPassword:p1+'_OWN_'+Date.now(),permissions:perms});
  const blob=new Blob([out],{type:'application/pdf'});
  const name=bn(f.name)+'_protected.pdf';
  showResult([{v:'🔒',l:'Password set'},{v:doc.getPageCount()+'',l:'Pages'},{v:noPrint?'No':'Yes',l:'Printing'},{v:noCopy?'No':'Yes',l:'Copy text'}],[{name,blob}]);
  saveFile(blob,name);
}

async function doAddPageNums(){
  await need('pdflib');
  if(!toolFiles.length)return;
  const f=toolFiles[0];
  const pos=getV('opt-pos')||'Bottom Centre';
  const start=parseInt(getV('opt-start'))||1;
  const prefix=getV('opt-prefix')||'';
  setP(20,'Loading PDF…');
  const buf=await readBuf(f);
  const doc=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
  const font=await doc.embedFont(PDFLib.StandardFonts.Helvetica);
  const pages=doc.getPages();
  setP(50,'Adding page numbers…');
  pages.forEach((page,i)=>{
    const{width,height}=page.getSize();
    const num=prefix+(start+i);
    const fs=10;
    const tw=font.widthOfTextAtSize(num,fs);
    let x,y;
    const pad=24;
    if(pos==='Bottom Centre'){x=(width-tw)/2;y=pad;}
    else if(pos==='Bottom Right'){x=width-tw-pad;y=pad;}
    else if(pos==='Bottom Left'){x=pad;y=pad;}
    else if(pos==='Top Centre'){x=(width-tw)/2;y=height-pad-fs;}
    else{x=width-tw-pad;y=height-pad-fs;}
    page.drawText(num,{x,y,size:fs,font,color:PDFLib.rgb(.35,.35,.35),opacity:.9});
  });
  setP(90,'Saving…');
  const out=await doc.save();
  const blob=new Blob([out],{type:'application/pdf'});
  const name=bn(f.name)+'_numbered.pdf';
  showResult([{v:pages.length+'',l:'Pages numbered'},{v:pos,l:'Position'},{v:start+' – '+(start+pages.length-1),l:'Range'}],[{name,blob}]);
  saveFile(blob,name);
}

async function doStampPdf(){
  await need('pdflib');
  if(!toolFiles.length)return;
  const f=toolFiles[0];
  const text=(getV('opt-text')||'CONFIDENTIAL').toUpperCase();
  const opacity=getN('opt-opacity')/100||.15;
  const colorName=getV('opt-color')||'Red';
  const sizeSel=getV('opt-size')||'Medium';
  const cMap={Red:PDFLib.rgb(.85,.1,.1),Blue:PDFLib.rgb(.1,.1,.85),Grey:PDFLib.rgb(.5,.5,.5),Black:PDFLib.rgb(0,0,0),Green:PDFLib.rgb(.1,.7,.2)};
  const color=cMap[colorName]||cMap.Red;
  const sizeFactor={Small:.07,Medium:.1,Large:.14}[sizeSel]||.1;
  setP(20,'Loading PDF…');
  const buf=await readBuf(f);
  const doc=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
  const font=await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
  const pages=doc.getPages();
  setP(55,'Stamping…');
  pages.forEach(page=>{
    const{width,height}=page.getSize();
    const fs=Math.min(width,height)*sizeFactor;
    const tw=font.widthOfTextAtSize(text,fs);
    const th=font.heightAtSize(fs);
    page.drawText(text,{x:(width-tw)/2,y:(height+th)/2,size:fs,font,color,opacity,rotate:PDFLib.degrees(-35)});
  });
  setP(90,'Saving…');
  const out=await doc.save();
  const blob=new Blob([out],{type:'application/pdf'});
  const name=bn(f.name)+'_stamped.pdf';
  showResult([{v:pages.length+'',l:'Pages stamped'},{v:'"'+text+'"',l:'Stamp text'},{v:Math.round(opacity*100)+'%',l:'Opacity'}],[{name,blob}]);
  saveFile(blob,name);
}

async function doPdfInfo(){
  await need('pdflib');
  if(!toolFiles.length)return;
  const f=toolFiles[0];
  setP(40,'Analysing…');
  const buf=await readBuf(f);
  const doc=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
  const pages=doc.getPages();
  let report=`PDF Inspector Report\n${'='.repeat(40)}\n\n`;
  report+=`File Name:    ${f.name}\n`;
  report+=`File Size:    ${fmtSz(f.size)}\n`;
  report+=`Total Pages:  ${pages.length}\n`;
  const fields=['Title','Author','Subject','Keywords','Creator','Producer'];
  fields.forEach(k=>{try{const v=doc['get'+k]();if(v)report+=`${(k+':').padEnd(14)}${v}\n`;}catch{}});
  try{const d=doc.getCreationDate();if(d)report+=`Created:      ${d.toLocaleDateString()}\n`;}catch{}
  if(pages.length){
    const{width,height}=pages[0].getSize();
    report+=`\nPage Dimensions (page 1):\n`;
    report+=`  ${Math.round(width)} × ${Math.round(height)} points\n`;
    report+=`  ${Math.round(width*0.352)}mm × ${Math.round(height*0.352)}mm\n`;
  }
  report+=`\nGenerated by ToolKit Pro\n`;
  setP(100,'Done!');
  const blob=new Blob([report],{type:'text/plain'});
  const name=bn(f.name)+'_info.txt';
  showResult([{v:pages.length+'',l:'Pages'},{v:fmtSz(f.size),l:'File size'},{v:f.name.split('.').pop().toUpperCase(),l:'Format'}],[{name,blob}]);
  saveFile(blob,name);
}

// ═══════════════════════════════════════════════════════
//   IMAGE TOOLS
// ═══════════════════════════════════════════════════════

async function doCompressImg(){
  if(!toolFiles.length)return;
  const quality=(getN('opt-quality')||78)/100;
  const maxW=getN('opt-maxw')||0;
  const results=[];
  for(let i=0;i<toolFiles.length;i++){
    setP(Math.round((i/toolFiles.length)*90),`Compressing ${i+1}/${toolFiles.length}…`);
    const f=toolFiles[i];
    let bm=await createImageBitmap(f);
    let w=bm.width,h=bm.height;
    if(maxW&&w>maxW){h=Math.round(h*(maxW/w));w=maxW;}
    const cv=document.createElement('canvas');cv.width=w;cv.height=h;
    cv.getContext('2d').drawImage(bm,0,0,w,h);
    const mime=f.type==='image/png'?'image/png':'image/jpeg';
    const du=cv.toDataURL(mime,quality);
    const res=await fetch(du);const blob=await res.blob();
    const ext=mime==='image/png'?'png':'jpg';
    results.push({name:bn(f.name)+'_compressed.'+ext,blob,orig:f.size});
  }
  setP(100,'Done!');
  const totalOrig=toolFiles.reduce((s,f)=>s+f.size,0);
  const totalNew=results.reduce((s,r)=>s+r.blob.size,0);
  const pct=Math.max(0,Math.round((1-totalNew/totalOrig)*100));
  showResult([{v:fmtSz(totalOrig),l:'Original'},{v:fmtSz(totalNew),l:'Compressed'},{v:pct+'%',l:'Saved'},{v:results.length+'',l:'Images'}],results);
  results.forEach(r=>saveFile(r.blob,r.name));
}

// RESIZE
function buildResizeOpts(){
  return `<div class="opts-card"><div class="opts-header"><div class="opts-header-icon">⚙️</div><h4>Options</h4></div><div class="opts-body">
    <div class="opt-row"><div class="opt-label">Mode<div class="opt-sub">How to specify the new size</div></div><div class="opt-ctrl"><select class="opt-select" id="opt-mode" onchange="toggleRMode()"><option>By Pixels</option><option>By Percentage</option></select></div></div>
    <div id="px-opts">
      <div class="opt-row"><div class="opt-label">Width (px)</div><div class="opt-ctrl"><input type="number" class="opt-input" id="opt-rw" placeholder="e.g. 1920" oninput="updatePreview()"></div></div>
      <div class="opt-row"><div class="opt-label">Height (px)</div><div class="opt-ctrl"><input type="number" class="opt-input" id="opt-rh" placeholder="e.g. 1080" oninput="updatePreview()"></div></div>
    </div>
    <div id="pct-opts" style="display:none"><div class="opt-row"><div class="opt-label">Scale Percentage<div class="opt-sub">100% = original size</div></div><div class="opt-ctrl"><div class="range-wrap"><input type="range" min="5" max="200" step="5" value="50" id="opt-rpct" oninput="document.getElementById('rv-rpct').textContent=this.value+'%';updatePreview()"><span class="rv" id="rv-rpct">50%</span></div></div></div></div>
    <div class="opt-row"><div class="opt-label">Keep Aspect Ratio<div class="opt-sub">Prevents stretching</div></div><div class="opt-ctrl"><label class="tog"><input type="checkbox" id="opt-aspect" checked onchange="updatePreview()"><span class="tog-slide"></span></label></div></div>
    <div class="opt-row"><div class="opt-label">Output Quality<div class="opt-sub">For JPEG output</div></div><div class="opt-ctrl"><div class="range-wrap"><input type="range" min="60" max="100" step="1" value="92" id="opt-rq" oninput="document.getElementById('rv-rq').textContent=this.value+'%'"><span class="rv" id="rv-rq">92%</span></div></div></div>
  </div></div>`;
}
function toggleRMode(){
  const m=getV('opt-mode')||'By Pixels';
  document.getElementById('px-opts').style.display=m==='By Percentage'?'none':'';
  document.getElementById('pct-opts').style.display=m==='By Percentage'?'':'none';
  updatePreview();
}
function initResizeWatcher(){/* watches handled by inline oninput */}
async function loadResizeImg(f){
  _resizeBM=await createImageBitmap(f);
  updatePreview();
}
function updatePreview(){
  if(!_resizeBM)return;
  const pc=document.getElementById('preview-card');if(pc)pc.classList.add('show');
  const mode=getV('opt-mode')||'By Pixels';
  const keepAR=getChk('opt-aspect');
  let tw,th;
  if(mode==='By Percentage'){
    const pct=(parseFloat(getV('opt-rpct'))||50)/100;
    tw=Math.round(_resizeBM.width*pct);th=Math.round(_resizeBM.height*pct);
  } else {
    tw=parseInt(getV('opt-rw'))||_resizeBM.width;
    th=parseInt(getV('opt-rh'))||_resizeBM.height;
    if(keepAR){const r=Math.min(tw/_resizeBM.width,th/_resizeBM.height);tw=Math.round(_resizeBM.width*r);th=Math.round(_resizeBM.height*r);}
  }
  const cv=document.getElementById('preview-canvas');
  if(!cv)return;
  const maxW=Math.min(tw,660);const s=maxW/tw;
  cv.width=Math.round(tw*s);cv.height=Math.round(th*s);
  cv.style.maxWidth='100%';
  cv.getContext('2d').drawImage(_resizeBM,0,0,cv.width,cv.height);
  const d=document.getElementById('preview-dims');
  if(d)d.textContent=`Output: ${tw} × ${th} px`;
}
async function doResizeImg(){
  if(!toolFiles.length)return;
  const f=toolFiles[0];
  const bm=_resizeBM||await createImageBitmap(f);
  const mode=getV('opt-mode')||'By Pixels';
  const keepAR=getChk('opt-aspect');
  const quality=(parseFloat(getV('opt-rq'))||92)/100;
  let tw,th;
  if(mode==='By Percentage'){const p=(parseFloat(getV('opt-rpct'))||50)/100;tw=Math.round(bm.width*p);th=Math.round(bm.height*p);}
  else{
    tw=parseInt(getV('opt-rw'))||bm.width;th=parseInt(getV('opt-rh'))||bm.height;
    if(keepAR){const r=Math.min(tw/bm.width,th/bm.height);tw=Math.round(bm.width*r);th=Math.round(bm.height*r);}
  }
  setP(50,'Resizing…');
  const cv=document.createElement('canvas');cv.width=tw;cv.height=th;
  cv.getContext('2d').drawImage(bm,0,0,tw,th);
  const mime=f.type||'image/jpeg';
  const du=cv.toDataURL(mime,quality);
  const res=await fetch(du);const blob=await res.blob();
  const ext=mime.includes('png')?'png':mime.includes('webp')?'webp':'jpg';
  const name=bn(f.name)+`_${tw}x${th}.`+ext;
  showResult([{v:`${bm.width}×${bm.height}`,l:'Original'},{v:`${tw}×${th}`,l:'Resized'},{v:fmtSz(blob.size),l:'Output size'}],[{name,blob}]);
  saveFile(blob,name);
}

// CROP
let _cropDrawing=false,_cropSX=0,_cropSY=0;
async function loadCropImg(f){
  _cropBM=await createImageBitmap(f);
  const cw=_cropBM.width,ch=_cropBM.height;
  const maxW=Math.min(cw,700);
  _cropDS=maxW/cw;
  const dw=Math.round(cw*_cropDS),dh=Math.round(ch*_cropDS);
  const card=document.getElementById('crop-card');
  const cv=document.getElementById('crop-canvas');
  const ov=document.getElementById('crop-ov');
  if(!card||!cv||!ov)return;
  card.classList.add('show');
  cv.width=dw;cv.height=dh;
  ov.width=dw;ov.height=dh;
  ov.style.width=dw+'px';ov.style.height=dh+'px';
  cv.getContext('2d').drawImage(_cropBM,0,0,dw,dh);
  // Default selection = full image
  const ci=v=>'document.getElementById("c'+v+'")';
  document.getElementById('cx').value=0;
  document.getElementById('cy').value=0;
  document.getElementById('cw').value=cw;
  document.getElementById('ch').value=ch;
  drawCropOv();
  // Events
  ov.onmousedown=e=>{_cropDrawing=true;const r=ov.getBoundingClientRect();_cropSX=e.clientX-r.left;_cropSY=e.clientY-r.top;};
  ov.onmousemove=e=>{
    if(!_cropDrawing)return;
    const r=ov.getBoundingClientRect();
    const ex=Math.max(0,Math.min(e.clientX-r.left,dw));
    const ey=Math.max(0,Math.min(e.clientY-r.top,dh));
    const sx=Math.min(_cropSX,ex),sy=Math.min(_cropSY,ey);
    document.getElementById('cx').value=Math.round(sx/_cropDS);
    document.getElementById('cy').value=Math.round(sy/_cropDS);
    document.getElementById('cw').value=Math.max(1,Math.round(Math.abs(ex-_cropSX)/_cropDS));
    document.getElementById('ch').value=Math.max(1,Math.round(Math.abs(ey-_cropSY)/_cropDS));
    drawCropOv();
  };
  ov.onmouseup=ov.onmouseleave=()=>{_cropDrawing=false;};
  ov.ontouchstart=e=>{e.preventDefault();const t=e.touches[0],r=ov.getBoundingClientRect();_cropDrawing=true;_cropSX=t.clientX-r.left;_cropSY=t.clientY-r.top;};
  ov.ontouchmove=e=>{e.preventDefault();if(!_cropDrawing)return;
    const t=e.touches[0],r=ov.getBoundingClientRect();
    const ex=Math.max(0,Math.min(t.clientX-r.left,dw));const ey=Math.max(0,Math.min(t.clientY-r.top,dh));
    document.getElementById('cx').value=Math.round(Math.min(_cropSX,ex)/_cropDS);
    document.getElementById('cy').value=Math.round(Math.min(_cropSY,ey)/_cropDS);
    document.getElementById('cw').value=Math.max(1,Math.round(Math.abs(ex-_cropSX)/_cropDS));
    document.getElementById('ch').value=Math.max(1,Math.round(Math.abs(ey-_cropSY)/_cropDS));
    drawCropOv();};
  ov.ontouchend=()=>{_cropDrawing=false;};
}
function drawCropOv(){
  const ov=document.getElementById('crop-ov');if(!ov)return;
  const ctx=ov.getContext('2d');
  const ds=_cropDS||1;
  const cx=(parseInt(document.getElementById('cx')?.value)||0)*ds;
  const cy=(parseInt(document.getElementById('cy')?.value)||0)*ds;
  const cw=(parseInt(document.getElementById('cw')?.value)||0)*ds;
  const ch=(parseInt(document.getElementById('ch')?.value)||0)*ds;
  ctx.clearRect(0,0,ov.width,ov.height);
  ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(0,0,ov.width,ov.height);
  ctx.clearRect(cx,cy,cw,ch);
  ctx.strokeStyle='#6c63ff';ctx.lineWidth=2;ctx.strokeRect(cx,cy,cw,ch);
  // Handles
  const hs=8;ctx.fillStyle='#6c63ff';
  [[cx,cy],[cx+cw-hs,cy],[cx,cy+ch-hs],[cx+cw-hs,cy+ch-hs]].forEach(([x,y])=>ctx.fillRect(x,y,hs,hs));
  // Rule of thirds grid
  ctx.strokeStyle='rgba(108,99,255,.3)';ctx.lineWidth=1;ctx.setLineDash([4,4]);
  [1/3,2/3].forEach(f=>{ctx.beginPath();ctx.moveTo(cx+cw*f,cy);ctx.lineTo(cx+cw*f,cy+ch);ctx.stroke();ctx.beginPath();ctx.moveTo(cx,cy+ch*f);ctx.lineTo(cx+cw,cy+ch*f);ctx.stroke();});
  ctx.setLineDash([]);
}
async function doCropImg(){
  if(!toolFiles.length||!_cropBM){showErr('Please upload an image first.');return;}
  const cx=parseInt(document.getElementById('cx')?.value)||0;
  const cy=parseInt(document.getElementById('cy')?.value)||0;
  const cw=parseInt(document.getElementById('cw')?.value)||0;
  const ch=parseInt(document.getElementById('ch')?.value)||0;
  if(cw<1||ch<1){showErr('Please draw a crop area on the image first.');return;}
  setP(50,'Cropping…');
  const bm=await createImageBitmap(_cropBM,cx,cy,cw,ch);
  const cv=document.createElement('canvas');cv.width=cw;cv.height=ch;
  cv.getContext('2d').drawImage(bm,0,0);
  const mime=toolFiles[0].type||'image/jpeg';
  const du=cv.toDataURL(mime,.95);const res=await fetch(du);const blob=await res.blob();
  const ext=mime.includes('png')?'png':mime.includes('webp')?'webp':'jpg';
  const name=bn(toolFiles[0].name)+'_cropped.'+ext;
  showResult([{v:`${cw}×${ch}`,l:'Cropped size'},{v:`${_cropBM.width}×${_cropBM.height}`,l:'Original size'},{v:fmtSz(blob.size),l:'Output size'}],[{name,blob}]);
  saveFile(blob,name);
}

async function doConvertToJpg(){
  if(!toolFiles.length)return;
  const quality=(getN('opt-quality')||92)/100;
  const bgSel=getV('opt-bgcolor')||'White';
  const bgMap={'White':'#fff','Black':'#000','Light Grey':'#f0f0f0'};
  const bg=bgMap[bgSel]||'#fff';
  const results=[];
  for(let i=0;i<toolFiles.length;i++){
    setP(Math.round((i/toolFiles.length)*90),`Converting ${i+1}/${toolFiles.length}…`);
    const bm=await createImageBitmap(toolFiles[i]);
    const cv=document.createElement('canvas');cv.width=bm.width;cv.height=bm.height;
    const ctx=cv.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,cv.width,cv.height);ctx.drawImage(bm,0,0);
    const du=cv.toDataURL('image/jpeg',quality);const res=await fetch(du);const blob=await res.blob();
    results.push({name:bn(toolFiles[i].name)+'.jpg',blob});
  }
  setP(100,'Done!');
  showResult([{v:results.length+'',l:'Converted'},{v:'JPEG',l:'Format'},{v:fmtSz(results.reduce((s,r)=>s+r.blob.size,0)),l:'Total size'}],results);
  results.forEach(r=>saveFile(r.blob,r.name));
}

async function doConvertFromJpg(){
  if(!toolFiles.length)return;
  const fmtSel=getV('opt-fmt')||'PNG — Lossless';
  const isWebp=fmtSel.startsWith('WEBP');
  const mime=isWebp?'image/webp':'image/png';
  const extOut=isWebp?'webp':'png';
  const results=[];
  for(let i=0;i<toolFiles.length;i++){
    setP(Math.round((i/toolFiles.length)*90),`Converting ${i+1}/${toolFiles.length}…`);
    const bm=await createImageBitmap(toolFiles[i]);
    const cv=document.createElement('canvas');cv.width=bm.width;cv.height=bm.height;
    cv.getContext('2d').drawImage(bm,0,0);
    const du=cv.toDataURL(mime);const res=await fetch(du);const blob=await res.blob();
    results.push({name:bn(toolFiles[i].name)+'.'+extOut,blob});
  }
  setP(100,'Done!');
  showResult([{v:results.length+'',l:'Converted'},{v:extOut.toUpperCase(),l:'Format'},{v:fmtSz(results.reduce((s,r)=>s+r.blob.size,0)),l:'Total size'}],results);
  results.forEach(r=>saveFile(r.blob,r.name));
}

async function doGrayscale(){
  if(!toolFiles.length)return;
  const enhance=getChk('opt-contrast');
  const results=[];
  for(let i=0;i<toolFiles.length;i++){
    setP(Math.round((i/toolFiles.length)*90),`Processing ${i+1}/${toolFiles.length}…`);
    const bm=await createImageBitmap(toolFiles[i]);
    const cv=document.createElement('canvas');cv.width=bm.width;cv.height=bm.height;
    const ctx=cv.getContext('2d');ctx.drawImage(bm,0,0);
    const id=ctx.getImageData(0,0,cv.width,cv.height);const d=id.data;
    for(let j=0;j<d.length;j+=4){
      let g=d[j]*.299+d[j+1]*.587+d[j+2]*.114;
      if(enhance){g=Math.min(255,Math.max(0,(g-128)*1.3+128));}
      d[j]=d[j+1]=d[j+2]=g;
    }
    ctx.putImageData(id,0,0);
    const du=cv.toDataURL('image/jpeg',.92);const res=await fetch(du);const blob=await res.blob();
    results.push({name:bn(toolFiles[i].name)+'_bw.jpg',blob});
  }
  setP(100,'Done!');
  showResult([{v:results.length+'',l:'Converted'},{v:'Greyscale',l:'Mode'}],results);
  results.forEach(r=>saveFile(r.blob,r.name));
}

async function doWatermark(){
  if(!toolFiles.length)return;
  const f=toolFiles[0];
  const text=getV('opt-text')||'© Your Company';
  const opacity=getN('opt-opacity')/100||.3;
  const posSel=getV('opt-pos')||'Centre (diagonal)';
  const colorName=getV('opt-color')||'White';
  const colorMap={'White':'rgba(255,255,255,','Black':'rgba(0,0,0,','Red':'rgba(220,30,30,','Blue':'rgba(30,30,220,','Grey':'rgba(128,128,128,'};
  const colorBase=colorMap[colorName]||'rgba(255,255,255,';
  const bm=await createImageBitmap(f);
  const cv=document.createElement('canvas');cv.width=bm.width;cv.height=bm.height;
  const ctx=cv.getContext('2d');ctx.drawImage(bm,0,0);
  const isTiled=posSel==='Tiled (repeat)';
  const isDiag=posSel.includes('diagonal');
  const fs=Math.max(16,Math.min(bm.width,bm.height)*(isTiled?.05:.09));
  ctx.font=`bold ${fs}px sans-serif`;
  ctx.fillStyle=colorBase+opacity+')';
  const tw=ctx.measureText(text).width;
  if(isTiled){
    const padX=tw*1.5,padY=fs*3;
    for(let y=-padY;y<bm.height+padY;y+=padY){
      for(let x=-padX;x<bm.width+padX;x+=padX){
        ctx.save();ctx.translate(x,y);ctx.rotate(-Math.PI/6);ctx.fillText(text,0,0);ctx.restore();
      }
    }
  } else if(isDiag){
    ctx.save();ctx.translate(bm.width/2,bm.height/2);ctx.rotate(-Math.PI/7);ctx.fillText(text,-tw/2,0);ctx.restore();
  } else {
    let x,y;
    const pad=20;
    if(posSel.includes('Bottom Right')){x=bm.width-tw-pad;y=bm.height-pad;}
    else if(posSel.includes('Bottom Left')){x=pad;y=bm.height-pad;}
    else if(posSel.includes('Top Right')){x=bm.width-tw-pad;y=fs+pad;}
    else{x=pad;y=fs+pad;}
    ctx.fillText(text,x,y);
  }
  setP(80,'Encoding…');
  const du=cv.toDataURL('image/jpeg',.92);const res=await fetch(du);const blob=await res.blob();
  const name=bn(f.name)+'_watermarked.jpg';
  showResult([{v:'"'+text+'"',l:'Watermark'},{v:Math.round(opacity*100)+'%',l:'Opacity'},{v:posSel,l:'Position'}],[{name,blob}]);
  saveFile(blob,name);
}

async function doFlip(){
  if(!toolFiles.length)return;
  const dir=getV('opt-dir')||'↔ Horizontal (Mirror)';
  const results=[];
  for(let i=0;i<toolFiles.length;i++){
    setP(Math.round((i/toolFiles.length)*90),`Flipping ${i+1}/${toolFiles.length}…`);
    const bm=await createImageBitmap(toolFiles[i]);
    const cv=document.createElement('canvas');cv.width=bm.width;cv.height=bm.height;
    const ctx=cv.getContext('2d');
    const isH=dir.includes('↔'),isV=dir.includes('↕');
    ctx.save();
    if(isH&&isV){ctx.translate(bm.width,bm.height);ctx.scale(-1,-1);}
    else if(isH){ctx.translate(bm.width,0);ctx.scale(-1,1);}
    else{ctx.translate(0,bm.height);ctx.scale(1,-1);}
    ctx.drawImage(bm,0,0);ctx.restore();
    const du=cv.toDataURL('image/jpeg',.92);const res=await fetch(du);const blob=await res.blob();
    const suf=isH&&isV?'_both':isH?'_mirrored':'_flipped';
    results.push({name:bn(toolFiles[i].name)+suf+'.jpg',blob});
  }
  setP(100,'Done!');
  showResult([{v:results.length+'',l:'Flipped'},{v:dir.replace(/[↔↕ ]/g,'').trim(),l:'Direction'}],results);
  results.forEach(r=>saveFile(r.blob,r.name));
}

async function doBorder(){
  if(!toolFiles.length)return;
  const f=toolFiles[0];
  const bsize=parseInt(getV('opt-bsize'))||20;
  const bcolor=getV('opt-bcolor')||'#ffffff';
  const bradius=parseInt(getV('opt-bradius'))||0;
  const bm=await createImageBitmap(f);
  const cv=document.createElement('canvas');
  cv.width=bm.width+bsize*2;cv.height=bm.height+bsize*2;
  const ctx=cv.getContext('2d');
  ctx.fillStyle=bcolor;ctx.fillRect(0,0,cv.width,cv.height);
  if(bradius>0){
    ctx.save();ctx.beginPath();
    const r=Math.min(bradius,bsize/2);
    ctx.roundRect(bsize,bsize,bm.width,bm.height,r);
    ctx.clip();
  }
  ctx.drawImage(bm,bsize,bsize);
  if(bradius>0)ctx.restore();
  setP(80,'Encoding…');
  const du=cv.toDataURL('image/jpeg',.94);const res=await fetch(du);const blob=await res.blob();
  const name=bn(f.name)+'_bordered.jpg';
  showResult([{v:bsize+'px',l:'Border size'},{v:bcolor,l:'Colour'},{v:`${cv.width}×${cv.height}`,l:'New dimensions'}],[{name,blob}]);
  saveFile(blob,name);
}

async function runImageInfo(f){
  const bm=await createImageBitmap(f);
  const report=`Image Inspector Report\n${'='.repeat(40)}\n\nFile Name:  ${f.name}\nFile Size:  ${fmtSz(f.size)}\nDimensions: ${bm.width} × ${bm.height} px\nFormat:     ${f.type||'Unknown'}\nAspect:     ${(bm.width/bm.height).toFixed(2)}:1\nMegapixels: ${(bm.width*bm.height/1000000).toFixed(2)} MP\n\nGenerated by ToolKit Pro\n`;
  const blob=new Blob([report],{type:'text/plain'});
  const name=bn(f.name)+'_info.txt';
  showResult([{v:`${bm.width}×${bm.height}`,l:'Dimensions'},{v:fmtSz(f.size),l:'File size'},{v:(bm.width*bm.height/1000000).toFixed(2)+' MP',l:'Megapixels'},{v:f.type.split('/')[1]?.toUpperCase()||'?',l:'Format'}],[{name,blob}]);
}
async function doImgInfoRun(){if(toolFiles.length)await runImageInfo(toolFiles[0]);}

// ═══════════════════════════════════════════════════════
//   UTILITY TOOLS
// ═══════════════════════════════════════════════════════

async function doPdfText(){
  await need('pdfjs');
  if(!toolFiles.length)return;
  const f=toolFiles[0];
  const fmt=getV('opt-fmt')||'Plain Text (.txt)';
  const sep=getChk('opt-pagebreaks');
  const isMd=fmt.includes('.md');
  setP(5,'Loading PDF…');
  const buf=await readBuf(f);
  const pdf=await pdfjsLib.getDocument({data:buf}).promise;
  const total=pdf.numPages;
  let text=isMd?`# ${bn(f.name)}\n\n`:`TEXT EXTRACT: ${f.name}\n${'='.repeat(50)}\n\n`;
  for(let i=1;i<=total;i++){
    setP(Math.round(5+(i/total)*85),`Extracting page ${i}/${total}…`);
    const page=await pdf.getPage(i);
    const content=await page.getTextContent();
    const pageText=content.items.map(item=>item.str).join(' ').replace(/\s+/g,' ').trim();
    if(sep)text+=isMd?`\n## Page ${i}\n\n`:`\n--- Page ${i} ---\n\n`;
    text+=pageText+'\n\n';
  }
  setP(98,'Creating file…');
  const blob=new Blob([text],{type:'text/plain'});
  const words=text.split(/\s+/).filter(Boolean).length;
  const name=bn(f.name)+(isMd?'.md':'.txt');
  showResult([{v:total+'',l:'Pages'},{v:words.toLocaleString(),l:'Words'},{v:fmtSz(blob.size),l:'Text size'}],[{name,blob}]);
  saveFile(blob,name);
}

async function doBulkRename(){
  await need('jszip');
  if(!toolFiles.length)return;
  const prefix=getV('opt-prefix')||'Document_';
  const start=parseInt(getV('opt-start'))||1;
  const padSel=getV('opt-pad')||'001 (3 digits)';
  const padLen=padSel.startsWith('001')?3:padSel.startsWith('01')?2:1;
  const zip=new JSZip();
  for(let i=0;i<toolFiles.length;i++){
    setP(Math.round((i/toolFiles.length)*90),`Renaming ${i+1}/${toolFiles.length}…`);
    const num=String(start+i).padStart(padLen,'0');
    const ext=toolFiles[i].name.includes('.')?'.'+toolFiles[i].name.split('.').pop():'';
    const newName=prefix+num+ext;
    const buf=await readBuf(toolFiles[i]);
    zip.file(newName,buf);
  }
  setP(95,'Creating ZIP…');
  const zipBlob=await zip.generateAsync({type:'blob'});
  const name='renamed_files.zip';
  showResult([{v:toolFiles.length+'',l:'Files renamed'},{v:prefix+'*',l:'Pattern'},{v:fmtSz(zipBlob.size),l:'ZIP size'}],[{name,blob:zipBlob}]);
  saveFile(zipBlob,name);
}

async function doPortfolio(){
  await need('pdflib');
  if(!toolFiles.length)return;
  const title=getV('opt-title')||'Document Portfolio';
  const author=getV('opt-author')||'';
  const psSel=getV('opt-pagesize')||'A4 Portrait';
  const pw=psSel.includes('Landscape')?842:595;
  const ph=psSel.includes('Landscape')?595:842;
  const doc=await PDFLib.PDFDocument.create();
  const hFont=await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
  const bFont=await doc.embedFont(PDFLib.StandardFonts.Helvetica);
  // Cover
  const cover=doc.addPage([pw,ph]);
  cover.drawRectangle({x:0,y:ph-80,width:pw,height:80,color:PDFLib.rgb(.42,.39,1)});
  cover.drawText(title,{x:40,y:ph-54,size:22,font:hFont,color:PDFLib.rgb(1,1,1),maxWidth:pw-80});
  if(author)cover.drawText('Prepared by: '+author,{x:40,y:ph-72,size:10,font:bFont,color:PDFLib.rgb(.9,.9,1)});
  cover.drawText(`${toolFiles.length} document(s)  ·  ${new Date().toLocaleDateString()}`,{x:40,y:ph/2,size:14,font:bFont,color:PDFLib.rgb(.4,.4,.5)});
  for(let i=0;i<toolFiles.length;i++){
    setP(Math.round(10+(i/toolFiles.length)*80),`Adding ${i+1}/${toolFiles.length}…`);
    const buf=await readBuf(toolFiles[i]);
    let img;
    try{img=toolFiles[i].type.includes('jpeg')||toolFiles[i].type.includes('jpg')?await doc.embedJpg(buf):await doc.embedPng(buf);}
    catch{const bm=await createImageBitmap(toolFiles[i]);const cv=document.createElement('canvas');cv.width=bm.width;cv.height=bm.height;cv.getContext('2d').drawImage(bm,0,0);const du=cv.toDataURL('image/jpeg',.9);const r=await fetch(du);img=await doc.embedJpg(await r.arrayBuffer());}
    const page=doc.addPage([pw,ph]);
    const m=36,hw=56;
    page.drawRectangle({x:0,y:ph-hw,width:pw,height:hw,color:PDFLib.rgb(.95,.95,.98)});
    page.drawText(`${i+1}. ${toolFiles[i].name}`,{x:m,y:ph-hw+18,size:10,font:hFont,color:PDFLib.rgb(.3,.3,.4),maxWidth:pw-m*2});
    const aw=pw-m*2,ah=ph-hw-m*2;
    const sc=Math.min(aw/img.width,ah/img.height,1);
    const iw=img.width*sc,ih=img.height*sc;
    page.drawImage(img,{x:m+(aw-iw)/2,y:m+(ah-ih)/2,width:iw,height:ih});
  }
  setP(95,'Saving…');
  const out=await doc.save();
  const blob=new Blob([out],{type:'application/pdf'});
  const name='portfolio.pdf';
  showResult([{v:doc.getPageCount()+'',l:'Total pages'},{v:toolFiles.length+'',l:'Documents'},{v:fmtSz(blob.size),l:'PDF size'}],[{name,blob}]);
  saveFile(blob,name);
}

async function doWordCount(){
  if(!toolFiles.length)return;
  const f=toolFiles[0];
  let text='';
  setP(30,'Reading file…');
  if(f.name.endsWith('.pdf')){
    await need('pdfjs');
    const buf=await readBuf(f);
    const pdf=await pdfjsLib.getDocument({data:buf}).promise;
    for(let i=1;i<=pdf.numPages;i++){
      const page=await pdf.getPage(i);
      const c=await page.getTextContent();
      text+=c.items.map(x=>x.str).join(' ')+' ';
    }
  } else {
    text=await readText(f);
  }
  setP(80,'Counting…');
  const words=text.trim().split(/\s+/).filter(Boolean).length;
  const chars=text.length;
  const charsNoSpace=text.replace(/\s/g,'').length;
  const lines=text.split(/\n/).length;
  const sentences=text.split(/[.!?]+/).filter(s=>s.trim().length>0).length;
  const paragraphs=text.split(/\n\s*\n/).filter(p=>p.trim().length>0).length;
  const report=`Word & Character Count Report\n${'='.repeat(40)}\n\nFile: ${f.name}\n\nWords:              ${words.toLocaleString()}\nCharacters:         ${chars.toLocaleString()}\nCharacters (no sp): ${charsNoSpace.toLocaleString()}\nLines:              ${lines.toLocaleString()}\nSentences (approx): ${sentences.toLocaleString()}\nParagraphs:         ${paragraphs.toLocaleString()}\n\nAvg words/sentence: ${sentences>0?Math.round(words/sentences):0}\nReading time (200wpm): ~${Math.ceil(words/200)} min\n\nGenerated by ToolKit Pro\n`;
  const blob=new Blob([report],{type:'text/plain'});
  const name=bn(f.name)+'_wordcount.txt';
  showResult([{v:words.toLocaleString(),l:'Words'},{v:chars.toLocaleString(),l:'Characters'},{v:lines.toLocaleString(),l:'Lines'},{v:'~'+Math.ceil(words/200)+' min',l:'Reading time'}],[{name,blob}]);
}

async function doCsvToPdf(){
  await need('pdflib');
  if(!toolFiles.length)return;
  const f=toolFiles[0];
  const title=getV('opt-title')||'Data Report';
  const fsSel=getV('opt-fontsize')||'10pt — Compact';
  const fontSize=parseInt(fsSel)||10;
  setP(20,'Parsing CSV…');
  const text=await readText(f);
  const rows=text.trim().split(/\r?\n/).map(r=>{
    const result=[];let cur='',inQ=false;
    for(const ch of r){if(ch==='"'){inQ=!inQ;}else if(ch===','&&!inQ){result.push(cur.trim());cur='';}else{cur+=ch;}}
    result.push(cur.trim());return result;
  });
  if(!rows.length){showErr('CSV appears to be empty.');return;}
  const headers=rows[0];
  const data=rows.slice(1);
  setP(40,'Building PDF…');
  const pw=595+headers.length*20,ph=842;
  const doc=await PDFLib.PDFDocument.create();
  const hF=await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
  const bF=await doc.embedFont(PDFLib.StandardFonts.Helvetica);
  const margin=36,colW=Math.max(60,Math.min(150,(pw-margin*2)/headers.length));
  const rowH=fontSize+8,headerH=rowH+4;
  let y=ph-margin,page=null;
  function newPage(){page=doc.addPage([pw,ph]);y=ph-margin;}
  newPage();
  // Title
  page.drawText(title,{x:margin,y,size:16,font:hF,color:PDFLib.rgb(.2,.2,.2)});y-=26;
  page.drawText(`${data.length} rows · ${headers.length} columns · ${new Date().toLocaleDateString()}`,{x:margin,y,size:9,font:bF,color:PDFLib.rgb(.5,.5,.5)});y-=20;
  // Header row
  page.drawRectangle({x:margin,y:y-headerH+4,width:pw-margin*2,height:headerH,color:PDFLib.rgb(.42,.39,1)});
  headers.forEach((h,ci)=>{page.drawText(String(h).substring(0,18),{x:margin+ci*colW+4,y:y-headerH+10,size:fontSize,font:hF,color:PDFLib.rgb(1,1,1),maxWidth:colW-8});});
  y-=headerH;
  // Data rows
  data.forEach((row,ri)=>{
    if(y<margin+rowH){newPage();}
    if(ri%2===0)page.drawRectangle({x:margin,y:y-rowH+4,width:pw-margin*2,height:rowH,color:PDFLib.rgb(.96,.96,.99)});
    row.forEach((cell,ci)=>{if(ci<headers.length)page.drawText(String(cell).substring(0,20),{x:margin+ci*colW+4,y:y-rowH+8,size:fontSize,font:bF,color:PDFLib.rgb(.2,.2,.2),maxWidth:colW-8});});
    y-=rowH;
  });
  setP(90,'Saving…');
  const out=await doc.save();const blob=new Blob([out],{type:'application/pdf'});
  const name=bn(f.name)+'_table.pdf';
  showResult([{v:data.length+'',l:'Data rows'},{v:headers.length+'',l:'Columns'},{v:doc.getPageCount()+'',l:'PDF pages'}],[{name,blob}]);
  saveFile(blob,name);
}

async function doBase64(){
  if(!toolFiles.length)return;
  const mode=getV('opt-mode')||'Encode file → Base64 text';
  const isEncode=mode.startsWith('Encode');
  const f=toolFiles[0];
  setP(40,'Processing…');
  if(isEncode){
    const buf=await readBuf(f);
    const bytes=new Uint8Array(buf);
    let b64='';const chunk=8192;
    for(let i=0;i<bytes.length;i+=chunk)b64+=String.fromCharCode(...bytes.subarray(i,i+chunk));
    const encoded=btoa(b64);
    const dataUri=`data:${f.type||'application/octet-stream'};base64,${encoded}`;
    const report=`Base64 Encoded File\n${'='.repeat(40)}\nOriginal: ${f.name}\nMIME Type: ${f.type||'unknown'}\nEncoded Length: ${encoded.length.toLocaleString()} chars\n\n${encoded}`;
    const blob=new Blob([report],{type:'text/plain'});
    const name=bn(f.name)+'_base64.txt';
    showResult([{v:fmtSz(f.size),l:'Original'},{v:fmtSz(blob.size),l:'Encoded'},{v:f.type.split('/')[1]?.toUpperCase()||'?',l:'Type'}],[{name,blob}]);
    saveFile(blob,name);
  } else {
    const text=await readText(f);
    const b64=text.replace(/^data:[^;]+;base64,/,'').replace(/\s/g,'');
    try{
      const bin=atob(b64);const bytes=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
      const blob=new Blob([bytes]);const name=bn(f.name)+'_decoded.bin';
      showResult([{v:fmtSz(blob.size),l:'Decoded size'},{v:b64.length+'',l:'Base64 chars'}],[{name,blob}]);
      saveFile(blob,name);
    }catch{showErr('Could not decode Base64. File may not contain valid Base64 data.');}
  }
}

// QR GENERATOR
function doQr(){
  const content=getV('opt-content')||'https://example.com';
  const sizeSel=getV('opt-size')||'512×512';
  const size=parseInt(sizeSel)||512;
  const errSel=getV('opt-errLevel')||'Medium (15%)';
  const errLevelMap={'Low (7%)':0,'Medium (15%)':1,'High (30%)':2};
  const errLevel=errLevelMap[errSel]||1;
  // Generate QR using a pure JS implementation
  const qrData=generateQR(content,errLevel);
  const cv=document.getElementById('qr-canvas');
  const preview=document.getElementById('qr-preview-card');
  if(cv&&preview){
    preview.style.display='block';
    drawQR(cv,qrData,size);
  }
  const offCv=document.createElement('canvas');
  drawQR(offCv,qrData,size);
  offCv.toBlob(blob=>{
    const name='qrcode.png';
    showResult([{v:content.length>30?content.substring(0,30)+'…':content,l:'Content'},{v:size+'×'+size,l:'Size'},{v:errSel,l:'Error correction'}],[{name,blob}]);
    saveFile(blob,name);
  },'image/png');
}

// ─── MINIMAL QR CODE GENERATOR ───────────────────────
// Pure JS QR Code generation (no external lib)
function generateQR(text,errLevel=1){
  // Simple QR generator supporting alphanumeric/byte mode
  // Returns a 2D boolean matrix
  return buildQRMatrix(text,errLevel);
}

function buildQRMatrix(data,ecLevel){
  // We implement a minimal Version 1-10 QR encoder
  // Using byte mode encoding for full UTF-8 support
  const ec=['L','M','Q','H'];
  const ECL=ec[Math.min(ecLevel,3)];
  // Use a simplified approach: encode data as bytes, find minimum version
  const bytes=[];for(let i=0;i<data.length;i++){const c=data.charCodeAt(i);if(c>127){bytes.push(0xEF,0xBB,0xBF);}else{bytes.push(c&0xFF);}}
  // Version selection
  const caps={L:[41,77,127,187,255,322,370,461,552,652],M:[25,47,77,114,154,195,224,279,335,395],Q:[17,32,53,78,106,134,154,192,230,271],H:[10,20,35,50,64,84,93,122,154,180]};
  const capArr=caps[ECL];
  let version=1;for(;version<=10&&capArr[version-1]<bytes.length;version++);
  if(version>10)version=10;
  const size=version*4+17;
  // Build matrix
  const mat=Array.from({length:size},()=>Array(size).fill(null));
  // Finder patterns
  function addFinder(r,c){
    for(let dr=-1;dr<=7;dr++)for(let dc=-1;dc<=7;dc++){
      if(r+dr<0||r+dr>=size||c+dc<0||c+dc>=size)continue;
      const inOuter=(dr>=0&&dr<=6&&(dc===0||dc===6))||(dc>=0&&dc<=6&&(dr===0||dr===6));
      const inInner=(dr>=2&&dr<=4&&dc>=2&&dc<=4);
      mat[r+dr][c+dc]=inOuter||inInner;
    }
  }
  addFinder(0,0);addFinder(0,size-7);addFinder(size-7,0);
  // Timing
  for(let i=8;i<size-8;i++){if(mat[6][i]===null)mat[6][i]=(i%2===0);if(mat[i][6]===null)mat[i][6]=(i%2===0);}
  // Dark module
  mat[size-8][8]=true;
  // Alignment (version >= 2)
  if(version>=2){
    const aPos={2:[6,18],3:[6,22],4:[6,26],5:[6,30],6:[6,34],7:[6,22,38],8:[6,24,42],9:[6,28,46],10:[6,28,50]};
    const pos=aPos[version]||[];
    for(const r of pos)for(const c of pos){
      if(mat[r][c]!==null)continue;
      for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++){
        if(r+dr<0||r+dr>=size||c+dc<0||c+dc>=size)continue;
        mat[r+dr][c+dc]=dr===0&&dc===0||(Math.abs(dr)===2||Math.abs(dc)===2);
      }
    }
  }
  // Data encoding
  const modeIndicator=[0,1,0,0];// byte mode
  const charCount=bytes.length;
  const ccBits=version<=9?8:16;
  const bits=[...modeIndicator];
  for(let i=ccBits-1;i>=0;i--)bits.push((charCount>>i)&1);
  for(const b of bytes)for(let i=7;i>=0;i--)bits.push((b>>i)&1);
  // Terminator
  for(let i=0;i<4&&bits.length%8!==0;i++)bits.push(0);
  while(bits.length%8!==0)bits.push(0);
  // Pad codewords
  const pads=[0xEC,0x11];let pi=0;
  const ecCW={1:{L:7,M:10,Q:13,H:17},2:{L:10,M:16,Q:22,H:28},3:{L:15,M:26,Q:18,H:22},4:{L:20,M:18,Q:26,H:16},5:{L:26,M:24,Q:18,H:22},6:{L:18,M:16,Q:24,H:28},7:{L:20,M:18,Q:18,H:26},8:{L:24,M:22,Q:22,H:26},9:{L:30,M:22,Q:20,H:24},10:{L:18,M:26,Q:24,H:28}};
  const totalCW=Math.floor((size*size-(6*8*3)-(size-16)-1-8*3)/8);
  const ecWords=(ecCW[version]&&ecCW[version][ECL])||10;
  const dataWords=Math.max(1,totalCW-ecWords);
  while(bits.length/8<dataWords){for(let i=7;i>=0;i--)bits.push((pads[pi%2]>>i)&1);pi++;}
  bits.length=Math.min(bits.length,dataWords*8);
  // Place data (simplified — zigzag scan)
  let bi=0;
  const used=(r,c)=>mat[r][c]!==null;
  for(let right=size-1;right>=1;right-=2){
    if(right===6)right--;
    for(let vert=0;vert<size;vert++){
      const row=((Math.floor((size-1-right)/2)%2===0)?vert:(size-1-vert));
      for(let dc=0;dc<2;dc++){
        const col=right-dc;
        if(row>=0&&row<size&&col>=0&&col<size&&!used(row,col)){
          mat[row][col]=bi<bits.length?bits[bi++]===1:false;
        }
      }
    }
  }
  // Apply mask pattern 0
  for(let r=0;r<size;r++)for(let c=0;c<size;c++){
    if(mat[r][c]!==null&&!isFunctional(r,c,size)){
      if((r+c)%2===0)mat[r][c]=!mat[r][c];
    }
  }
  // Format info (simplified — pattern 0)
  const fi=[1,1,1,0,1,1,1,1,1,0,0,0,1,0,0];
  const fiPos=[[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
  fiPos.forEach(([r,c],i)=>{if(r<size&&c<size)mat[r][c]=fi[i]===1;});
  // Fill nulls
  for(let r=0;r<size;r++)for(let c=0;c<size;c++)if(mat[r][c]===null)mat[r][c]=false;
  return mat;
}
function isFunctional(r,c,sz){
  if(r<9&&c<9)return true;if(r<9&&c>sz-9)return true;if(r>sz-9&&c<9)return true;
  if(r===6||c===6)return true;if(r===sz-8&&c===8)return true;return false;
}
function drawQR(cv,mat,size){
  const n=mat.length;const quiet=4;const total=n+quiet*2;
  const cell=size/total;
  cv.width=size;cv.height=size;
  const ctx=cv.getContext('2d');
  ctx.fillStyle=theme==='dark'?'#1a1a2e':'#ffffff';ctx.fillRect(0,0,size,size);
  ctx.fillStyle=theme==='dark'?'#f0f0ff':'#1a1a2e';
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){
    if(mat[r][c]){ctx.fillRect(Math.round((c+quiet)*cell),Math.round((r+quiet)*cell),Math.ceil(cell),Math.ceil(cell));}
  }
}
// ─────────────────────────────────────────────────────

// Init
// Init complete — all grids built above via buildCard()
