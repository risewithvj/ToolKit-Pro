'use strict';
/* ═══════════════════════════════════════════
   tools2.js — Text/Office · Security · Media · Dev · Util
   All QA fixes applied, all reference UX matched
═══════════════════════════════════════════ */

// ════════ TEXT & OFFICE ════════

function doTC() {
  const text = gv('opt-inputText') || '';
  if (!text || text === 'Paste your text here…') throw new Error('Paste some text into the input field above.');
  const ct = gv('opt-case') || 'Title Case'; let out = '';
  switch(ct) {
    case 'UPPERCASE':     out = text.toUpperCase(); break;
    case 'lowercase':     out = text.toLowerCase(); break;
    case 'Title Case':    out = text.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase()); break;
    case 'Sentence case': out = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase()); break;
    case 'camelCase':     out = text.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()); out = out.charAt(0).toLowerCase() + out.slice(1); break;
    case 'PascalCase':    out = text.replace(/(?:^|\s+|[^a-zA-Z0-9]+)(\w)/g, (_, c) => c.toUpperCase()); break;
    case 'snake_case':    out = text.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,''); break;
    case 'kebab-case':    out = text.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''); break;
    case 'CONSTANT_CASE': out = text.toUpperCase().replace(/\s+/g,'_').replace(/[^A-Z0-9_]/g,''); break;
    default: out = text;
  }
  showTO(out);
  const blob = new Blob([out], { type:'text/plain' });
  showRes([{ v:ct, l:'Case' }, { v:out.split(/\s+/).filter(Boolean).length+'', l:'Words' }, { v:out.length+'', l:'Chars' }], [{ name:'converted.txt', blob }]);
}

const LW = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure dolor reprehenderit voluptate velit esse cillum dolore fugiat nulla pariatur excepteur sint occaecat cupidatat non proident culpa officia deserunt mollit anim laborum'.split(' ');
function doLorem() {
  const type = gv('opt-type')||'Paragraphs', count = Math.min(parseInt(gv('opt-count'))||3, 50), sl = gk('opt-startLorem');
  const rw = () => LW[Math.floor(Math.random()*LW.length)];
  const sent = () => { const w = Array.from({length:6+Math.floor(Math.random()*10)},rw); w[0]=w[0][0].toUpperCase()+w[0].slice(1); return w.join(' ')+'.'; };
  const para = () => Array.from({length:4+Math.floor(Math.random()*4)},sent).join(' ');
  let out = '';
  if (type==='Words') { const w=Array.from({length:count},rw); if(sl){w[0]='Lorem';if(count>1)w[1]='ipsum';} out=w.join(' '); }
  else if (type==='Sentences') { const s=Array.from({length:count},sent); if(sl)s[0]='Lorem ipsum dolor sit amet, consectetur adipiscing elit.'; out=s.join(' '); }
  else { const p=Array.from({length:count},para); if(sl)p[0]='Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'; out=p.join('\n\n'); }
  showTO(out);
  const blob = new Blob([out],{type:'text/plain'});
  showRes([{v:count+'',l:type},{v:out.split(/\s+/).filter(Boolean).length+'',l:'Words'}],[{name:'lorem.txt',blob}]);
}

async function doFR() {
  if (!toolFiles.length) return; const f=toolFiles[0], find=gv('opt-find'), replace=gv('opt-replace')||'';
  if (!find) throw new Error('Enter the text you want to find.');
  const useRx=gk('opt-regex'), ci=gk('opt-ci');
  setP(20,'Reading…'); const text=await readText(f); setP(60,'Replacing…');
  let result, count=0;
  try { const flags='g'+(ci?'i':''); const pat=useRx?new RegExp(find,flags):new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),flags); result=text.replace(pat,m=>{count++;return replace;}); }
  catch(e){throw new Error('Invalid regex: '+e.message);}
  showTO(result.substring(0,3000)+(result.length>3000?'\n…[preview truncated — download for full result]':''));
  const blob=new Blob([result],{type:'text/plain'}); const name=bn(f.name)+'_replaced.txt';
  showRes([{v:count+'',l:'Replacements'},{v:'"'+find+'"',l:'Searched for'},{v:fmtSz(blob.size),l:'Output'}],[{name,blob}]);
  saveFile(blob,name);
}

async function doJSON() {
  if (!toolFiles.length) return; const f=toolFiles[0], mode=gv('opt-mode')||'Beautify', indent=gv('opt-indent')||'2 spaces', text=await readText(f);
  try {
    const parsed=JSON.parse(text); let r;
    if (mode==='Beautify') { const sp=indent.startsWith('Tab')?'\t':indent.startsWith('4')?'    ':'  '; r=JSON.stringify(parsed,null,sp); }
    else if (mode==='Minify') r=JSON.stringify(parsed);
    else r=`✓ Valid JSON\nType: ${Array.isArray(parsed)?'Array':'Object'}\nEntries: ${Array.isArray(parsed)?parsed.length:Object.keys(parsed).length}\nSize: ${fmtSz(text.length)}`;
    showTO(r.substring(0,4000));
    const blob=new Blob([r],{type:'application/json'}); const name=bn(f.name)+(mode==='Minify'?'.min':'_fmt')+'.json';
    showRes([{v:'✓ Valid',l:'JSON'},{v:mode,l:'Mode'},{v:fmtSz(blob.size),l:'Output'}],[{name,blob}]);
    saveFile(blob,name);
  } catch(e) { throw new Error('Invalid JSON: '+e.message); }
}

async function doXML() {
  if (!toolFiles.length) return; const f=toolFiles[0], mode=gv('opt-mode')||'Beautify', indent=gv('opt-indent')||'2 spaces', text=await readText(f);
  const parser=new DOMParser(); const doc=parser.parseFromString(text,'application/xml'); const err=doc.querySelector('parsererror');
  if (err) throw new Error('Invalid XML: '+err.textContent.substring(0,200));
  let r;
  if (mode==='Minify') r=text.replace(/>\s+</g,'><').replace(/\s+/g,' ').trim();
  else if (mode==='Validate only') r=`✓ Valid XML\nRoot: <${doc.documentElement.tagName}>\nNamespace: ${doc.documentElement.namespaceURI||'none'}`;
  else {
    const sp=indent.startsWith('Tab')?'\t':indent.startsWith('4')?'    ':'  ';
    const fmt=(node,lvl)=>{
      if (node.nodeType===3){const t=node.textContent.trim();return t?sp.repeat(lvl)+t+'\n':'';}
      if (node.nodeType!==1) return '';
      const tag=node.tagName; const attrs=Array.from(node.attributes).map(a=>` ${a.name}="${a.value}"`).join('');
      const ch=Array.from(node.childNodes).map(c=>fmt(c,lvl+1)).join('');
      if(!ch.trim()) return sp.repeat(lvl)+`<${tag}${attrs}/>\n`;
      return sp.repeat(lvl)+`<${tag}${attrs}>\n${ch}${sp.repeat(lvl)}</${tag}>\n`;
    };
    r='<?xml version="1.0" encoding="UTF-8"?>\n'+fmt(doc.documentElement,0);
  }
  showTO(r.substring(0,4000));
  const blob=new Blob([r],{type:'application/xml'}); const name=bn(f.name)+(mode==='Minify'?'.min':'_fmt')+'.xml';
  showRes([{v:'✓ Valid',l:'XML'},{v:mode,l:'Mode'},{v:fmtSz(blob.size),l:'Output'}],[{name,blob}]);
  saveFile(blob,name);
}

async function doCJ() {
  if (!toolFiles.length) return; const f=toolFiles[0], dir=gv('opt-direction')||'CSV → JSON', pretty=gk('opt-pretty'), text=await readText(f);
  let r, name;
  if (dir.startsWith('CSV')) {
    const rows=text.trim().split(/\r?\n/).map(row=>{const fields=[];let field='',inQ=false;for(const ch of row){if(ch==='"')inQ=!inQ;else if(ch===','&&!inQ){fields.push(field.trim());field='';}else field+=ch;}fields.push(field.trim());return fields;});
    const headers=rows[0]; const data=rows.slice(1).filter(r=>r.some(c=>c)).map(row=>{const obj={};headers.forEach((h,i)=>obj[h]=row[i]||'');return obj;});
    r=JSON.stringify(data,null,pretty?2:0); name=bn(f.name)+'.json';
  } else {
    const data=JSON.parse(text); if(!Array.isArray(data)) throw new Error('JSON must be an array of objects.');
    const headers=Object.keys(data[0]||{}); const esc=v=>`"${String(v||'').replace(/"/g,'""')}"`;
    r=[headers.join(','),...data.map(row=>headers.map(h=>esc(row[h])).join(','))].join('\n'); name=bn(f.name)+'.csv';
  }
  showTO(r.substring(0,3000));
  const blob=new Blob([r],{type:'text/plain'});
  showRes([{v:dir,l:'Direction'},{v:fmtSz(blob.size),l:'Output'}],[{name,blob}]);
  saveFile(blob,name);
}

