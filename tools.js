/* Local QR generation and a same-origin link service. */
(() => {
 'use strict';
 if(['image','convert'].includes(new URLSearchParams(location.search).get('tool'))) return;
 const kind=new URLSearchParams(location.search).get('tool')==='short'?'short':'qr';
 const config=window.NR_LINK_STUDIO || {};
 document.documentElement.dataset.tool=kind;
 document.querySelector('.empty-icon').textContent=kind==='short'?'↗':'▦';
 for(const id of ['qr-settings','qr-preview','png','svg'])document.getElementById(id).hidden=kind!=='qr';
 for(const id of ['copy','make-qr'])document.getElementById(id).hidden=kind!=='short';
 document.querySelectorAll('.tool-tabs a').forEach(a=>{if(new URL(a.href).searchParams.get('tool')===kind)a.setAttribute('aria-current','page');});
 const dictionary=window.NRLinkTranslations;
 const params=new URLSearchParams(location.search);
 let lang=window.StudioLanguage;
 let t,qr=null,currentUrl='',expiry='',requestVersion=0;
 const $=id=>document.getElementById(id);
 const storage={get:k=>{try{return localStorage.getItem(k)}catch{return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch{}}};
 function message(key,error=false){$('message').textContent=t[key]||key;$('message').classList.toggle('error',error);}
 function localize(){
  t={...dictionary[lang],...dictionary[lang][kind]};
  document.documentElement.lang=lang;$('language').value=lang;
  document.querySelectorAll('[data-i]').forEach(el=>{if(t[el.dataset.i]!==undefined)el.textContent=t[el.dataset.i];});
  document.title='NR. Link Studio'+' — '+t[kind==='qr'?'qrTab':'shortTab'];
  document.querySelectorAll('.tool-tabs a').forEach(a=>{const u=new URL(a.href);u.searchParams.set('lang',lang);a.href=u.href;});
  const home=config.portfolioUrl || 'index.html';$('portfolio-link').href=home;$('back-link').href=home; $('back-link').hidden=!config.portfolioUrl;
  $('theme').setAttribute('aria-label',t.theme);
  $('message').textContent='';
  if(expiry)$('result-meta').textContent=t.expired+expiry;
  if(kind==='short'&&currentUrl)setQrLink();
 }
 function setQrLink(){const u=new URL('index.html?tool=qr',location.href);u.searchParams.set('lang',lang);u.hash=new URLSearchParams({url:currentUrl}).toString();$('make-qr').href=u.href;}
 function normalize(raw){
  raw=raw.trim();if(!raw || /[\s\u0000-\u001f\u007f]/.test(raw))throw Error('invalid');
  if(!/^[a-z][a-z0-9+.-]*:/i.test(raw))raw='https://'+raw;
  const u=new URL(raw);
  if(!['http:','https:'].includes(u.protocol)||u.username||u.password||!u.hostname||u.href.length>2048)throw Error('invalid');
  const h=u.hostname;if(kind==='short'&&(!h.includes('.')||h.endsWith('.local')||/^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)))throw Error('invalid');
  return u.href;
 }
 function invalidate(){requestVersion++;currentUrl='';qr=null;expiry='';$('result').hidden=true;$('empty').hidden=false;$('ready-badge').hidden=true;$('url').removeAttribute('aria-invalid');message('changed');}
 function reveal(url){currentUrl=url;$('result-url').href=url;$('result-url').textContent=url;$('empty').hidden=true;$('result').hidden=false;$('ready-badge').hidden=false;message('generated');}
 function svgMarkup(){
  const n=qr.getModuleCount(),side=n+8;
  let d='';for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(qr.isDark(y,x))d+=`M${x+4} ${y+4}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}" width="${side*8}" height="${side*8}" role="img" aria-label="QR code" shape-rendering="crispEdges"><rect width="${side}" height="${side}" fill="white"/><path d="${d}" fill="${$('ink').value}"/></svg>`;
 }
 function renderQR(){ $('qr-preview').innerHTML=svgMarkup(); }
 function download(blob,name){const href=URL.createObjectURL(blob),a=document.createElement('a');a.href=href;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(href),10000);message('saved');}
 $('tool-form').addEventListener('submit',async event=>{
  event.preventDefault();let url;try{url=normalize($('url').value)}catch{invalidate();$('url').setAttribute('aria-invalid','true');message('invalid',true);$('url').focus();return;}
  $('url').removeAttribute('aria-invalid');
  if(kind==='qr'){
   try{qr=qrcode(0,'M');qr.addData(url,'Byte');qr.make();renderQR();$('result-meta').textContent='PNG / SVG · '+qr.getModuleCount()+' × '+qr.getModuleCount();reveal(url)}catch{invalidate();message('qrError',true)}return;
  }
  if(!config.apiUrl || !config.redirectUrl){message({pl:'Skracanie linków będzie dostępne po połączeniu usługi. Generator QR jest już gotowy do użycia.',en:'Link shortening will be available once the service is connected. The QR generator is ready to use.',de:'Links können nach dem Verbinden des Dienstes gekürzt werden. Der QR-Generator ist bereits einsatzbereit.'}[lang],true);return;}
  const version=++requestVersion;$('generate').disabled=true;$('tool-form').setAttribute('aria-busy','true');message('working');
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
  try{
   const response=await fetch(new URL(config.apiUrl,location.href),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url}),signal:controller.signal});
   const data=await response.json();if(!response.ok)throw Error(data.error);
   if(!/^[\w-]{8}$/.test(data.code))throw Error('unavailable');
   if(version!==requestVersion)return;
   const result=new URL(config.redirectUrl,location.href);result.searchParams.set('c',data.code);expiry=data.expires;
   $('result-meta').textContent=t.expired+expiry;reveal(result.href);setQrLink();
  }catch(error){if(version===requestVersion)message(['invalid','limit','capacity','origin'].includes(error.message)?error.message:'unavailable',true)}
  finally{clearTimeout(timeout);$('generate').disabled=false;$('tool-form').removeAttribute('aria-busy');}
 });
 $('url').addEventListener('input',invalidate);
 $('language').addEventListener('change',()=>{lang=$('language').value;const u=new URL(location.href);u.searchParams.set('lang',lang);history.replaceState(null,'',u);localize();});
 document.documentElement.dataset.theme=storage.get('qa-portfolio-theme')==='dark'?'dark':'light';
 $('theme').setAttribute('aria-pressed',String(document.documentElement.dataset.theme==='dark'));
 $('theme').addEventListener('click',()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';storage.set('qa-portfolio-theme',dark?'dark':'light');$('theme').setAttribute('aria-pressed',String(dark));});
 if(kind==='short')$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(currentUrl);message('copied')}catch{message('copyError',true)}});
 else {
  $('ink').addEventListener('change',()=>{if(qr)renderQR();});
  $('svg').addEventListener('click',()=>{if(qr)download(new Blob([svgMarkup()],{type:'image/svg+xml'}),'nr-qr.svg');});
  $('png').addEventListener('click',()=>{
   if(!qr)return;const size=Number($('size').value),n=qr.getModuleCount(),side=n+8;
   const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d');
   ctx.fillStyle='#fff';ctx.fillRect(0,0,size,size);ctx.fillStyle=$('ink').value;
   const cell=Math.floor(size/side),offset=Math.floor((size-n*cell)/2);
   for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(qr.isDark(y,x))ctx.fillRect(offset+x*cell,offset+y*cell,cell,cell);
   canvas.toBlob(blob=>{if(blob)download(blob,'nr-qr.png');},'image/png');
  });
  const incoming=new URLSearchParams(location.hash.slice(1)).get('url');if(incoming){$('url').value=incoming.slice(0,2048);history.replaceState(null,'',location.pathname+location.search);}
 }
 localize();
})();


