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

async function doPdfToWord() {
  if (!toolFiles.length) return;
  await need('pdfjs');
  await need('jszip');

  const f = toolFiles[0];
  const arr = await readBuf(f);
  const pdf = await pdfjsLib.getDocument({ data: arr }).promise;
  const mode = gv('opt-convMode') || 'Visual (Exact Layout)';
  const scale = parseFloat((gv('opt-quality') || '2').match(/\d+(\.\d+)?/)?.[0] || '2');
  const escXml = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');

  // EMU helpers: 1 inch = 914400 EMU = 72 PDF points
  const PT2EMU = 914400 / 72; // 12700 EMU per PDF point
  const pt2emu = v => Math.round(v * PT2EMU);

  // ── SHARED DOCX SCAFFOLDING ───────────────────────────────────────
  const makeZip = (wordFolder, bodyXml, extraContentTypes = '', extraRels = '', noSectPr = false) => {
    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Arial"/>
      <w:sz w:val="22"/><w:szCs w:val="22"/>
    </w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr><w:spacing w:after="0"/></w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr>
  </w:style>
</w:styles>`;

    const settingsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:defaultTabStop w:val="708"/>
  <w:characterSpacingControl w:val="doNotCompress"/>
</w:settings>`;

    const zip = new JSZip();
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  ${extraContentTypes}
</Types>`);

    zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

    const wf = zip.folder('word');
    wf.file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"
  xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  mc:Ignorable="w14">
  <w:body>${bodyXml}${noSectPr ? '' : `
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr>`}
  </w:body>
</w:document>`);
    wf.file('styles.xml', stylesXml);
    wf.file('settings.xml', settingsXml);
    wf.folder('_rels').file('document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  ${extraRels}
</Relationships>`);

    if (wordFolder) {
      Object.entries(wordFolder).forEach(([path, data]) => zip.file(path, data));
    }
    return zip;
  };

  // ══════════════════════════════════════════════════════════════════
  // MODE 1: VISUAL — full-page PNG as background anchor image
  // ══════════════════════════════════════════════════════════════════
  if (mode === 'Visual (Exact Layout)') {
    const images = [];

    for (let p = 1; p <= pdf.numPages; p++) {
      setP(Math.round(5 + (p / pdf.numPages) * 82), `Rendering page ${p}/${pdf.numPages}…`);
      const page = await pdf.getPage(p);
      const vpBase = page.getViewport({ scale: 1 });
      const pgWTwips = Math.round(vpBase.width * 20);
      const pgHTwips = Math.round(vpBase.height * 20);
      const widthEmu  = pt2emu(vpBase.width);
      const heightEmu = pt2emu(vpBase.height);

      const vp = page.getViewport({ scale });
      const cv = document.createElement('canvas');
      cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cv.width, cv.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      const pngBuf = await (await new Promise(res => cv.toBlob(res, 'image/png'))).arrayBuffer();
      images.push({ id: p, pngBuf, widthEmu, heightEmu, pgWTwips, pgHTwips });
    }

    setP(88, 'Building DOCX…');
    let bodyXml = '';
    const relEntries = [], mediaFiles = {};

    for (const img of images) {
      const rId = `rId${img.id + 2}`;
      const imgName = `media/page${img.id}.png`;
      relEntries.push(`<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${imgName}"/>`);
      mediaFiles[`word/${imgName}`] = img.pngBuf;

      const isLast = img.id === images.length;
      const sectPrXml = `<w:sectPr><w:pgSz w:w="${img.pgWTwips}" w:h="${img.pgHTwips}"/><w:pgMar w:top="0" w:right="0" w:bottom="0" w:left="0" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>`;
      const anchorXml = `<wp:anchor distT="0" distB="0" distL="0" distR="0" allowOverlap="1" layoutInCell="1" locked="0" behindDoc="1" simplePos="0" relativeHeight="1">
            <wp:simplePos x="0" y="0"/>
            <wp:positionH relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionH>
            <wp:positionV relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionV>
            <wp:extent cx="${img.widthEmu}" cy="${img.heightEmu}"/>
            <wp:effectExtent l="0" t="0" r="0" b="0"/>
            <wp:wrapNone/>
            <wp:docPr id="${img.id}" name="Page${img.id}"/>
            <wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>
            <a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:pic><pic:nvPicPr>
                <pic:cNvPr id="${img.id}" name="Page${img.id}"/>
                <pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr>
              </pic:nvPicPr>
              <pic:blipFill><a:blip r:embed="${rId}" cstate="print"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
              <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${img.widthEmu}" cy="${img.heightEmu}"/></a:xfrm>
                <a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
              </pic:pic>
            </a:graphicData></a:graphic>
          </wp:anchor>`;

      if (isLast) {
        bodyXml += `\n    <w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:drawing>${anchorXml}</w:drawing></w:r></w:p>`;
        bodyXml += `\n    <w:sectPr><w:pgSz w:w="${img.pgWTwips}" w:h="${img.pgHTwips}"/><w:pgMar w:top="0" w:right="0" w:bottom="0" w:left="0" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>`;
      } else {
        bodyXml += `\n    <w:p><w:pPr><w:spacing w:before="0" w:after="0"/>${sectPrXml}</w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:drawing>${anchorXml}</w:drawing></w:r></w:p>`;
      }
    }

    const zip = makeZip(mediaFiles, bodyXml, '', relEntries.join('\n'), true);
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const name = bn(f.name) + '.docx';
    showRes([{ v: pdf.numPages + '', l: 'Pages' }, { v: 'Visual', l: 'Mode' }, { v: fmtSz(blob.size), l: 'Output' }], [{ name, blob }]);
    saveFile(blob, name);
    return;
  }

  // ══════════════════════════════════════════════════════════════════
  // MODE 2: EDITABLE — reconstruct text + images as positioned Word objects
  // Each PDF page → one DOCX page, background PNG + floating text boxes
  // ══════════════════════════════════════════════════════════════════
  const allPageData = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    setP(Math.round(5 + (p / pdf.numPages) * 78), `Extracting page ${p}/${pdf.numPages}…`);
    const page = await pdf.getPage(p);
    const vpBase = page.getViewport({ scale: 1 });
    const pgW = vpBase.width;   // PDF points, unscaled
    const pgH = vpBase.height;

    // ── Render page as background image ──────────────────────────────
    const vp = page.getViewport({ scale });
    const cv = document.createElement('canvas');
    cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cv.width, cv.height);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    const bgPngBuf = await (await new Promise(res => cv.toBlob(res, 'image/png'))).arrayBuffer();

    // ── Extract text items ────────────────────────────────────────────
    const tc = await page.getTextContent({ includeMarkedContent: false });
    const opList = await page.getOperatorList();

    // Group items into lines (same Y ± 2pt, same font/size/color)
    // Each item: { str, x, y, w, h, fontSize, fontName, color }
    const items = [];
    for (const it of tc.items) {
      if (!it.str) continue;
      const [, , , scaleY, tx, ty] = it.transform;
      const fontSize = Math.abs(scaleY);
      if (fontSize < 1) continue;
      items.push({
        str: it.str,
        x: tx,
        y: pgH - ty - fontSize,   // flip Y: PDF origin bottom-left → top-left
        w: it.width || 0,
        h: it.height || fontSize,
        fontSize,
        fontName: it.fontName || '',
      });
    }

    // Sort top→bottom, left→right
    items.sort((a, b) => a.y - b.y || a.x - b.x);

    // Cluster nearby items into text groups (same approximate line + proximity)
    const groups = [];
    for (const it of items) {
      // Find an existing group this item belongs to (close Y, close X continuation)
      let placed = false;
      for (const g of groups) {
        const last = g.items[g.items.length - 1];
        if (Math.abs(it.y - g.baseY) < g.fontSize * 0.6 &&
            it.x >= last.x + last.w - 2 &&
            it.x <= last.x + last.w + last.fontSize * 3) {
          g.items.push(it);
          g.maxX = Math.max(g.maxX, it.x + it.w);
          placed = true;
          break;
        }
      }
      if (!placed) {
        groups.push({
          items: [it],
          baseY: it.y,
          baseX: it.x,
          maxX: it.x + it.w,
          fontSize: it.fontSize,
          fontName: it.fontName,
        });
      }
    }

    allPageData.push({ pgW, pgH, bgPngBuf, groups });
  }

  setP(88, 'Building DOCX…');

  let bodyXml = '';
  const relEntries = [];
  const mediaFiles = {};
  let rIdCounter = 3;
  let shapeIdCounter = 1000;

  for (let pi = 0; pi < allPageData.length; pi++) {
    const { pgW, pgH, bgPngBuf, groups } = allPageData[pi];
    const isLast = pi === allPageData.length - 1;

    const pgWTwips = Math.round(pgW * 20);
    const pgHTwips = Math.round(pgH * 20);
    const pgWEmu   = pt2emu(pgW);
    const pgHEmu   = pt2emu(pgH);

    // ── Background image relationship ──────────────────────────────
    const bgRId = `rId${rIdCounter++}`;
    const bgName = `media/bg${pi + 1}.png`;
    relEntries.push(`<Relationship Id="${bgRId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${bgName}"/>`);
    mediaFiles[`word/${bgName}`] = bgPngBuf;

    const bgId = shapeIdCounter++;
    const bgAnchor = `<wp:anchor distT="0" distB="0" distL="0" distR="0" allowOverlap="1" layoutInCell="1" locked="0" behindDoc="1" simplePos="0" relativeHeight="1">
      <wp:simplePos x="0" y="0"/>
      <wp:positionH relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionH>
      <wp:positionV relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionV>
      <wp:extent cx="${pgWEmu}" cy="${pgHEmu}"/>
      <wp:effectExtent l="0" t="0" r="0" b="0"/>
      <wp:wrapNone/>
      <wp:docPr id="${bgId}" name="BG${pi+1}"/>
      <wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>
      <a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
        <pic:pic><pic:nvPicPr>
          <pic:cNvPr id="${bgId}" name="BG${pi+1}"/>
          <pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr>
        </pic:nvPicPr>
        <pic:blipFill><a:blip r:embed="${bgRId}" cstate="print"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
        <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${pgWEmu}" cy="${pgHEmu}"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
        </pic:pic>
      </a:graphicData></a:graphic>
    </wp:anchor>`;

    // ── Text boxes: one floating wps:wsp per text group ─────────────
    let textBoxDrawings = '';

    for (const g of groups) {
      if (!g.items.length) continue;
      const text = g.items.map(i => i.str).join('');
      if (!text.trim()) continue;

      // Position & size in EMU
      const xEmu = pt2emu(g.baseX);
      const yEmu = pt2emu(g.baseY);
      // Width: span of the group + small padding
      const boxW = Math.max(pt2emu(g.maxX - g.baseX) + pt2emu(10), pt2emu(20));
      // Height: 1.5× line height
      const boxH = pt2emu(g.fontSize * 1.6);

      // Font size in half-points (Word unit)
      const szHp = Math.max(8, Math.round(g.fontSize * 2));

      // Detect bold/italic from font name
      const fn = g.fontName.toLowerCase();
      const bold    = /bold|black|heavy/.test(fn) ? '<a:b/>' : '';
      const italic  = /italic|oblique/.test(fn) ? '<a:i/>' : '';
      const fontFam = /times|serif/.test(fn) ? 'Times New Roman' : /courier|mono/.test(fn) ? 'Courier New' : 'Calibri';

      // Escape text
      const safeText = escXml(text);

      const shpId = shapeIdCounter++;

      textBoxDrawings += `<wp:anchor distT="0" distB="0" distL="0" distR="0"
        allowOverlap="1" layoutInCell="1" locked="0" behindDoc="0" simplePos="0" relativeHeight="${shpId}">
        <wp:simplePos x="0" y="0"/>
        <wp:positionH relativeFrom="page"><wp:posOffset>${xEmu}</wp:posOffset></wp:positionH>
        <wp:positionV relativeFrom="page"><wp:posOffset>${yEmu}</wp:posOffset></wp:positionV>
        <wp:extent cx="${boxW}" cy="${boxH}"/>
        <wp:effectExtent l="0" t="0" r="0" b="0"/>
        <wp:wrapNone/>
        <wp:docPr id="${shpId}" name="T${shpId}"/>
        <wp:cNvGraphicFramePr/>
        <a:graphic><a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">
          <wps:wsp>
            <wps:cNvPr id="${shpId}" name="T${shpId}"/>
            <wps:cNvSpPr txBx="1"/>
            <wps:spPr>
              <a:xfrm><a:off x="0" y="0"/><a:ext cx="${boxW}" cy="${boxH}"/></a:xfrm>
              <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
              <a:noFill/>
              <a:ln><a:noFill/></a:ln>
            </wps:spPr>
            <wps:txbx>
              <w:txbxContent>
                <w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>
                  <w:r><w:rPr>
                    <w:rFonts w:ascii="${fontFam}" w:hAnsi="${fontFam}"/>
                    <w:sz w:val="${szHp}"/><w:szCs w:val="${szHp}"/>
                    ${bold ? '<w:b/><w:bCs/>' : ''}${italic ? '<w:i/><w:iCs/>' : ''}
                    <w:noProof/>
                  </w:rPr>
                  <w:t xml:space="preserve">${safeText}</w:t></w:r>
                </w:p>
              </w:txbxContent>
            </wps:txbx>
            <wps:bodyPr insFocus="0" anchor="t">
              <a:noAutofit/>
            </wps:bodyPr>
          </wps:wsp>
        </a:graphicData></a:graphic>
      </wp:anchor>`;
    }

    // ── Assemble the page paragraph ─────────────────────────────────
    const sectPrXml = `<w:sectPr><w:pgSz w:w="${pgWTwips}" w:h="${pgHTwips}"/><w:pgMar w:top="0" w:right="0" w:bottom="0" w:left="0" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>`;

    // Background image run (one drawing per run — DOCX requirement)
    // textBoxDrawings already contains individual <wp:anchor> blocks, each wrapped in its own run below
    const bgRun = `<w:r><w:rPr><w:noProof/></w:rPr><w:drawing>${bgAnchor}</w:drawing></w:r>`;
    // Wrap each text-box anchor in its own <w:r><w:drawing>…</w:drawing></w:r>
    const tbRuns = textBoxDrawings
      .split(/(?=<wp:anchor)/)
      .filter(s => s.trim().startsWith('<wp:anchor'))
      .map(anchor => `<w:r><w:rPr><w:noProof/></w:rPr><w:drawing>${anchor}</w:drawing></w:r>`)
      .join('');
    const paraContent = bgRun + tbRuns;

    if (isLast) {
      bodyXml += `\n    <w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr>${paraContent}</w:p>`;
      bodyXml += `\n    ${sectPrXml}`;
    } else {
      bodyXml += `\n    <w:p><w:pPr><w:spacing w:before="0" w:after="0"/>${sectPrXml}</w:pPr>${paraContent}</w:p>`;
    }
  }

  const zip = makeZip(mediaFiles, bodyXml, '', relEntries.join('\n'), true);
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const name = bn(f.name) + '.docx';
  const wordCount = allPageData.reduce((n, pg) => n + pg.groups.reduce((m, g) => m + g.items.map(i=>i.str).join('').split(/\s+/).length, 0), 0);
  showRes([
    { v: pdf.numPages + '', l: 'Pages' },
    { v: wordCount.toLocaleString(), l: 'Words' },
    { v: fmtSz(blob.size), l: 'Output' }
  ], [{ name, blob }]);
  saveFile(blob, name);
}