async function doH2P() {
  await need('pdflib'); if (!toolFiles.length) return;
  const f=toolFiles[0], ps=gv('opt-pagesize')||'A4 Portrait', mgSel=gv('opt-margin')||'Normal (20mm)';
  const mgMap={'None':0,'Small':28,'Normal':57,'Large':85}; const marg=mgMap[Object.keys(mgMap).find(k=>mgSel.startsWith(k))]||57;
  const text=await readText(f); setP(20,'Parsing HTML…');
  const stripped=text.replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s{2,}/g,' ').trim();
  setP(40,'Building PDF…');
  const doc=await PDFLib.PDFDocument.create(); let pw=595,ph=842;
  if(ps.includes('Landscape')){pw=842;ph=595;}else if(ps.includes('Letter')){pw=612;ph=792;}
  let page=doc.addPage([pw,ph]);
  const fN=await doc.embedFont(PDFLib.StandardFonts.Helvetica); const fB=await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
  const fs=11, lh=fs*1.6, maxW=pw-marg*2; let y=ph-marg;
  const wrap=(line,font)=>{const words=line.split(' ');let cur='';const ls=[];for(const w of words){const t=cur?cur+' '+w:w;if(font.widthOfTextAtSize(t,fs)<=maxW)cur=t;else{if(cur)ls.push(cur);cur=w;}}if(cur)ls.push(cur);return ls;};
  for(const rawLine of stripped.split('\n')){const wrapped=wrap(rawLine.trim(),fN);if(!wrapped.length){y-=lh/2;continue;}for(const ln of wrapped){if(y<marg+20){page=doc.addPage([pw,ph]);y=ph-marg;}page.drawText(ln,{x:marg,y,size:fs,font:fN,color:PDFLib.rgb(.1,.1,.1)});y-=lh;}}
  const out=await doc.save(); const blob=new Blob([out],{type:'application/pdf'}); const name=bn(f.name)+'.pdf';
  setP(100,'Done');
  showRes([{v:doc.getPageCount()+'',l:'Pages'},{v:fmtSz(blob.size),l:'PDF size'}],[{name,blob}]);
  saveFile(blob,name);
}

function loadHP(file) { const iframe=document.getElementById('html-iframe'); if(!iframe)return; const r=new FileReader(); r.onload=e=>{iframe.srcdoc=e.target.result;}; r.readAsText(file); const btn=document.getElementById('act-btn'); if(btn)btn.disabled=false; }
function setHV(mode) {
  const iframe=document.getElementById('html-iframe'),dt=document.getElementById('btn-dt'),mb=document.getElementById('btn-mb'); if(!iframe)return;
  if(mode==='mobile'){iframe.style.cssText='width:375px;height:500px;border:none;display:block;background:#fff;margin:0 auto;box-shadow:0 0 0 1px var(--b2)';if(mb)mb.classList.add('active');if(dt)dt.classList.remove('active');}
  else{iframe.style.cssText='width:100%;height:500px;border:none;display:block;background:#fff';if(dt)dt.classList.add('active');if(mb)mb.classList.remove('active');}
}
async function doHPExport() { if(!toolFiles.length)return; toast('Preview loaded above ↑','ok'); }

async function doInvoice() {
  await need('pdflib');
  const biz=gv('opt-bizName'),email=gv('opt-bizEmail'),client=gv('opt-clientName'),num=gv('opt-invNum')||'INV-001',date=gv('opt-invDate')||new Date().toLocaleDateString(),itemsRaw=gv('opt-items')||'',tax=parseFloat(gv('opt-tax'))||0,notes=gv('opt-notes')||'';
  setP(20,'Building invoice…');
  const doc=await PDFLib.PDFDocument.create(); const page=doc.addPage([595,842]); const {width,height}=page.getSize();
  const fB=await doc.embedFont(PDFLib.StandardFonts.HelveticaBold); const fR=await doc.embedFont(PDFLib.StandardFonts.Helvetica);
  const draw=(t,x,y,size,font,color=PDFLib.rgb(0,0,0))=>{try{page.drawText(String(t).substring(0,80),{x,y,size,font,color});}catch{}};
  const iBlue=PDFLib.rgb(.1,.2,.6),iGray=PDFLib.rgb(.45,.45,.45),iLight=PDFLib.rgb(.85,.85,.9);
  page.drawRect({x:0,y:height-80,width,height:80,color:PDFLib.rgb(.07,.07,.22)});
  draw('INVOICE',40,height-50,28,fB,PDFLib.rgb(1,1,1));
  if(biz)draw(biz,40,height-70,11,fR,PDFLib.rgb(.8,.8,.9));
  draw('#'+num,width-200,height-38,10,fR,PDFLib.rgb(1,1,1)); draw(date,width-200,height-54,10,fR,PDFLib.rgb(.8,.8,.9));
  if(email)draw(email,width-200,height-70,9,fR,PDFLib.rgb(.7,.7,.85));
  if(client){page.drawRect({x:40,y:height-148,width:200,height:50,color:PDFLib.rgb(.95,.95,.99)});draw('BILL TO',50,height-108,8,fB,iGray);draw(client.substring(0,35),50,height-122,11,fB,PDFLib.rgb(.1,.1,.25));}
  const tY=height-172; page.drawRect({x:40,y:tY-6,width:width-80,height:22,color:iBlue});
  draw('Description',50,tY,9,fB,PDFLib.rgb(1,1,1));draw('Qty',340,tY,9,fB,PDFLib.rgb(1,1,1));draw('Unit Price',390,tY,9,fB,PDFLib.rgb(1,1,1));draw('Amount',490,tY,9,fB,PDFLib.rgb(1,1,1));
  let y=tY-22,subtotal=0; const items=itemsRaw.split('\n').filter(l=>l.trim());
  items.forEach((line,i)=>{const p=line.split('|').map(s=>s.trim());if(p.length<3)return;const qty=parseFloat(p[1])||1,price=parseFloat(p[2])||0,tot=qty*price;subtotal+=tot;if(i%2===0)page.drawRect({x:40,y:y-4,width:width-80,height:18,color:PDFLib.rgb(.97,.97,.99)});draw(p[0].substring(0,45),50,y,10,fR);draw(String(qty),340,y,10,fR);draw('$'+price.toFixed(2),390,y,10,fR);draw('$'+tot.toFixed(2),490,y,10,fB);y-=20;page.drawLine({start:{x:40,y:y+2},end:{x:width-40,y:y+2},thickness:.3,color:iLight});});
  const totY=y-20,taxAmt=subtotal*(tax/100),total=subtotal+taxAmt;
  page.drawLine({start:{x:340,y:totY+28},end:{x:width-40,y:totY+28},thickness:.8,color:iBlue});
  draw('Subtotal:',370,totY+14,10,fR,iGray);draw('$'+subtotal.toFixed(2),490,totY+14,10,fR);
  if(tax>0){draw(`Tax (${tax}%):`,370,totY,10,fR,iGray);draw('$'+taxAmt.toFixed(2),490,totY,10,fR);}
  page.drawRect({x:340,y:totY-22,width:width-380,height:20,color:iBlue});
  draw('TOTAL DUE',356,totY-16,10,fB,PDFLib.rgb(1,1,1));draw('$'+total.toFixed(2),490,totY-16,11,fB,PDFLib.rgb(1,1,1));
  if(notes){draw('Notes:',40,totY-42,9,fB,iGray);draw(notes.substring(0,80),40,totY-56,9,fR,iGray);}
  page.drawLine({start:{x:40,y:32},end:{x:width-40,y:32},thickness:.5,color:iLight});
  draw('Generated with ToolKit Pro',40,20,8,fR,PDFLib.rgb(.7,.7,.7));
  const out=await doc.save(); const blob=new Blob([out],{type:'application/pdf'}); const name='invoice_'+num.replace(/[^a-zA-Z0-9]/g,'_')+'.pdf';
  setP(100,'Done');
  showRes([{v:'$'+total.toFixed(2),l:'Total'},{v:items.length+'',l:'Line items'},{v:fmtSz(blob.size),l:'PDF'}],[{name,blob}]);
  saveFile(blob,name);
}

