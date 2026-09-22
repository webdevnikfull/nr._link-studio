/* Local QR generation and a same-origin link service. */
(() => {
 'use strict';
 const kind=new URLSearchParams(location.search).get('tool')==='short'?'short':'qr';
 const config=window.NR_LINK_STUDIO || {};
 document.documentElement.dataset.tool=kind;
 document.querySelector('.empty-icon').textContent=kind==='short'?'↗':'▦';
 for(const id of ['qr-settings','qr-preview','png','svg'])document.getElementById(id).hidden=kind!=='qr';
 for(const id of ['copy','make-qr'])document.getElementById(id).hidden=kind!=='short';
 document.querySelectorAll('.tool-tabs a').forEach(a=>{if(new URL(a.href).searchParams.get('tool')===kind)a.setAttribute('aria-current','page');});
 const dictionary={
 pl:{skip:'Przejdź do treści',language:'Język',shortTab:'Skracacz linków',qrTab:'Generator QR',inputHeading:'Twój adres',outputHeading:'Gotowy do udostępnienia',urlLabel:'Adres strony',hint:'Wklej pełny adres https:// lub nazwę domeny. Maks. 2048 znaków.',size:'Rozmiar PNG',ink:'Kolor kodu',navy:'Granatowy',black:'Czarny',green:'Leśny',ready:'GOTOWE',copy:'Kopiuj link',makeQr:'Utwórz QR ↗',back:'Wróć do portfolio ↗',invalid:'Podaj prawidłowy, publiczny adres HTTP lub HTTPS bez danych logowania.',working:'Tworzę link…',limit:'Limit tworzenia linków został osiągnięty. Spróbuj ponownie za godzinę.',capacity:'Skracacz osiągnął limit pojemności. Spróbuj później.',unavailable:'Skracacz jest chwilowo niedostępny. Spróbuj ponownie później.',copied:'Link skopiowany.',copyError:'Nie udało się skopiować. Zaznacz i skopiuj adres ręcznie.',generated:'Gotowe. Możesz teraz udostępnić wynik.',expired:'Ważny do: ',saved:'Plik przygotowany do pobrania.',qrError:'Adres jest zbyt długi dla kodu QR. Skróć go i spróbuj ponownie.',changed:'Adres zmieniony. Wygeneruj nowy wynik.',theme:'Przełącz jasny / ciemny motyw',step1:'Wklej adres',step1Text:'Domena wystarczy — dodamy HTTPS.',step2:'Utwórz wynik',step3:'Udostępnij',
 short:{title:'Długi adres. Krótka historia.',intro:'Zamień rozbudowany URL w zgrabny link, którym łatwo się podzielić.',generate:'Skróć link',privacy:'Adres zostanie zapisany na serwerze skracacza na 365 dni. Nie wklejaj poufnych linków. Bez rejestracji, do 20 nowych linków na godzinę z jednego adresu IP.',emptyTitle:'Mniej znaków. Więcej możliwości.',emptyText:'Twój nowy link pojawi się tutaj po skróceniu adresu.',resultCaption:'Twój krótki link',step2Text:'Zapisujemy przekierowanie na 365 dni.',step3Text:'Skopiuj link lub zamień go w kod QR.'},
 qr:{title:'Jeden link. Jeden skan.',intro:'Stwórz czytelny kod QR do strony, portfolio lub wydarzenia. Gotowy na ekran i do druku.',generate:'Generuj kod QR',privacy:'Twój adres pozostaje w przeglądarce. Generowanie i eksport działają lokalnie, bez konta i zewnętrznych usług.',emptyTitle:'Tutaj pojawi się Twój kod.',emptyText:'Dodaj adres i wybierz kolor. My zajmiemy się resztą.',resultCaption:'Adres w kodzie',step2Text:'Dobierz kolor i rozmiar pliku PNG.',step3Text:'Pobierz PNG lub skalowalny SVG.'}},
 en:{skip:'Skip to content',language:'Language',shortTab:'URL shortener',qrTab:'QR generator',inputHeading:'Your address',outputHeading:'Ready to share',urlLabel:'Website address',hint:'Paste an https:// address or a domain. Up to 2048 characters.',size:'PNG size',ink:'Code color',navy:'Navy',black:'Black',green:'Forest',ready:'READY',copy:'Copy link',makeQr:'Create QR ↗',back:'Back to portfolio ↗',invalid:'Enter a valid public HTTP or HTTPS address without login credentials.',working:'Creating link…',limit:'Link creation limit reached. Try again in an hour.',capacity:'The link service is at capacity. Try again later.',unavailable:'The link service is temporarily unavailable. Please try again later.',copied:'Link copied.',copyError:'Could not copy. Select and copy the address manually.',generated:'Ready. You can now share your result.',expired:'Valid until: ',saved:'Your download is ready.',qrError:'This URL is too long for a QR code. Shorten it and try again.',changed:'Address changed. Generate a new result.',theme:'Toggle light / dark theme',step1:'Paste your address',step1Text:'A domain is enough — we add HTTPS.',step2:'Create your result',step3:'Share it',
 short:{title:'Long address. Short story.',intro:'Turn a lengthy URL into a neat link that is easy to share.',generate:'Shorten link',privacy:'Your address is stored on the link service server for 365 days. Do not submit confidential links. No account needed; up to 20 new links per hour per IP address.',emptyTitle:'Less link. More possibility.',emptyText:'Your new link will appear here after you shorten an address.',resultCaption:'Your short link',step2Text:'We save your redirect for 365 days.',step3Text:'Copy your link or turn it into a QR code.'},
 qr:{title:'One link. One scan.',intro:'Create a crisp QR code for a website, portfolio or event. Ready for screens and print.',generate:'Generate QR code',privacy:'Your address stays in your browser. Generation and export happen locally, without an account or an external service.',emptyTitle:'Your code belongs here.',emptyText:'Add an address and choose a color. We handle the rest.',resultCaption:'Encoded address',step2Text:'Choose a color and PNG resolution.',step3Text:'Download PNG or a scalable SVG.'}},
 de:{skip:'Zum Inhalt',language:'Sprache',shortTab:'Link-Kürzer',qrTab:'QR-Generator',inputHeading:'Deine Adresse',outputHeading:'Bereit zum Teilen',urlLabel:'Webadresse',hint:'HTTPS-Adresse oder Domain einfügen. Maximal 2048 Zeichen.',size:'PNG-Größe',ink:'Farbe',navy:'Marineblau',black:'Schwarz',green:'Waldgrün',ready:'FERTIG',copy:'Link kopieren',makeQr:'QR erstellen ↗',back:'Zurück zum Portfolio ↗',invalid:'Gib eine gültige öffentliche HTTP- oder HTTPS-Adresse ohne Anmeldedaten ein.',working:'Link wird erstellt…',limit:'Limit erreicht. Versuche es in einer Stunde erneut.',capacity:'Der Link-Dienst ist ausgelastet. Bitte später erneut versuchen.',unavailable:'Der Link-Dienst ist vorübergehend nicht verfügbar. Bitte später erneut versuchen.',copied:'Link kopiert.',copyError:'Kopieren fehlgeschlagen. Markiere und kopiere die Adresse manuell.',generated:'Fertig. Du kannst das Ergebnis jetzt teilen.',expired:'Gültig bis: ',saved:'Die Datei ist zum Download bereit.',qrError:'Die URL ist zu lang für einen QR-Code. Kürze sie und versuche es erneut.',changed:'Adresse geändert. Erstelle ein neues Ergebnis.',theme:'Helles / dunkles Design wechseln',step1:'Adresse einfügen',step1Text:'Eine Domain reicht — wir ergänzen HTTPS.',step2:'Ergebnis erstellen',step3:'Teilen',
 short:{title:'Lange Adresse. Kurze Geschichte.',intro:'Verwandle eine lange URL in einen kompakten Link, den du einfach teilen kannst.',generate:'Link kürzen',privacy:'Die Adresse wird 365 Tage auf dem Server des Link-Dienstes gespeichert. Keine vertraulichen Links eingeben. Ohne Konto; bis zu 20 neue Links pro Stunde und IP-Adresse.',emptyTitle:'Weniger Zeichen. Mehr Möglichkeiten.',emptyText:'Dein neuer Link erscheint hier nach dem Kürzen.',resultCaption:'Dein kurzer Link',step2Text:'Die Weiterleitung bleibt 365 Tage gespeichert.',step3Text:'Kopiere den Link oder erstelle einen QR-Code.'},
 qr:{title:'Ein Link. Ein Scan.',intro:'Erstelle einen klaren QR-Code für eine Website, ein Portfolio oder eine Veranstaltung. Für Bildschirm und Druck.',generate:'QR-Code erstellen',privacy:'Die Adresse bleibt in deinem Browser. Erstellung und Export erfolgen lokal, ohne Konto oder externen Dienst.',emptyTitle:'Hier erscheint dein Code.',emptyText:'Adresse einfügen und Farbe wählen. Wir erledigen den Rest.',resultCaption:'Adresse im Code',step2Text:'Wähle Farbe und PNG-Auflösung.',step3Text:'Lade PNG oder skalierbares SVG herunter.'}}
 };
 const params=new URLSearchParams(location.search);
 let lang=dictionary[params.get('lang')]?params.get('lang'):'pl';
 let t,qr=null,currentUrl='',expiry='',requestVersion=0;
 const $=id=>document.getElementById(id);
 const storage={get:k=>{try{return localStorage.getItem(k)}catch{return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch{}}};
 function message(key,error=false){$('message').textContent=t[key]||key;$('message').classList.toggle('error',error);}
 function localize(){
  t={...dictionary[lang],...dictionary[lang][kind]};
  document.documentElement.lang=lang;$('language').value=lang;
  document.querySelectorAll('[data-i]').forEach(el=>el.textContent=t[el.dataset.i]);
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
  }catch(error){if(version===requestVersion)message(['invalid','limit','capacity'].includes(error.message)?error.message:'unavailable',true)}
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