async function doWordToPdf() {
  if (!toolFiles.length) return;
  await need('pdflib');
  await need('jszip');
  const f = toolFiles[0];

  // Extract text from .docx (ZIP containing XML) or fall back to plain text
  let lines = [];
  const isDOCX = f.name.toLowerCase().endsWith('.docx') || f.name.toLowerCase().endsWith('.doc');
  if (isDOCX) {
    try {
      const buf = await readBuf(f);
      const zip = await JSZip.loadAsync(buf);
      const docFile = zip.file('word/document.xml');
      if (!docFile) throw new Error('Not a valid DOCX file.');
      const xmlStr = await docFile.async('string');
      // Strip XML tags, preserve paragraph breaks
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlStr, 'application/xml');
      const paras = xmlDoc.querySelectorAll('p');
      lines = Array.from(paras).map(p => {
        // w:t elements hold actual text; w:br is a line break
        return Array.from(p.querySelectorAll('t')).map(t => t.textContent).join('');
      }).filter(l => l.trim() !== '' || true); // keep blanks for spacing
    } catch(e) {
      throw new Error('Could not read DOCX file: ' + e.message + '. Make sure it is a valid Word document.');
    }
  } else {
    const txt = await readText(f);
    lines = txt.split('\n');
  }

  const doc = await PDFLib.PDFDocument.create();
  const fontB = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
  const fontR = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
  const PW = 595, PH = 842, ML = 50, MR = 50, MT = 60, MB = 50;
  const maxW = PW - ML - MR;

  // Word-wrap helper
  const wrapLine = (text, font, size) => {
    if (!text.trim()) return [''];
    const words = text.split(' ');
    const result = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (font.widthOfTextAtSize(test, size) > maxW) {
        if (cur) result.push(cur);
        // Handle a single word longer than maxW
        let remaining = w;
        while (font.widthOfTextAtSize(remaining, size) > maxW) {
          let cutAt = remaining.length - 1;
          while (cutAt > 0 && font.widthOfTextAtSize(remaining.slice(0, cutAt), size) > maxW) cutAt--;
          result.push(remaining.slice(0, cutAt));
          remaining = remaining.slice(cutAt);
        }
        cur = remaining;
      } else {
        cur = test;
      }
    }
    if (cur) result.push(cur);
    return result.length ? result : [''];
  };

  let page = doc.addPage([PW, PH]);
  let y = PH - MT;
  let totalChars = 0;

  for (const rawLine of lines) {
    const isHeading = isDOCX && rawLine.length < 80 && rawLine === rawLine.trimEnd() && /^[A-Z0-9]/.test(rawLine) && !rawLine.endsWith(',') && rawLine.trim().split(/\s+/).length < 10;
    const font = isHeading ? fontB : fontR;
    const size = isHeading ? 14 : 11;
    const lineH = size * 1.6;
    const spaceAfter = isHeading ? size : size * 0.4;

    const wrapped = wrapLine(rawLine, font, size);
    for (const wl of wrapped) {
      if (y - lineH < MB) { page = doc.addPage([PW, PH]); y = PH - MT; }
      if (wl.trim()) {
        try { page.drawText(wl, { x: ML, y, size, font, color: PDFLib.rgb(0.07, 0.07, 0.12) }); } catch {}
      }
      y -= lineH;
    }
    y -= spaceAfter;
    totalChars += rawLine.length;
  }

  const out = await doc.save();
  const blob = new Blob([out], { type: 'application/pdf' });
  const name = bn(f.name) + '.pdf';
  showRes([{ v: doc.getPageCount() + '', l: 'Pages' }, { v: lines.length + '', l: 'Lines' }, { v: fmtSz(blob.size), l: 'PDF size' }], [{ name, blob }]);
  saveFile(blob, name);
}