async function doMeeting() {
  await need('pdflib');
  const meeting=gv('opt-meeting')||'Meeting',mdate=gv('opt-mdate')||new Date().toLocaleDateString(),attendees=gv('opt-attendees')||'',agenda=gv('opt-agenda')||'',decisions=gv('opt-decisions')||'',actions=gv('opt-actions')||'',next=gv('opt-nextMeeting')||'';
  setP(20,'Building…');
  const doc=await PDFLib.PDFDocument.create(); const page=doc.addPage([595,842]); const {width,height}=page.getSize();
  const fB=await doc.embedFont(PDFLib.StandardFonts.HelveticaBold); const fR=await doc.embedFont(PDFLib.StandardFonts.Helvetica);
  const draw=(t,x,y,sz,font,color=PDFLib.rgb(0,0,0))=>{try{page.drawText(String(t).substring(0,90),{x,y,size:sz,font,color});}catch{}};
  const dBlue=PDFLib.rgb(.1,.18,.55),dGray=PDFLib.rgb(.4,.4,.4),dLight=PDFLib.rgb(.85,.85,.92);
  page.drawRect({x:0,y:height-68,width,height:68,color:dBlue});
  draw('Meeting Minutes',40,height-34,18,fB,PDFLib.rgb(1,1,1));
  draw(meeting,40,height-54,11,fR,PDFLib.rgb(.8,.8,.9));
  draw(mdate,width-140,height-40,10,fR,PDFLib.rgb(.8,.8,.9));
  let y=height-88;
  const section=title=>{y-=6;draw(title.toUpperCase(),40,y,9,fB,dBlue);y-=14;page.drawLine({start:{x:40,y},end:{x:width-40,y},thickness:.5,color:dLight});y-=10;};
  const lines=text=>{if(!text.trim())return;text.trim().split('\n').forEach(line=>{if(!line.trim())return;draw(line.trim(),52,y,10,fR);y-=16;if(y<60){y=60;}});y-=6;};
  if(attendees){section('Attendees');lines(attendees);}
  if(agenda){section('Agenda');lines(agenda);}
  if(decisions){section('Key Decisions');decisions.trim().split('\n').forEach(line=>{if(!line.trim())return;page.drawCircle({x:50,y:y+4,size:2.5,color:dBlue});draw(line.trim(),60,y,10,fR);y-=16;});y-=6;}
  if(actions){section('Action Items');page.drawRect({x:40,y:y-4,width:width-80,height:18,color:dBlue});draw('Action',50,y,9,fB,PDFLib.rgb(1,1,1));draw('Owner',320,y,9,fB,PDFLib.rgb(1,1,1));draw('Due',440,y,9,fB,PDFLib.rgb(1,1,1));y-=22;actions.trim().split('\n').forEach((line,i)=>{const p=line.split('|').map(s=>s.trim());if(i%2===0)page.drawRect({x:40,y:y-4,width:width-80,height:18,color:PDFLib.rgb(.96,.96,.99)});draw(p[0]||'',50,y,9,fR);draw(p[1]||'',320,y,9,fR);draw(p[2]||'',440,y,9,fR);y-=18;});y-=6;}
  if(next){section('Next Meeting');lines(next);}
  page.drawLine({start:{x:40,y:32},end:{x:width-40,y:32},thickness:.5,color:dLight});
  draw('ToolKit Pro · Generated '+new Date().toLocaleDateString(),40,20,8,fR,PDFLib.rgb(.7,.7,.7));
  const out=await doc.save(); const blob=new Blob([out],{type:'application/pdf'}); const name='minutes_'+meeting.replace(/[^a-zA-Z0-9]/g,'_')+'.pdf';
  setP(100,'Done');
  showRes([{v:meeting,l:'Meeting'},{v:mdate,l:'Date'},{v:fmtSz(blob.size),l:'PDF'}],[{name,blob}]);
  saveFile(blob,name);
}

// ════════ SECURITY ════════

function pwStrength(p) {
  let s=0; if(p.length>=8)s++;if(p.length>=12)s++;if(p.length>=16)s++;if(/[A-Z]/.test(p))s++;if(/[a-z]/.test(p))s++;if(/[0-9]/.test(p))s++;if(/[^A-Za-z0-9]/.test(p))s++;
  if(s<=2)return{label:'Weak',color:'#ff5c5c',pct:25};
  if(s<=4)return{label:'Fair',color:'#ff9f43',pct:50};
  if(s<=5)return{label:'Good',color:'#ffd32a',pct:75};
  return{label:'Strong',color:'#1fccaa',pct:100};
}
function doPWGen() {
  const length=Math.min(parseInt(gv('opt-length'))||16,128);
  const upper=gk('opt-upper'),lower=gk('opt-lower'),numbers=gk('opt-numbers'),symbols=gk('opt-symbols'),count=Math.min(parseInt(gv('opt-count'))||5,50);
  if(!upper&&!lower&&!numbers&&!symbols) throw new Error('Enable at least one character type.');
  let chars=''; if(upper)chars+='ABCDEFGHIJKLMNOPQRSTUVWXYZ'; if(lower)chars+='abcdefghijklmnopqrstuvwxyz'; if(numbers)chars+='0123456789'; if(symbols)chars+='!@#$%^&*()_+-=[]{}|;:,.<>?';
  const gen=()=>{const a=new Uint32Array(length);crypto.getRandomValues(a);return Array.from(a,v=>chars[v%chars.length]).join('');};
  const passwords=Array.from({length:count},gen);
  const wrap=document.getElementById('tout-wrap'),tout=document.getElementById('tout');
  if(wrap)wrap.classList.add('show');
  if(tout){tout.className='tout';tout.innerHTML=`<div class="pw-list">${passwords.map(p=>{const s=pwStrength(p);return`<div class="pw-item"><div style="flex:1;min-width:0"><code style="display:block">${p}</code><div class="strength-bar"><div class="strength-fill" style="width:${s.pct}%;background:${s.color}"></div></div><div style="font-size:10px;color:${s.color};margin-top:3px;font-weight:700">${s.label}</div></div><button class="pw-cp" onclick="navigator.clipboard.writeText('${p.replace(/'/g,"\\'")}').then(()=>toast('Copied!','ok'))">Copy</button></div>`;}).join('')}</div>`;}
  const blob=new Blob([passwords.join('\n')],{type:'text/plain'});
  showRes([{v:length+' chars',l:'Length'},{v:count+'',l:'Generated'},{v:chars.length+'',l:'Char pool'}],[{name:'passwords.txt',blob}]);
}

function doUUID() {
  const type=gv('opt-type')||'UUID v4', count=Math.min(parseInt(gv('opt-count'))||10,200);
  const genUUID=()=>{const a=new Uint8Array(16);crypto.getRandomValues(a);a[6]=(a[6]&0x0f)|0x40;a[8]=(a[8]&0x3f)|0x80;const h=Array.from(a,b=>b.toString(16).padStart(2,'0'));return`${h.slice(0,4).join('')}-${h.slice(4,6).join('')}-${h.slice(6,8).join('')}-${h.slice(8,10).join('')}-${h.slice(10).join('')}`;};
  const genULID=()=>{const t=Date.now().toString(32).padStart(10,'0').toUpperCase();const chs='0123456789ABCDEFGHJKMNPQRSTVWXYZ';const a=new Uint8Array(16);crypto.getRandomValues(a);return t+Array.from(a,b=>chs[b%32]).join('').slice(0,16);};
  const genNano=()=>{const chs='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';const a=new Uint8Array(21);crypto.getRandomValues(a);return Array.from(a,b=>chs[b%64]).join('');};
  const genShort=()=>{const a=new Uint8Array(6);crypto.getRandomValues(a);return Array.from(a,b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();};
  const ids=Array.from({length:count},()=>{if(type.includes('ULID'))return genULID();if(type.includes('Nano'))return genNano();if(type.includes('Short'))return genShort();const u=genUUID();return type.includes('uppercase')?u.toUpperCase():u;});
  const wrap=document.getElementById('tout-wrap'),tout=document.getElementById('tout');
  if(wrap)wrap.classList.add('show');
  if(tout){tout.className='tout';tout.innerHTML=`<div class="uuid-list">${ids.map(id=>`<div class="uuid-item"><code>${id}</code><button class="pw-cp" onclick="navigator.clipboard.writeText('${id}').then(()=>toast('Copied!','ok'))">Copy</button></div>`).join('')}</div>`;}
  const blob=new Blob([ids.join('\n')],{type:'text/plain'});
  showRes([{v:count+'',l:'Generated'},{v:type.split(' ').slice(0,2).join(' '),l:'Format'}],[{name:'ids.txt',blob}]);
}

async function doHash() {
  if (!toolFiles.length) return; const f=toolFiles[0], algos=gv('opt-algos')||'All', expected=(gv('opt-expected')||'').trim().toLowerCase();
  setP(20,'Reading file…'); const buf=await readBuf(f); setP(60,'Computing hashes…');
  const hash=async name=>{const ab=await crypto.subtle.digest(name,buf);return Array.from(new Uint8Array(ab),b=>b.toString(16).padStart(2,'0')).join('');};
  const list=algos.includes('512')&&!algos.includes('All')?['SHA-512']:algos.includes('256')&&!algos.includes('All')?['SHA-256']:['SHA-1','SHA-256','SHA-512'];
  const hashes=await Promise.all(list.map(async a=>({algo:a,val:await hash(a)})));
  setP(95,'Done');
  const wrap=document.getElementById('tout-wrap'),tout=document.getElementById('tout');
  if(wrap)wrap.classList.add('show');
  if(tout){
    tout.className='tout';
    let matchHtml='';
    if(expected){const matched=hashes.find(h=>h.val===expected);matchHtml=matched?`<div style="padding:9px 13px;background:rgba(31,204,170,.12);border-radius:9px;color:#1fccaa;font-weight:700;margin-bottom:12px">✓ Hash verified — matches ${matched.algo}</div>`:`<div style="padding:9px 13px;background:rgba(255,92,92,.12);border-radius:9px;color:#ff5c5c;font-weight:700;margin-bottom:12px">✗ Hash mismatch — file may be modified</div>`;}
    tout.innerHTML=matchHtml+`<div class="hash-list">${hashes.map(h=>`<div class="hash-item"><div class="hash-algo">${h.algo}</div><div class="hash-val">${h.val}</div><button class="pw-cp" style="margin-top:7px" onclick="navigator.clipboard.writeText('${h.val}').then(()=>toast('Copied!','ok'))">Copy Hash</button></div>`).join('')}</div>`;
  }
  const txt=hashes.map(h=>`${h.algo}:\n${h.val}`).join('\n\n');
  const blob=new Blob([txt],{type:'text/plain'});
  showRes([{v:fmtSz(f.size),l:'File size'},{v:list.length+'',l:'Algorithms'},{v:expected?'Verified':'—',l:'Status'}],[{name:bn(f.name)+'_hashes.txt',blob}]);
}

function doURL() {
  const mode=gv('opt-mode')||'Encode URI Component', input=gv('opt-inputText')||'';
  if (!input.trim()) throw new Error('Enter some text to encode or decode.');
  let out='';
  try { if(mode==='Encode URL')out=encodeURI(input);else if(mode==='Decode URL')out=decodeURI(input);else if(mode==='Encode URI Component')out=encodeURIComponent(input);else out=decodeURIComponent(input); }
  catch(e){throw new Error('Invalid input: '+e.message);}
  showTO(out);
  const blob=new Blob([out],{type:'text/plain'});
  showRes([{v:mode.includes('Encode')?'Encoded':'Decoded',l:'Result'},{v:out.length+'',l:'Length'}],[{name:'encoded.txt',blob}]);
}

async function doTE() {
  const mode=gv('opt-mode')||'Encrypt', password=gv('opt-password'), inputText=gv('opt-inputText');
  if (!password) throw new Error('Enter a password.');
  if (!inputText?.trim()) throw new Error('Enter text to '+mode.toLowerCase()+'.');
  setP(30,mode==='Encrypt'?'Encrypting…':'Decrypting…');
  const enc=new TextEncoder();
  const keyMat=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);
  const salt=mode==='Encrypt'?crypto.getRandomValues(new Uint8Array(16)):Uint8Array.from(atob(inputText.split(':')[0]),c=>c.charCodeAt(0));
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},keyMat,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  setP(70,mode==='Encrypt'?'Finalising…':'Verifying…');
  let out='';
  if(mode==='Encrypt'){const iv=crypto.getRandomValues(new Uint8Array(12));const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(inputText));out=btoa(String.fromCharCode(...salt))+':'+btoa(String.fromCharCode(...iv))+':'+btoa(String.fromCharCode(...new Uint8Array(ct)));}
  else{const parts=inputText.split(':');if(parts.length!==3)throw new Error('Invalid ciphertext. Must be in format: salt:iv:data');const iv=Uint8Array.from(atob(parts[1]),c=>c.charCodeAt(0));const ct=Uint8Array.from(atob(parts[2]),c=>c.charCodeAt(0));try{out=new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ct));}catch{throw new Error('Decryption failed. Wrong password or corrupted data.');}}
  showTO(out);
  const blob=new Blob([out],{type:'text/plain'});
  showRes([{v:mode,l:'Mode'},{v:'AES-256-GCM',l:'Algorithm'},{v:out.length+'',l:'Chars'}],[{name:mode==='Encrypt'?'encrypted.txt':'decrypted.txt',blob}]);
}

function doBarcode() {
  const content=gv('opt-content')||'TOOLKIT-001'; if(!content.trim())throw new Error('Enter barcode content.');
  const barW=Math.min(parseInt(gv('opt-barW'))||2,5), barH=Math.min(parseInt(gv('opt-barH'))||80,200), showText=gk('opt-showText');
  const cv=document.getElementById('bc-cv'); if(!cv)return;
  const CODE128B=' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
  const PATS=['11011001100','11001101100','11001100110','10010011000','10010001100','10001001100','10011001000','10011000100','10001100100','11001001000','11001000100','11000100100','10110011100','10011011100','10011001110','10111001100','10011101100','10011100110','11001110010','11001011100','11001001110','11011100100','11001110100','11101101110','11101001100','11100101100','11100100110','11101100100','11100110100','11100110010','11011011000','11011000110','11000110110','10100011000','10001011000','10001000110','10110001000','10001101000','10001100010','11010001000','11000101000','11000100010','10110111000','10110001110','10001101110','10111011000','10111000110','10001110110','11101110110','11010001110','11000101110','11011101000','11011100010','11101011000','11101000110','11100010110','11101101000','11101100010','11100011010','11101111010','11001000010','11110001010','10100110000','10100001100','10010110000','10010000110','10000101100','10000100110','10110010000','10110000100','10011010000','10011000010','10000110100','10000110010','11000010010','11001010000','11110111010','11000010100','10001111010','10100111100','10010111100','10010011110','10111100100','10011110100','10011110010','11110100100','11110010100','11110010010','11011011110','11011110110','11110110110','10101111000','10100011110','10001011110','10111101000','10111100010','11110101000','11110100010','10111011110','10111101110','11101011110','11110101110','11010000100','11010010000','11010011100','11000111010'];
  const START_B=104,STOP=106;
  let sum=START_B; const chars=[START_B]; let valid=true;
  content.split('').forEach((c,i)=>{const idx=CODE128B.indexOf(c);if(idx<0){valid=false;return;}chars.push(idx);sum+=(i+1)*idx;});
  if(!valid)throw new Error('Content has unsupported characters. Use printable ASCII only.');
  chars.push(sum%103);chars.push(STOP);
  const bars=chars.map(c=>PATS[c]||'').join('')+'11';
  const quiet=16, totalW=bars.length*barW+quiet*2, textH=showText?20:0, totalH=barH+8+textH;
  cv.width=totalW;cv.height=totalH;
  const ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,totalW,totalH);ctx.fillStyle='#000';
  bars.split('').forEach((b,i)=>{if(b==='1')ctx.fillRect(quiet+i*barW,4,barW,barH);});
  if(showText){ctx.font=`bold ${Math.max(10,barW*5)}px monospace`;ctx.textAlign='center';ctx.fillText(content,totalW/2,totalH-3);}
  document.getElementById('bc-out')?.classList.add('show');
  cv.toBlob(blob=>{showRes([{v:content,l:'Content'},{v:'Code128',l:'Format'},{v:totalW+'×'+totalH,l:'Size'}],[{name:'barcode.png',blob}]);saveFile(blob,'barcode.png');});
}