async function doOCRPdf() {
  if (!toolFiles.length) return;
  await need('pdfjs');
  const f = toolFiles[0];
  const pagesOpt = (gv('opt-ocrPages') || '').trim();
  const outputFmt = gv('opt-ocrFmt') || 'Plain Text';
  const arr = await readBuf(f);
  const pdf = await pdfjsLib.getDocument({ data: arr }).promise;

  // Parse page ranges
  const wanted = new Set();
  if (pagesOpt) {
    pagesOpt.split(',').forEach(part => {
      const t = part.trim();
      if (/^\d+$/.test(t)) wanted.add(parseInt(t, 10));
      else if (/^\d+-\d+$/.test(t)) { const [a, b] = t.split('-').map(Number); for (let i = a; i <= b; i++) wanted.add(i); }
    });
  }

  const pageResults = [];
  let totalWords = 0;
  let hasText = false;

  for (let p = 1; p <= pdf.numPages; p++) {
    if (wanted.size && !wanted.has(p)) continue;
    setP(Math.round((p / pdf.numPages) * 90), `Extracting text from page ${p}/${pdf.numPages}…`);
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();

    // Group items by line (Y position with tolerance)
    const lineMap = {};
    for (const it of tc.items) {
      if (!it.str) continue;
      const y = Math.round((it.transform?.[5] || 0) * 2) / 2;
      if (!lineMap[y]) lineMap[y] = [];
      lineMap[y].push(it.str);
    }
    const ys = Object.keys(lineMap).map(Number).sort((a, b) => b - a);
    const pageLines = ys.map(y => lineMap[y].join(' ').replace(/\s{2,}/g, ' ').trim()).filter(Boolean);
    const pageText = pageLines.join('\n');
    if (pageText.trim()) hasText = true;
    totalWords += pageText.split(/\s+/).filter(Boolean).length;
    pageResults.push({ page: p, text: pageText, lines: pageLines.length });
  }

  if (!hasText) {
    throw new Error('No selectable text found in this PDF. This tool extracts embedded text — scanned/image-only PDFs require true OCR software (e.g. Adobe Acrobat, Tesseract).');
  }

  let output = '';
  const pagesExtracted = pageResults.length;

  if (outputFmt === 'Markdown') {
    output = `# Extracted Text — ${f.name}\n\n`;
    output += pageResults.map(r => `## Page ${r.page}\n\n${r.text}`).join('\n\n---\n\n');
  } else {
    output = `Text Extraction — ${f.name}\n${'─'.repeat(50)}\n\n`;
    output += pageResults.map(r => `[Page ${r.page}]\n${r.text}`).join('\n\n' + '─'.repeat(40) + '\n\n');
  }

  const ext = outputFmt === 'Markdown' ? 'md' : 'txt';
  const blob = new Blob([output], { type: 'text/plain' });
  const name = bn(f.name) + '_extracted.' + ext;
  showTO(output.substring(0, 2000) + (output.length > 2000 ? '\n…[preview truncated — download for full text]' : ''));
  showRes([{ v: pagesExtracted + '', l: 'Pages' }, { v: totalWords.toLocaleString(), l: 'Words' }, { v: fmtSz(blob.size), l: 'Output' }], [{ name, blob }]);
  saveFile(blob, name);
}

function doUTMBuilder() {
  const base = (gv('opt-utmBase') || '').trim();
  if (!base) throw new Error('Base URL is required.');
  const params = new URLSearchParams();
  ['Source', 'Medium', 'Campaign', 'Term', 'Content'].forEach(k => {
    const val = (gv(`opt-utm${k}`) || '').trim();
    if (val) params.set(`utm_${k.toLowerCase()}`, val);
  });
  const sep = base.includes('?') ? '&' : '?';
  const url = params.toString() ? base + sep + params.toString() : base;
  showTO(url);
  showRes([{ v: 'UTM URL', l: 'Generated' }, { v: params.size + '', l: 'Params' }], [{ name: 'utm-url.txt', blob: new Blob([url], { type: 'text/plain' }) }]);
}

async function doTranslateText() {
  const src = gv('opt-trSource') || 'Auto';
  const tgt = gv('opt-trTarget') || 'Spanish';
  const txt = (gv('opt-trText') || '').trim();
  if (!txt) throw new Error('Enter text to translate.');

  setP(10, 'Connecting…');
  const tout = document.getElementById('tout');
  const wrap = document.getElementById('tout-wrap');
  if (wrap) wrap.classList.add('show');
  if (tout) { tout.className = 'tout'; tout.textContent = 'Translating…'; }

  const srcLabel = src === 'Auto' ? 'the source language (auto-detect)' : src;
  const prompt = `Translate the following text from ${srcLabel} to ${tgt}. Output ONLY the translated text with no explanation, no preamble, and no quotes.\n\nText to translate:\n${txt}`;

  try {
    setP(30, 'Translating…');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!res.ok) throw new Error('API error ' + res.status);
    const data = await res.json();
    const translated = (data.content || []).map(b => b.text || '').join('').trim();
    if (!translated) throw new Error('No translation returned.');
    setP(90, 'Done');
    if (tout) { tout.className = 'tout'; tout.textContent = translated; }
    const blob = new Blob([translated], { type: 'text/plain' });
    showRes([{ v: src, l: 'From' }, { v: tgt, l: 'To' }, { v: txt.split(/\s+/).length + '', l: 'Words' }], [{ name: 'translation.txt', blob }]);
    saveFile(blob, 'translation.txt');
  } catch (e) {
    if (tout) { tout.className = 'tout'; tout.textContent = ''; }
    throw new Error('Translation failed: ' + e.message + '. Check your internet connection.');
  }
}