async function doMetaScrub() {
  if (!toolFiles.length) return; const results=[]; let removed=0;
  for (let i=0;i<toolFiles.length;i++) {
    setP(Math.round((i/toolFiles.length)*90),`Scrubbing ${i+1}/${toolFiles.length}…`);
    const f=toolFiles[i];
    if (f.type.startsWith('image/')) {
      // Preserve original format — PNG stays PNG
      const bm=await createImageBitmap(f); const cv=document.createElement('canvas'); cv.width=bm.width;cv.height=bm.height; cv.getContext('2d').drawImage(bm,0,0);
      const mime=f.type==='image/png'?'image/png':f.type==='image/webp'?'image/webp':'image/jpeg';
      const ext=mime.split('/')[1]==='jpeg'?'jpg':mime.split('/')[1];
      const blob=await(await fetch(cv.toDataURL(mime,.95))).blob();
      removed+=Math.max(0,f.size-blob.size); results.push({name:bn(f.name)+'_clean.'+ext,blob});
    } else if (f.name.endsWith('.pdf')) {
      await need('pdflib');
      const doc=await PDFLib.PDFDocument.load(await readBuf(f),{ignoreEncryption:true});
      try{doc.setTitle('');doc.setAuthor('');doc.setSubject('');doc.setKeywords([]);doc.setCreator('ToolKit Pro');doc.setProducer('ToolKit Pro');}catch{}
      const out=await doc.save(); const blob=new Blob([out],{type:'application/pdf'});
      removed+=Math.max(0,f.size-blob.size); results.push({name:bn(f.name)+'_clean.pdf',blob});
    } else results.push({name:f.name,blob:f});
  }
  showRes([{v:results.length+'',l:'Files scrubbed'},{v:removed>0?fmtSz(removed):'-',l:'Data removed'}],results);
  results.forEach(r=>saveFile(r.blob,r.name));
}

async function doFEnc() {
  if (!toolFiles.length) return; const f=toolFiles[0], mode=gv('opt-mode')||'Encrypt file', password=gv('opt-password');
  if (!password) throw new Error('Enter a password.');
  if (password.length<6) throw new Error('Password must be at least 6 characters long.');
  setP(20,'Preparing…'); const buf=await readBuf(f);
  const enc=new TextEncoder(); const keyMat=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);
  const salt=mode.startsWith('Encrypt')?crypto.getRandomValues(new Uint8Array(16)):new Uint8Array(buf,0,16);
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},keyMat,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  setP(60,mode.startsWith('Encrypt')?'Encrypting…':'Decrypting…');
  if (mode.startsWith('Encrypt')) {
    const iv=crypto.getRandomValues(new Uint8Array(12)); const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,buf);
    const out=new Uint8Array(16+12+ct.byteLength); out.set(salt,0);out.set(iv,16);out.set(new Uint8Array(ct),28);
    const blob=new Blob([out]); const name=f.name+'.enc';
    showRes([{v:'Encrypted',l:'Status'},{v:'AES-256-GCM',l:'Algorithm'},{v:fmtSz(blob.size),l:'Output'}],[{name,blob}]);
    saveFile(blob,name);
  } else {
    try {
      const iv=new Uint8Array(buf,16,12); const ct=new Uint8Array(buf,28);
      const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ct);
      const origName=f.name.replace(/\.enc$/,''); const blob=new Blob([pt]);
      showRes([{v:'Decrypted',l:'Status'},{v:fmtSz(blob.size),l:'Output'}],[{name:origName,blob}]);
      saveFile(blob,origName);
    } catch { throw new Error('Decryption failed. Wrong password or corrupted file.'); }
  }
}

// ════════ MEDIA ════════

async function doICO() {
  if (!toolFiles.length) return; const f=toolFiles[0], sizesSel=gv('opt-sizes')||'16, 32, 48px (standard)';
  const sizes=sizesSel.includes('128')?[16,32,48,64,128]:sizesSel.includes('32px')?[32]:[16,32,48];
  setP(20,'Generating…');
  const bm=await createImageBitmap(f); const results=[];
  for (const sz of sizes) {
    const cv=document.createElement('canvas'); cv.width=sz;cv.height=sz; cv.getContext('2d').drawImage(bm,0,0,sz,sz);
    const blob=await(await fetch(cv.toDataURL('image/png'))).blob();
    results.push({name:`favicon_${sz}x${sz}.png`,blob});
  }
  // Generate favicon.ico (ICO with first two sizes)
  const icoSizes=sizes.slice(0,3);
  const pngBufs=await Promise.all(icoSizes.map(async sz=>{const cv=document.createElement('canvas');cv.width=sz;cv.height=sz;cv.getContext('2d').drawImage(bm,0,0,sz,sz);const url=cv.toDataURL('image/png');const res=await fetch(url);return new Uint8Array(await res.arrayBuffer());}));
  // Build ICO binary
  const icoCount=pngBufs.length; const headerSz=6+16*icoCount; let offset=headerSz;
  const header=new Uint8Array([0,0,1,0,icoCount,0]);
  const dirEntries=pngBufs.flatMap((buf,i)=>{const sz=icoSizes[i]===256?0:icoSizes[i];const entry=[sz,sz,0,0,1,0,32,0,...new Uint8Array(new Uint32Array([buf.byteLength]).buffer),...new Uint8Array(new Uint32Array([offset]).buffer)];offset+=buf.byteLength;return entry;});
  const icoBuf=new Uint8Array(offset); icoBuf.set(header);icoBuf.set(dirEntries,6);let pos=headerSz;pngBufs.forEach(buf=>{icoBuf.set(buf,pos);pos+=buf.byteLength;});
  results.push({name:'favicon.ico',blob:new Blob([icoBuf],{type:'image/x-icon'})});
  // HTML snippet
  const html=[...sizes.map(sz=>`<link rel="icon" type="image/png" sizes="${sz}x${sz}" href="favicon_${sz}x${sz}.png">`),'<link rel="shortcut icon" href="favicon.ico">'].join('\n');
  results.push({name:'favicon-code.html',blob:new Blob([html],{type:'text/html'})});
  setP(100,'Done');
  showRes([{v:sizes.join(', ')+'px',l:'PNG sizes'},{v:'Included',l:'favicon.ico'},{v:'Included',l:'HTML snippet'}],results);
  results.forEach(r=>saveFile(r.blob,r.name));
}

async function doSVGOpt() {
  if (!toolFiles.length) return;
  const removeComments=gk('opt-removeComments'),removeMetadata=gk('opt-removeMetadata'),roundDecimals=gk('opt-roundDecimals');
  const results=[];
  for (let i=0;i<toolFiles.length;i++) {
    setP(Math.round((i/toolFiles.length)*90),`Optimising ${i+1}/${toolFiles.length}…`);
    let text=await readText(toolFiles[i]);
    // Safe optimisations only
    if(removeComments) text=text.replace(/<!--(?![\s\S]*?<!--)[\s\S]*?-->/g,'');
    if(removeMetadata) text=text.replace(/<metadata[\s\S]*?<\/metadata>/gi,'').replace(/<desc>[\s\S]*?<\/desc>/gi,'').replace(/<title>[\s\S]*?<\/title>/gi,'');
    if(roundDecimals) text=text.replace(/\b(\d+\.\d{4,})\b/g,m=>parseFloat(m).toFixed(2));
    // Safe whitespace collapse (only between tags, not inside attribute values)
    text=text.replace(/>\s{2,}</g,'><').replace(/\s{2,}/g,' ').trim();
    const blob=new Blob([text],{type:'image/svg+xml'});
    results.push({name:bn(toolFiles[i].name)+'.min.svg',blob});
  }
  const origTotal=toolFiles.reduce((a,f)=>a+f.size,0);
  const newTotal=results.reduce((a,r)=>a+r.blob.size,0);
  const pct=Math.max(0,Math.round((1-newTotal/origTotal)*100));
  showRes([{v:pct+'%',l:'Size reduced'},{v:fmtSz(origTotal-newTotal),l:'Bytes saved'},{v:results.length+'',l:'Files'}],results);
  results.forEach(r=>saveFile(r.blob,r.name));
}

let _fontFaceObj=null;
async function loadFP(file) {
  const area=document.getElementById('font-prev'); if(!area)return;
  const buf=await readBuf(file); const fontName='FP_'+Date.now();
  const ff=new FontFace(fontName,buf); await ff.load(); document.fonts.add(ff); _fontFaceObj=fontName;
  area.classList.add('show');
  const previewText=gv('opt-previewText')||'The quick brown fox jumps over the lazy dog';
  const fontSize=gn('opt-fontSize')||36;
  const fmt=file.name.endsWith('.woff2')?'woff2':file.name.endsWith('.woff')?'woff':file.name.endsWith('.otf')?'opentype':'truetype';
  area.innerHTML=`
    <div style="font-family:'${fontName}',sans-serif;font-size:${fontSize}px;line-height:1.4;color:var(--t1);margin-bottom:18px;word-break:break-word;text-align:center">${previewText}</div>
    <div style="font-family:'${fontName}',sans-serif;font-size:22px;color:var(--t2);text-align:center;margin-bottom:10px;line-height:1.6">Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz</div>
    <div style="font-family:'${fontName}',sans-serif;font-size:20px;color:var(--t3);text-align:center;margin-bottom:18px">0 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ &amp; * ( ) [ ] { }</div>
    <button class="font-export-btn" onclick="exportFontPNG()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Export as PNG Specimen
    </button>
    <div class="font-css">@font-face {\n  font-family: '${bn(file.name)}';\n  src: url('${file.name}') format('${fmt}');\n  font-weight: normal;\n  font-style: normal;\n}</div>`;
  const btn=document.getElementById('act-btn'); if(btn)btn.disabled=false;
}
async function exportFontPNG() {
  if (!_fontFaceObj||!toolFiles.length) return;
  const previewText=gv('opt-previewText')||'The quick brown fox jumps';
  const fontSize=gn('opt-fontSize')||36;
  const cv=document.createElement('canvas'); cv.width=900;cv.height=300; const ctx=cv.getContext('2d');
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,900,300);
  ctx.font=`${fontSize}px '${_fontFaceObj}'`;ctx.fillStyle='#1a1a35';ctx.fillText(previewText,30,80);
  ctx.font=`22px '${_fontFaceObj}'`;ctx.fillStyle='#52527a';ctx.fillText('ABCDEFGHIJKLM NOPQRSTUVWXYZ',30,140);
  ctx.fillText('abcdefghijklmnopqrstuvwxyz  0123456789  !@#$%^&*()',30,175);
  ctx.font='10px sans-serif';ctx.fillStyle='#9090b8';ctx.fillText(toolFiles[0].name+' — ToolKit Pro Specimen',30,292);
  const blob=await(await fetch(cv.toDataURL('image/png'))).blob(); const name=bn(toolFiles[0].name)+'_specimen.png';
  saveFile(blob,name);
}
async function doFontRun() { if (!toolFiles.length) return; await exportFontPNG(); toast('Font preview ready above ↑','ok'); }

function loadVid(file) { const vid=document.getElementById('vid-el');if(!vid)return;vid.style.display='block';vid.src=URL.createObjectURL(file); }
async function doVThumb() {
  if (!toolFiles.length) return; const vid=document.getElementById('vid-el');
  if (!vid||!vid.src) { showErr('Video must load first.','Wait a moment for the video to load, then try again.'); return; }
  const time=Math.max(0,gn('opt-time')||3), quality=(gn('opt-quality')||92)/100;
  setP(30,'Seeking…');
  await new Promise((res,rej)=>{vid.currentTime=time;vid.onseeked=res;vid.onerror=()=>rej(new Error('Seek failed.'));setTimeout(()=>rej(new Error('Seek timeout')),10000);});
  setP(70,'Capturing frame…');
  const cv=document.createElement('canvas');cv.width=vid.videoWidth||1280;cv.height=vid.videoHeight||720;cv.getContext('2d').drawImage(vid,0,0);
  const blob=await(await fetch(cv.toDataURL('image/jpeg',quality))).blob(); const name=bn(toolFiles[0].name)+`_frame_${time}s.jpg`;
  showRes([{v:`${cv.width}×${cv.height}`,l:'Resolution'},{v:time+'s',l:'Timestamp'},{v:fmtSz(blob.size),l:'Size'}],[{name,blob}]);
  saveFile(blob,name);
}

// ════════ DEVELOPER ════════

function doQR() {
  const content=gv('opt-content')||''; if(!content.trim())throw new Error('Enter a URL or text to encode.');
  const sizeSel=gv('opt-size')||'512×512', sz=parseInt(sizeSel)||512;
  const errLvl=gv('opt-errLevel')||'Medium (15%)';
  const errLevel=errLvl.startsWith('Low')?'L':errLvl.startsWith('High')?'H':'M';
  const cv=document.getElementById('qr-cv'); if(!cv)return;
  const render=()=>{
    try {
      const qr=qrcode(0,errLevel); qr.addData(content); qr.make();
      const mod=qr.getModuleCount(), margin=Math.floor(sz*.06);
      const cell=Math.floor((sz-margin*2)/mod), actual=cell*mod+margin*2;
      cv.width=actual;cv.height=actual;
      const ctx=cv.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,actual,actual);ctx.fillStyle='#000000';
      for(let r=0;r<mod;r++)for(let c=0;c<mod;c++)if(qr.isDark(r,c))ctx.fillRect(margin+c*cell,margin+r*cell,cell,cell);
      document.getElementById('qr-out')?.classList.add('show');
      cv.toBlob(blob=>{showRes([{v:content.length>36?content.substring(0,36)+'…':content,l:'Content'},{v:actual+'×'+actual,l:'Size'},{v:mod+'×'+mod,l:'Modules'}],[{name:'qrcode.png',blob}]);saveFile(blob,'qrcode.png');});
    } catch(e){showErr('QR error: '+e.message+'. Try shorter content.');}
  };
  if(window.qrcode){render();return;}
  setP(20,'Loading QR library…');
  const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';
  s.onload=()=>{setP(0,'');render();};
  s.onerror=()=>showErr('Failed to load QR library.','Check your internet connection.');
  document.head.appendChild(s);
}

function doTS() {
  const mode=gv('opt-mode')||'Now (current timestamp)';
  let inputVal=gv('opt-inputVal')||'';
  if (mode==='Date → Unix') { const dt=gv('opt-dateInput'); if(dt)inputVal=dt; }
  const getWeek=d=>{const onejan=new Date(d.getFullYear(),0,1);return Math.ceil((((d-onejan)/86400000)+onejan.getDay()+1)/7);};
  const fmt=d=>{
    if(isNaN(d.getTime()))throw new Error('Invalid date or timestamp value.');
    return[['Unix (ms)',d.getTime()],['Unix (seconds)',Math.floor(d.getTime()/1000)],['ISO 8601',d.toISOString()],['Local Date/Time',d.toLocaleString()],['UTC String',d.toUTCString()],['Day of Week',d.toLocaleDateString('en',{weekday:'long'})],['Week Number','Week '+getWeek(d)],['Time Zone',Intl.DateTimeFormat().resolvedOptions().timeZone]];
  };
  let rows=[];
  if(mode==='Now (current timestamp)'){const now=new Date();rows=[['Current Unix (ms)',now.getTime()],['Current Unix (s)',Math.floor(now.getTime()/1000)],...fmt(now)].slice(0,8);}
  else if(mode==='Unix → Date (seconds)'){if(!inputVal)throw new Error('Enter a Unix timestamp in seconds.');rows=fmt(new Date(parseFloat(inputVal)*1000));}
  else if(mode==='Unix → Date (ms)'){if(!inputVal)throw new Error('Enter a Unix timestamp in milliseconds.');rows=fmt(new Date(parseFloat(inputVal)));}
  else{if(!inputVal)throw new Error('Pick a date/time using the date picker.');rows=fmt(new Date(inputVal));}
  const wrap=document.getElementById('tout-wrap'),tout=document.getElementById('tout');
  if(wrap)wrap.classList.add('show');
  if(tout){tout.className='tout';tout.innerHTML=`<div class="ts-grid">${rows.map(([k,v])=>`<div class="ts-box"><label>${k}</label><div class="ts-val">${v}</div></div>`).join('')}</div>`;}
  const txt=rows.map(([k,v])=>`${k}: ${v}`).join('\n');
  const blob=new Blob([txt],{type:'text/plain'});
  showRes([{v:mode.split(' ')[0],l:'Mode'},{v:rows.length+'',l:'Formats'}],[{name:'timestamp.txt',blob}]);
}