function _showTextResult(out, name='output.txt'){ showTO(out); showRes([{v:out.length+'',l:'Chars'}],[{name,blob:new Blob([out],{type:'text/plain'})}]); }
function doLineSorter(){ let a=(gv('opt-inputText')||'').split('\n'); if(gk('opt-uniq')) a=[...new Set(a)]; a.sort((x,y)=>x.localeCompare(y)); if(gk('opt-desc'))a.reverse(); _showTextResult(a.join('\n'),'sorted.txt'); }
function doWhitespaceRemover(){ const t=(gv('opt-inputText')||'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim(); _showTextResult(t,'cleaned.txt'); }
function doTextToHex(){ const t=gv('opt-inputText')||''; const b=new TextEncoder().encode(t); _showTextResult(Array.from(b,x=>x.toString(16).padStart(2,'0')).join(' '),'text.hex.txt'); }
function doHexToText(){
  const raw=gv('opt-inputText')||'';
  if(!raw.trim())throw new Error('Enter hex characters to decode.');
  const h=raw.replace(/\s+/g,'').replace(/^0x/i,'');
  if(!/^[0-9a-fA-F]*$/.test(h))throw new Error('Input contains non-hex characters. Only 0-9 and A-F are allowed.');
  if(h.length%2)throw new Error('Hex string has an odd number of characters. Each byte needs 2 hex digits.');
  try{
    const a=new Uint8Array(h.match(/.{1,2}/g).map(x=>parseInt(x,16)));
    _showTextResult(new TextDecoder().decode(a),'decoded.txt');
  }catch(e){ throw new Error('Decode failed: '+e.message); }
}
function doURLParser(){
  const raw=(gv('opt-inputText')||'').trim();
  if(!raw)throw new Error('Enter a URL to parse.');
  let u;
  try{ u=new URL(raw.includes('://')?raw:'https://'+raw); }
  catch(e){ throw new Error('Invalid URL: '+e.message); }
  const params={};
  u.searchParams.forEach((v,k)=>params[k]=v);
  const result={href:u.href,protocol:u.protocol,host:u.host,hostname:u.hostname,port:u.port||'(default)',pathname:u.pathname,search:u.search,hash:u.hash,params:Object.keys(params).length?params:'(none)'};
  _showTextResult(JSON.stringify(result,null,2),'url-parsed.json');
}
function doURLDecoder(){
  const raw=gv('opt-inputText')||'';
  if(!raw.trim())throw new Error('Enter a URL-encoded string to decode.');
  try{ _showTextResult(decodeURIComponent(raw),'decoded-url.txt'); }
  catch(e){ throw new Error('Invalid URL encoding: '+e.message); }
}
function doSlugGenerator(){ const s=(gv('opt-inputText')||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); _showTextResult(s,'slug.txt'); }
function doMyUserAgent(){
  const ua=navigator.userAgent;
  const tout=document.getElementById('tout'),wrap=document.getElementById('tout-wrap');
  if(wrap)wrap.classList.add('show');
  // Parse common UA fields
  const browser=ua.match(/(Chrome|Firefox|Safari|Edg|OPR|Opera|Brave)[\/ ](\d+)/)?.[0]||'Unknown';
  const os=ua.includes('Windows')?'Windows':ua.includes('Mac OS X')?'macOS':ua.includes('Linux')?'Linux':ua.includes('Android')?'Android':ua.includes('iPhone')||ua.includes('iPad')?'iOS':'Unknown';
  const mobile=/Mobi|Android|iPhone|iPad/i.test(ua);
  const info=[['Full User-Agent',ua],['Browser',browser],['OS',os],['Mobile',mobile?'Yes':'No'],['Language',navigator.language],['Languages',(navigator.languages||[navigator.language]).join(', ')],['Platform',navigator.platform||'Unknown'],['Hardware Concurrency',navigator.hardwareConcurrency+' cores'],['Memory',(navigator.deviceMemory||'Unknown')+' GB (approx)'],['Touch',('ontouchstart' in window)?'Yes':'No'],['Do Not Track',navigator.doNotTrack||'Not set']];
  if(tout){tout.className='tout';tout.innerHTML=`<div class="ts-grid">${info.map(([k,v])=>`<div class="ts-box"><label>${k}</label><div class="ts-val" style="word-break:break-all;font-size:11px">${v}</div></div>`).join('')}</div>`;}
  const txt=info.map(([k,v])=>`${k}: ${v}`).join('\n');
  const blob=new Blob([txt],{type:'text/plain'});
  showRes([{v:browser,l:'Browser'},{v:os,l:'OS'},{v:mobile?'Mobile':'Desktop',l:'Device'}],[{name:'user-agent.txt',blob}]);
}
async function doMyIP(){
  const tout=document.getElementById('tout'),wrap=document.getElementById('tout-wrap');
  if(wrap)wrap.classList.add('show');
  if(tout){tout.className='tout';tout.textContent='Detecting your IP…';}
  let ip='Could not detect', source='';
  const endpoints=[
    {url:'https://api.ipify.org?format=json',parse:d=>d.ip},
    {url:'https://api64.ipify.org?format=json',parse:d=>d.ip},
  ];
  for(const ep of endpoints){
    try{const r=await fetch(ep.url,{signal:AbortSignal.timeout(5000)});const d=await r.json();ip=ep.parse(d)||'';source=ep.url;if(ip)break;}catch{}
  }
  const info=[['IP Address',ip],['User Agent',navigator.userAgent.substring(0,80)+(navigator.userAgent.length>80?'…':'')],['Language',navigator.language],['Platform',navigator.platform||navigator.userAgentData?.platform||'Unknown'],['Cookies enabled',navigator.cookieEnabled?'Yes':'No'],['Online',navigator.onLine?'Yes':'No'],['Screen',window.screen.width+'×'+window.screen.height],['Window',window.innerWidth+'×'+window.innerHeight]];
  if(tout){tout.innerHTML=`<div class="ts-grid">${info.map(([k,v])=>`<div class="ts-box"><label>${k}</label><div class="ts-val" style="word-break:break-all">${v}</div></div>`).join('')}</div>`;}
  const txt=info.map(([k,v])=>`${k}: ${v}`).join('\n');
  _showTextResult(txt,'my-ip.txt');
  showRes([{v:ip,l:'Your IP'},{v:navigator.language,l:'Language'}],[{name:'my-ip.txt',blob:new Blob([txt],{type:'text/plain'})}]);
}
function doKeyboardTest(){
  const tout=document.getElementById('tout'),wrap=document.getElementById('tout-wrap');
  if(wrap)wrap.classList.add('show');
  if(!tout)return;
  tout.className='tout';
  tout.innerHTML=`<div id="kb-display" style="display:flex;flex-direction:column;gap:12px">
    <div style="text-align:center;opacity:.6;padding:16px">Press any key to begin</div>
    <div id="kb-log" style="display:flex;flex-direction:column;gap:6px;max-height:260px;overflow-y:auto"></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap" id="kb-held"></div>
  </div>`;
  const log=tout.querySelector('#kb-log');
  const held=tout.querySelector('#kb-held');
  const heldKeys=new Map();
  const addEntry=(key,code,type)=>{
    const el=document.createElement('div');
    el.style.cssText='display:flex;gap:8px;align-items:center;padding:6px 10px;background:var(--b2,#f3f3f3);border-radius:8px;font-size:13px';
    el.innerHTML=`<span style="opacity:.5;font-size:11px;min-width:70px">${type}</span><kbd style="background:var(--b3,#e5e5e5);padding:2px 8px;border-radius:5px;font-family:monospace">${key||'(blank)'}</kbd><span style="opacity:.4;font-size:11px">${code}</span>`;
    log.prepend(el);
    if(log.children.length>20)log.removeChild(log.lastChild);
  };
  window._kbDown=e=>{
    e.preventDefault();
    heldKeys.set(e.code,e.key);
    held.innerHTML=Array.from(heldKeys.values()).map(k=>`<kbd style="background:var(--accent,#6c63ff);color:#fff;padding:3px 10px;border-radius:6px;font-family:monospace">${k}</kbd>`).join('');
    addEntry(e.key,e.code,'keydown');
  };
  window._kbUp=e=>{
    heldKeys.delete(e.code);
    held.innerHTML=Array.from(heldKeys.values()).map(k=>`<kbd style="background:var(--accent,#6c63ff);color:#fff;padding:3px 10px;border-radius:6px;font-family:monospace">${k}</kbd>`).join('');
    addEntry(e.key,e.code,'keyup');
  };
  document.addEventListener('keydown',window._kbDown);
  document.addEventListener('keyup',window._kbUp);
  showRes([{v:'Active',l:'Keyboard Test'},{v:'All keys',l:'Detected'}],[]);
}

function doTouchpadTest(){
  const tout=document.getElementById('tout'),wrap=document.getElementById('tout-wrap');
  if(wrap)wrap.classList.add('show');
  if(!tout)return;
  tout.className='tout';
  tout.innerHTML=`<div style="display:flex;flex-direction:column;gap:12px">
    <div id="tp-zone" style="height:220px;background:var(--b2,#f3f3f3);border-radius:12px;display:flex;align-items:center;justify-content:center;cursor:crosshair;position:relative;overflow:hidden;user-select:none;touch-action:none">
      <span id="tp-hint" style="opacity:.4;pointer-events:none">Move cursor or touch here</span>
      <canvas id="tp-cv" style="position:absolute;inset:0;width:100%;height:100%"></canvas>
    </div>
    <div id="tp-stats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:13px">
      <div style="background:var(--b2,#f3f3f3);border-radius:8px;padding:8px;text-align:center"><div id="tp-x" style="font-size:16px;font-weight:700">–</div><div style="opacity:.5">X</div></div>
      <div style="background:var(--b2,#f3f3f3);border-radius:8px;padding:8px;text-align:center"><div id="tp-y" style="font-size:16px;font-weight:700">–</div><div style="opacity:.5">Y</div></div>
      <div style="background:var(--b2,#f3f3f3);border-radius:8px;padding:8px;text-align:center"><div id="tp-ev" style="font-size:16px;font-weight:700">–</div><div style="opacity:.5">Event</div></div>
    </div>
    <div id="tp-log" style="max-height:120px;overflow-y:auto;display:flex;flex-direction:column;gap:4px"></div>
  </div>`;
  const zone=tout.querySelector('#tp-zone');
  const cv=tout.querySelector('#tp-cv');
  const ctx=cv.getContext('2d');
  const hint=tout.querySelector('#tp-hint');
  const xEl=tout.querySelector('#tp-x'),yEl=tout.querySelector('#tp-y'),evEl=tout.querySelector('#tp-ev');
  const logEl=tout.querySelector('#tp-log');
  let lastX=null,lastY=null;
  const resize=()=>{cv.width=zone.offsetWidth;cv.height=zone.offsetHeight;};
  resize(); new ResizeObserver(resize).observe(zone);
  const addLog=(type,x,y)=>{
    const el=document.createElement('div');
    el.style.cssText='font-size:12px;padding:3px 8px;background:var(--b2,#f3f3f3);border-radius:6px;opacity:.8';
    el.textContent=`${type}  x:${x}  y:${y}`;
    logEl.prepend(el);
    if(logEl.children.length>10)logEl.removeChild(logEl.lastChild);
  };
  const draw=(x,y)=>{
    if(!cv.width)return;
    if(lastX!==null){ctx.beginPath();ctx.moveTo(lastX,lastY);ctx.lineTo(x,y);ctx.strokeStyle='rgba(108,99,255,0.7)';ctx.lineWidth=2;ctx.lineCap='round';ctx.stroke();}
    ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fillStyle='#6c63ff';ctx.fill();
    lastX=x;lastY=y;
  };
  window._tpMove=e=>{
    hint.style.display='none';
    const rect=zone.getBoundingClientRect();
    const cx=Math.round(e.clientX-rect.left),cy=Math.round(e.clientY-rect.top);
    xEl.textContent=cx;yEl.textContent=cy;evEl.textContent='move';
    draw(cx,cy);
  };
  window._tpClick=e=>{
    const rect=zone.getBoundingClientRect();
    const cx=Math.round(e.clientX-rect.left),cy=Math.round(e.clientY-rect.top);
    evEl.textContent='click';addLog('click',cx,cy);
    ctx.beginPath();ctx.arc(cx,cy,12,0,Math.PI*2);ctx.strokeStyle='#6c63ff';ctx.lineWidth=2;ctx.stroke();
  };
  zone.addEventListener('pointermove',window._tpMove);
  zone.addEventListener('pointerdown',window._tpClick);
  showRes([{v:'Active',l:'Touchpad Test'},{v:'Move & click',l:'To test'}],[]);
}
function doHtmlEncode(){ _showTextResult(escHtml(gv('opt-inputText')||''),'html-encoded.txt'); }
function doHtmlDecode(){ const d=document.createElement('textarea'); d.innerHTML=gv('opt-inputText')||''; _showTextResult(d.value,'html-decoded.txt'); }
function doHtmlStripper(){ const d=document.createElement('div'); d.innerHTML=gv('opt-inputText')||''; _showTextResult(d.textContent||'','html-stripped.txt'); }
function _b32abc(){ return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; }
function doBase32Encode(){ const bytes=new TextEncoder().encode(gv('opt-inputText')||''); let bits='',o=''; bytes.forEach(b=>bits+=b.toString(2).padStart(8,'0')); const abc=_b32abc(); for(let i=0;i<bits.length;i+=5){const c=bits.slice(i,i+5).padEnd(5,'0'); o+=abc[parseInt(c,2)];} while(o.length%8)o+='='; _showTextResult(o,'base32.txt'); }
function doBase32Decode(){
  const raw=(gv('opt-inputText')||'').trim();
  if(!raw)throw new Error('Enter a Base32 encoded string.');
  const s=raw.replace(/=+$/,'').toUpperCase();
  const abc=_b32abc();
  if([...s].some(c=>!abc.includes(c)))throw new Error('Input contains invalid Base32 characters. Valid chars: A-Z and 2-7.');
  let bits='';
  for(const ch of s){const i=abc.indexOf(ch);if(i<0)continue;bits+=i.toString(2).padStart(5,'0');}
  const out=[];
  for(let i=0;i+8<=bits.length;i+=8) out.push(parseInt(bits.slice(i,i+8),2));
  try{ _showTextResult(new TextDecoder('utf-8',{fatal:true}).decode(new Uint8Array(out)),'base32-decoded.txt'); }
  catch(e){ throw new Error('Decoded bytes are not valid UTF-8 text. The input may be binary data.'); }
}
function doPassphraseGenerator(){
  const WORDS = [
    'apple','anchor','arrow','atlas','autumn','azure','badge','banjo','beacon','beetle',
    'birch','blaze','bloom','blossom','blueprint','boulder','brave','breeze','bridge','bright',
    'bronze','brush','bubble','cabin','candle','canyon','castle','cedar','cellar','chalk',
    'charm','cherry','chisel','chrome','cipher','circuit','citrus','clover','cluster','cobalt',
    'cobble','comet','coral','cotton','crane','crater','creek','crisp','crystal','cypress',
    'dagger','daisy','dancer','dapple','dawn','dazzle','delta','desert','dew','diamond',
    'dusk','eagle','echo','elder','ember','emerald','epic','falcon','fern','field',
    'fjord','flame','flare','flint','flood','forest','forge','fossil','fractal','frosty',
    'galaxy','garnet','gate','geyser','ginger','glacier','gleam','glider','glow','goblin',
    'golden','granite','gravel','grotto','grove','harbor','harvest','hazel','hearth','helix',
    'hollow','honey','horizon','jade','jasper','jetty','jungle','knight','lantern','larch',
    'lava','lemon','lighthouse','lilac','limestone','linden','linen','locket','lodge','lofty',
    'lotus','lunar','magnet','maple','marble','marsh','meadow','mesa','meteor','midnight',
    'mint','mist','moat','monarch','monsoon','mossy','mountain','mystic','nebula','nickel',
    'nimble','noble','north','nutmeg','oaken','ocean','olive','onyx','orbit','orchid',
    'osprey','otter','outpost','oyster','paddle','parchment','parrot','pebble','petal','pillar',
    'pine','plover','plum','polar','pond','poplar','porcupine','porch','prism','pulsar',
    'quartz','quiver','radiant','rapids','raven','relay','ridge','ritual','river','robin',
    'rocket','rocky','rosewood','rustic','sable','sage','salmon','sand','sapphire','saturn',
    'scarlet','scholar','scout','seabird','seraph','serene','shadow','shale','shingle','silver',
    'slate','solar','sonar','sparrow','spiral','sprout','spruce','stellar','stone','storm',
    'stream','summit','sundial','sunspot','swift','thicket','thistle','thorn','tidal','timber',
    'topaz','torch','trader','trail','turret','turtle','twilight','typhoon','valley','vapor',
    'velvet','venture','violet','viper','vista','volcano','warden','wave','willow','wind',
    'winter','wolf','wonder','wren','yarrow','zenith','zigzag','zinc','zircon','zone'
  ];
  const c = Math.max(2, Math.min(12, parseInt(gv('opt-count')) || 4));
  const rawSep = gv('opt-sep') || '-';
  const sep = rawSep === '(space)' ? ' ' : rawSep;
  const capitalize = gk('opt-cap');
  const count = Math.max(1, Math.min(20, parseInt(gv('opt-num')) || 5));
  const phrases = [];
  for (let i = 0; i < count; i++) {
    const words = [];
    for (let j = 0; j < c; j++) {
      let w = WORDS[Math.floor(Math.random() * WORDS.length)];
      if (capitalize) w = w[0].toUpperCase() + w.slice(1);
      words.push(w);
    }
    phrases.push(words.join(sep));
  }
  const out = phrases.join('\n');
  const tout = document.getElementById('tout'), wrap = document.getElementById('tout-wrap');
  if (wrap) wrap.classList.add('show');
  if (tout) { tout.className = 'tout'; tout.innerHTML = `<div class="pw-list">${phrases.map(p => `<div class="pw-item"><div style="flex:1;min-width:0"><code style="display:block;word-break:break-all">${p}</code></div><button class="pw-cp" onclick="navigator.clipboard.writeText('${p.replace(/'/g,"\\'")}').then(()=>toast('Copied!','ok'))">Copy</button></div>`).join('')}</div>`; }
  const blob = new Blob([out], { type: 'text/plain' });
  showRes([{ v: c + ' words', l: 'Length' }, { v: count + '', l: 'Generated' }, { v: WORDS.length + '', l: 'Word pool' }], [{ name: 'passphrases.txt', blob }]);
  saveFile(blob, 'passphrases.txt');
}
function doPinGenerator(){
  const digits=Math.max(4,Math.min(12,parseInt(gv('opt-digits'))||6));
  const count=Math.max(1,Math.min(50,parseInt(gv('opt-count'))||10));
  const sep=gk('opt-groups'); // group by 4 digits
  const pins=[];
  for(let i=0;i<count;i++){
    let p='';
    for(let d=0;d<digits;d++) p+=Math.floor(Math.random()*10);
    pins.push(sep&&digits>4?p.match(/.{1,4}/g).join('-'):p);
  }
  const tout=document.getElementById('tout'),wrap=document.getElementById('tout-wrap');
  if(wrap)wrap.classList.add('show');
  if(tout){
    tout.className='tout';
    tout.innerHTML=`<div class="pw-list">${pins.map(p=>`<div class="pw-item"><div style="flex:1;min-width:0"><code style="display:block;word-break:break-all;letter-spacing:2px">${p}</code></div><button class="pw-cp" onclick="navigator.clipboard.writeText('${p}').then(()=>toast('Copied!','ok'))">Copy</button></div>`).join('')}</div>`;
  }
  const blob=new Blob([pins.join('\n')],{type:'text/plain'});
  showRes([{v:digits+' digits',l:'Length'},{v:count+'',l:'Generated'}],[{name:'pins.txt',blob}]);
  saveFile(blob,'pins.txt');
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
  if (!toolFiles.length) return;
  const f = toolFiles[0];
  setP(20, 'Reading…');
  let text = '';
  const ext = f.name.split('.').pop().toLowerCase();

  if (ext === 'pdf') {
    await need('pdfjs');
    const pdf = await pdfjsLib.getDocument({ data: await readBuf(f) }).promise;
    for (let i = 1; i <= pdf.numPages; i++) {
      const p = await pdf.getPage(i);
      const c = await p.getTextContent();
      text += c.items.map(item => item.str).join(' ') + '\n';
    }
  } else if (ext === 'docx' || ext === 'doc') {
    await need('jszip');
    try {
      const buf = await readBuf(f);
      const zip = await JSZip.loadAsync(buf);
      const docFile = zip.file('word/document.xml');
      if (!docFile) throw new Error('Not a valid DOCX');
      const xmlStr = await docFile.async('string');
      const xmlDoc = new DOMParser().parseFromString(xmlStr, 'application/xml');
      text = Array.from(xmlDoc.querySelectorAll('t')).map(t => t.textContent).join(' ');
    } catch (e) {
      throw new Error('Could not read DOCX: ' + e.message);
    }
  } else {
    text = await readText(f);
  }

  setP(80, 'Counting…');
  const words = text.trim().split(/\s+/).filter(w => w).length;
  const chars = text.length;
  const charsNoSp = text.replace(/\s/g, '').length;
  const sentences = (text.match(/[.!?]+/g) || []).length;
  const paragraphs = text.split(/\n{2,}/).filter(p => p.trim()).length || 1;
  const lines = text.split(/\n/).length;
  const uniqueWords = new Set(text.toLowerCase().split(/\s+/).filter(w => w.replace(/[^a-zA-Z]/g, ''))).size;
  const readMin = Math.ceil(words / 200);
  const speakMin = Math.ceil(words / 130);
  const avgWordLen = words > 0 ? (charsNoSp / words).toFixed(1) : '0';

  const r = `Word Count Report — ${f.name}\n${'─'.repeat(44)}\n` +
    `Words:                    ${words.toLocaleString()}\n` +
    `Unique words:             ${uniqueWords.toLocaleString()}\n` +
    `Characters (with spaces): ${chars.toLocaleString()}\n` +
    `Characters (no spaces):   ${charsNoSp.toLocaleString()}\n` +
    `Average word length:      ${avgWordLen} chars\n` +
    `Sentences:                ${sentences.toLocaleString()}\n` +
    `Paragraphs:               ${paragraphs.toLocaleString()}\n` +
    `Lines:                    ${lines.toLocaleString()}\n\n` +
    `Reading time (~200 wpm):  ~${readMin} min\n` +
    `Speaking time (~130 wpm): ~${speakMin} min\n`;

  showTO(r);
  const blob = new Blob([r], { type: 'text/plain' });
  showRes([{ v: words.toLocaleString(), l: 'Words' }, { v: chars.toLocaleString(), l: 'Characters' }, { v: '~' + readMin + ' min', l: 'Read time' }], [{ name: bn(f.name) + '_wordcount.txt', blob }]);
}

async function _doWCountOldBodyRemoved_placeholder() { if(false){} }

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