function doRegex() {
  const pattern=gv('opt-pattern')||''; if(!pattern)throw new Error('Enter a regex pattern above.');
  const flagsRaw=(gv('opt-flags')||'gi').split(' ')[0], testText=gv('opt-testText')||'';
  if(!testText.trim())throw new Error('Enter some test text in the field below the pattern.');
  let g; try{g=new RegExp(pattern,flagsRaw.includes('g')?flagsRaw:flagsRaw+'g');}catch(e){throw new Error('Invalid regex: '+e.message);}
  const matches=[]; let m;
  while((m=g.exec(testText))!==null&&matches.length<5000){matches.push({index:m.index,match:m[0]});if(m[0].length===0){g.lastIndex++;}if(!flagsRaw.includes('g'))break;}
  liveRegex(); // Use the live renderer
  const r=`Pattern: /${pattern}/${flagsRaw}\nMatches: ${matches.length}\n${matches.length?'\n'+matches.slice(0,100).map((m2,i)=>`[${i+1}] "${m2.match}" at position ${m2.index}`).join('\n'):''}`;
  const blob=new Blob([r],{type:'text/plain'});
  showRes([{v:matches.length+'',l:'Matches found'},{v:`/${pattern}/${flagsRaw}`,l:'Pattern'}],[{name:'regex_results.txt',blob}]);
}

function escHtml(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function doDiff() {
  const t1=document.getElementById('opt-text1')?.value||'', t2=document.getElementById('opt-text2')?.value||'';
  if(!t1.trim()&&!t2.trim())throw new Error('Enter text in both boxes to compare.');
  const lines1=t1.split('\n'), lines2=t2.split('\n');
  let html='', adds=0, dels=0, same=0;
  const maxLen=Math.max(lines1.length,lines2.length);
  for(let i=0;i<maxLen;i++){
    const l1=lines1[i], l2=lines2[i];
    if(l1===undefined){html+=`<span class="add">+ ${escHtml(l2)}</span>`;adds++;}
    else if(l2===undefined){html+=`<span class="del">- ${escHtml(l1)}</span>`;dels++;}
    else if(l1!==l2){
      // Word-level diff
      const w1=l1.split(' '),w2=l2.split(' ');
      const wd=w1.map(w=>w2.includes(w)?escHtml(w):`<span style="text-decoration:line-through;opacity:.65">${escHtml(w)}</span>`).join(' ');
      const wa=w2.map(w=>w1.includes(w)?escHtml(w):`<strong>${escHtml(w)}</strong>`).join(' ');
      html+=`<span class="del">- ${wd}</span><span class="add">+ ${wa}</span>`;dels++;adds++;
    } else{html+=`<span class="same">  ${escHtml(l1)}</span>`;same++;}
  }
  const tout=document.getElementById('tout'),wrap=document.getElementById('tout-wrap');
  if(wrap)wrap.classList.add('show');
  if(tout){tout.className='tout diff';tout.innerHTML=html||'<span class="same">  No differences — texts are identical.</span>';}
  const r=`Diff Result\nAdded: ${adds} lines  |  Removed: ${dels} lines  |  Unchanged: ${same} lines`;
  const blob=new Blob([r],{type:'text/plain'});
  showRes([{v:adds+'',l:'Lines added'},{v:dels+'',l:'Lines removed'},{v:same+'',l:'Unchanged'}],[{name:'diff.txt',blob}]);
}

// ════════ UTILITIES ════════

async function doPText() {
  await need('pdfjs'); if (!toolFiles.length) return; const f=toolFiles[0];
  const fmt=gv('opt-fmt')||'Plain Text (.txt)', pagebreaks=gk('opt-pagebreaks');
  setP(10,'Loading PDF…'); const pdf=await pdfjsLib.getDocument({data:await readBuf(f)}).promise;
  let text='';
  for(let i=1;i<=pdf.numPages;i++){setP(Math.round(10+(i/pdf.numPages)*85),`Extracting page ${i}/${pdf.numPages}…`);const page=await pdf.getPage(i);const c=await page.getTextContent();const pt=c.items.map(item=>item.str).join(' ').replace(/\s+/g,' ').trim();text+=pt;if(pagebreaks)text+='\n\n─── Page '+i+' ───\n\n';else text+='\n';}
  const ext=fmt.includes('md')?'md':'txt'; const blob=new Blob([text],{type:'text/plain'}); const name=bn(f.name)+'.'+ext;
  showTO(text.substring(0,2000)+(text.length>2000?'\n…[preview truncated — download for full text]':''));
  showRes([{v:pdf.numPages+'',l:'Pages'},{v:text.split(/\s+/).filter(Boolean).length+'',l:'Words'},{v:fmtSz(blob.size),l:'Output'}],[{name,blob}]);
  saveFile(blob,name);
}

async function doBRen() {
  if (!toolFiles.length) return; const prefix=gv('opt-prefix')||'Document_', start=parseInt(gv('opt-start'))||1, padSel=gv('opt-pad')||'001 (3 digits)';
  const padLen=padSel.startsWith('001')?3:padSel.startsWith('01')?2:0;
  await need('jszip'); const zip=new JSZip();
  toolFiles.forEach((f,i)=>{const n=start+i;const padded=padLen>0?String(n).padStart(padLen,'0'):String(n);const ext=f.name.includes('.')?'.'+f.name.split('.').pop():'';zip.file(prefix+padded+ext,f);});
  const zipBlob=await zip.generateAsync({type:'blob',compression:'STORE'}); const name='renamed_files.zip';
  showRes([{v:toolFiles.length+'',l:'Files renamed'},{v:prefix,l:'Prefix'},{v:fmtSz(zipBlob.size),l:'ZIP size'}],[{name,blob:zipBlob}]);
  saveFile(zipBlob,name);
}

async function doPFolio() {
  await need('pdflib'); if (!toolFiles.length) return;
  const title=gv('opt-title')||'Portfolio', author=gv('opt-author')||'', ps=gv('opt-pagesize')||'A4 Portrait';
  let pw=595,ph=842; if(ps.includes('Landscape')){pw=842;ph=595;}else if(ps.includes('Letter')){pw=612;ph=792;}
  const doc=await PDFLib.PDFDocument.create();
  const fB=await doc.embedFont(PDFLib.StandardFonts.HelveticaBold), fR=await doc.embedFont(PDFLib.StandardFonts.Helvetica);
  const cover=doc.addPage([pw,ph]);
  cover.drawRect({x:0,y:ph-200,width:pw,height:200,color:PDFLib.rgb(.07,.07,.22)});
  cover.drawText(title.substring(0,50),{x:40,y:ph-88,size:28,font:fB,color:PDFLib.rgb(1,1,1)});
  if(author)cover.drawText('Prepared by '+author,{x:40,y:ph-118,size:14,font:fR,color:PDFLib.rgb(.7,.7,.9)});
  cover.drawText(new Date().toLocaleDateString(),{x:40,y:ph-148,size:12,font:fR,color:PDFLib.rgb(.6,.6,.8)});
  for(let i=0;i<toolFiles.length;i++){setP(Math.round(10+(i/toolFiles.length)*85),`Embedding ${i+1}/${toolFiles.length}…`);
    const buf=await readBuf(toolFiles[i]); let img;
    try{img=(toolFiles[i].type.includes('jpeg')||toolFiles[i].type.includes('jpg'))?await doc.embedJpg(buf):await doc.embedPng(buf);}
    catch{const bm=await createImageBitmap(toolFiles[i]);const cv2=document.createElement('canvas');cv2.width=bm.width;cv2.height=bm.height;cv2.getContext('2d').drawImage(bm,0,0);img=await doc.embedJpg(await(await fetch(cv2.toDataURL('image/jpeg',.92))).arrayBuffer());}
    const page=doc.addPage([pw,ph]); const m=40,aw=pw-m*2,ah=ph-m*2-30;
    const sc=Math.min(aw/img.width,ah/img.height,1);
    page.drawImage(img,{x:m+(aw-img.width*sc)/2,y:m,width:img.width*sc,height:img.height*sc});
    page.drawText(toolFiles[i].name.substring(0,60),{x:m,y:ph-m,size:10,font:fR,color:PDFLib.rgb(.4,.4,.4)});
    page.drawText(`${i+1} / ${toolFiles.length}`,{x:pw-m-40,y:m,size:9,font:fR,color:PDFLib.rgb(.6,.6,.6)});
  }
  const out=await doc.save(); const blob=new Blob([out],{type:'application/pdf'}); const name=title.replace(/[^a-zA-Z0-9]/g,'_')+'.pdf';
  showRes([{v:toolFiles.length+'',l:'Images'},{v:doc.getPageCount()+'',l:'Pages'},{v:fmtSz(blob.size),l:'PDF'}],[{name,blob}]);
  saveFile(blob,name);
}

async function doWCount() {
  if (!toolFiles.length) return; const f=toolFiles[0]; setP(20,'Reading…');
  let text='';
  if(f.name.endsWith('.pdf')){await need('pdfjs');const pdf=await pdfjsLib.getDocument({data:await readBuf(f)}).promise;for(let i=1;i<=pdf.numPages;i++){const p=await pdf.getPage(i);const c=await p.getTextContent();text+=c.items.map(item=>item.str).join(' ');}}
  else text=await readText(f);
  const words=text.trim().split(/\s+/).filter(w=>w).length;
  const chars=text.length, charsNoSp=text.replace(/\s/g,'').length;
  const sentences=text.split(/[.!?]+/).filter(s=>s.trim()).length;
  const paragraphs=text.split(/\n{2,}/).filter(p=>p.trim()).length;
  const lines=text.split(/\n/).length;
  const uniqueWords=new Set(text.toLowerCase().split(/\s+/).filter(w=>w.replace(/[^a-zA-Z]/g,''))).size;
  const readMin=Math.ceil(words/200), speakMin=Math.ceil(words/130);
  const r=`Word Count Report — ${f.name}\n${'─'.repeat(44)}\nWords:                  ${words.toLocaleString()}\nUnique words:           ${uniqueWords.toLocaleString()}\nCharacters (with spaces): ${chars.toLocaleString()}\nCharacters (no spaces): ${charsNoSp.toLocaleString()}\nSentences:              ${sentences.toLocaleString()}\nParagraphs:             ${paragraphs.toLocaleString()}\nLines:                  ${lines.toLocaleString()}\n\nReading time (~200 wpm): ~${readMin} min\nSpeaking time (~130 wpm): ~${speakMin} min\n`;
  showTO(r);
  const blob=new Blob([r],{type:'text/plain'});
  showRes([{v:words.toLocaleString(),l:'Words'},{v:chars.toLocaleString(),l:'Characters'},{v:'~'+readMin+' min',l:'Read time'}],[{name:bn(f.name)+'_wordcount.txt',blob}]);
}

async function doC2Pdf() {
  await need('pdflib'); if(!toolFiles.length)return; const f=toolFiles[0];
  const title=gv('opt-title')||'Data Report', fsSel=gv('opt-fontsize')||'10pt — Compact';
  const fs=fsSel.startsWith('8')?8:fsSel.startsWith('12')?12:10;
  setP(10,'Parsing CSV…'); const text=await readText(f);
  const rows=text.trim().split(/\r?\n/).map(r=>{const fields=[];let field='',inQ=false;for(const ch of r){if(ch==='"')inQ=!inQ;else if(ch===','&&!inQ){fields.push(field.trim());field='';}else field+=ch;}fields.push(field.trim());return fields;});
  if(!rows.length||!rows[0].length)throw new Error('No data found in CSV file.');
  const doc=await PDFLib.PDFDocument.create();
  const fB=await doc.embedFont(PDFLib.StandardFonts.HelveticaBold), fR=await doc.embedFont(PDFLib.StandardFonts.Helvetica);
  const pw=595,ph=842,m=36,headers=rows[0];
  const numCols=Math.min(headers.length,8), colW=Math.floor((pw-m*2)/numCols);
  let page=doc.addPage([pw,ph]); let y=ph-m-20;
  page.drawRect({x:0,y:ph-50,width:pw,height:50,color:PDFLib.rgb(.1,.18,.55)});
  page.drawText(title.substring(0,50),{x:m,y:ph-33,size:16,font:fB,color:PDFLib.rgb(1,1,1)});
  page.drawText(`${rows.length-1} rows · ${headers.length} columns · ${new Date().toLocaleDateString()}`,{x:m,y:ph-47,size:8,font:fR,color:PDFLib.rgb(.7,.7,.9)});
  const drawRow=(row,isHeader,idx)=>{const lh=fs*1.85;if(y-lh<m){page=doc.addPage([pw,ph]);y=ph-m;}if(isHeader)page.drawRect({x:m,y:y-lh+2,width:pw-m*2,height:lh,color:PDFLib.rgb(.1,.18,.55)});else if(idx%2===0)page.drawRect({x:m,y:y-lh+2,width:pw-m*2,height:lh,color:PDFLib.rgb(.97,.97,.99)});row.slice(0,numCols).forEach((cell,i)=>{try{page.drawText(String(cell).substring(0,22),{x:m+i*colW+3,y,size:fs,font:isHeader?fB:fR,color:isHeader?PDFLib.rgb(1,1,1):PDFLib.rgb(.12,.12,.25)});}catch{}});y-=lh;};
  drawRow(headers,true,0); rows.slice(1).forEach((row,i)=>drawRow(row,false,i+1));
  const out=await doc.save(); const blob=new Blob([out],{type:'application/pdf'}); const name=bn(f.name)+'_table.pdf';
  setP(100,'Done');
  showRes([{v:(rows.length-1)+'',l:'Data rows'},{v:headers.length+'',l:'Columns'},{v:fmtSz(blob.size),l:'PDF'}],[{name,blob}]);
  saveFile(blob,name);
}

async function doB64() {
  if (!toolFiles.length) return; const f=toolFiles[0], mode=gv('opt-mode')||'Encode file → Base64';
  setP(20,'Processing…');
  if (mode.startsWith('Encode')) {
    const buf=await readBuf(f); setP(60,'Encoding…');
    const bytes=new Uint8Array(buf); const CHUNK=8192; let b64='';
    for(let i=0;i<bytes.length;i+=CHUNK)b64+=String.fromCharCode(...bytes.subarray(i,i+CHUNK));
    b64=btoa(b64);
    const blob=new Blob([b64],{type:'text/plain'}); const name=f.name+'.b64.txt';
    const preview=b64.substring(0,300)+(b64.length>300?'\n…['+( b64.length-300)+' more chars]':'');
    showTO(preview);
    showRes([{v:fmtSz(f.size),l:'Original'},{v:fmtSz(blob.size),l:'Base64'},{v:'+'+Math.round((blob.size/f.size-1)*100)+'%',l:'Overhead'}],[{name,blob}]);
    saveFile(blob,name);
  } else {
    const text=(await readText(f)).trim().replace(/\s/g,''); setP(60,'Decoding…');
    try {
      const bin=atob(text); const arr=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
      const blob=new Blob([arr]); const name=bn(f.name.replace(/\.b64$/,'').replace(/\.txt$/,''))||'decoded_file';
      showRes([{v:fmtSz(blob.size),l:'Decoded size'}],[{name,blob}]);
      saveFile(blob,name);
    } catch { throw new Error('Invalid Base64 data. Ensure the file contains valid Base64 text.'); }
  }
}
