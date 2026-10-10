(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const languages = {pl:'Polski', en:'English', de:'Deutsch', es:'Español', fr:'Français', uk:'Українська', ru:'Русский'};
  const store = {get(key) {try{return localStorage.getItem(key)}catch{return null}}, set(key,value) {try{localStorage.setItem(key,value)}catch{}}};
  const params = new URLSearchParams(location.search);
  let lang = params.get('lang') || store.get('nr-studio-language');
  if (!languages[lang]) lang = 'pl';
  let qr = null, payload = '', timer, messageKey = '', error = false;
  const t = key => (window.QRTranslations[lang] || window.QRTranslations.pl)[key] || window.QRTranslations.en[key] || key;
  const picker = $('language-toggle'), menu = $('language-menu');
  function closeMenu() {menu.hidden = true; picker.setAttribute('aria-expanded','false')}
  for (const [code,name] of Object.entries(languages)) {
    const button = document.createElement('button'); button.type = 'button'; button.lang = code; button.dataset.lang = code;
    const abbr = document.createElement('span'); abbr.textContent = code.toUpperCase();
    button.append(abbr,document.createTextNode(name));
    button.addEventListener('click',() => {lang = code; store.set('nr-studio-language',lang); localize(); closeMenu(); picker.focus()});
    menu.append(button);
  }
  picker.addEventListener('click',() => {menu.hidden = !menu.hidden; picker.setAttribute('aria-expanded',String(!menu.hidden)); if (!menu.hidden) menu.querySelector(`[data-lang="${lang}"]`).focus()});
  document.addEventListener('click',event => {if (!event.target.closest('.language-picker')) closeMenu()});
  document.addEventListener('keydown',event => {if (event.key === 'Escape' && !menu.hidden) {closeMenu(); picker.focus()}});
  menu.addEventListener('keydown',event => {
    if (!['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
    event.preventDefault(); const buttons = [...menu.children], index = buttons.indexOf(document.activeElement);
    buttons[event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length].focus();
  });
  function message(key,isError = false) {messageKey = key; error = isError; $('message').textContent = key ? t(key) : ''; $('message').classList.toggle('error',error)}
  function theme() {
    const dark = document.documentElement.dataset.theme === 'dark';
    $('theme').setAttribute('aria-pressed',String(dark)); $('theme').setAttribute('aria-label',t('theme'));
    $('theme').querySelector('svg').innerHTML = dark ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>' : '<path d="M20 13a8 8 0 1 1-9-9 6 6 0 0 0 9 9Z"/>';
  }
  $('theme').addEventListener('click',() => {const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; store.set('qa-portfolio-theme',next); theme()});
  function localize() {
    document.documentElement.lang = lang; document.title = 'NR. Link Studio — ' + t('qrTab');
    document.querySelector('meta[name="description"]').content = t('meta');
    document.querySelectorAll('[data-i]').forEach(el => {el.textContent = t(el.dataset.i)});
    $('language-code').textContent = lang.toUpperCase(); $('language').value = lang;
    picker.setAttribute('aria-label',t('language'));
    menu.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.lang === lang)));
    $('result-url').setAttribute('aria-label',t('open')); theme(); message(messageKey,error);
    try {const url = new URL(location.href); url.searchParams.set('lang',lang); url.searchParams.delete('tool'); history.replaceState(null,'',url)} catch {}
  }
  function invalidate(key = '') {
    qr = null; payload = ''; $('result').hidden = true; $('empty').hidden = false; $('ready-badge').hidden = true;
    $('qr-preview').replaceChildren(); $('result-url').removeAttribute('href'); $('url').removeAttribute('aria-invalid'); message(key);
  }
  function render() {
    $('qr-preview').innerHTML = window.QRModel.svg(qr,$('ink').value,Number($('size').value));
    $('qr-preview').classList.remove('qr-updated'); void $('qr-preview').offsetWidth; $('qr-preview').classList.add('qr-updated');
    $('result-meta').textContent = `PNG / SVG · ${$('size').value} × ${$('size').value} px · ${qr.getModuleCount()} × ${qr.getModuleCount()}`;
  }
  function generate(explicit = false) {
    clearTimeout(timer);
    if (!$('url').value.trim()) {invalidate(); return}
    let normalized;
    try {normalized = window.QRModel.normalize($('url').value)} catch {invalidate(); if (explicit) {$('url').setAttribute('aria-invalid','true'); message('invalid',true)} return}
    try {
      qr = qrcode(0,$('correction').value); qr.addData(normalized,'Byte'); qr.make(); payload = normalized; render();
      $('result-url').textContent = payload; $('result-url').href = payload;
      $('empty').hidden = true; $('result').hidden = false; $('ready-badge').hidden = false; $('url').removeAttribute('aria-invalid'); message(explicit ? 'generated' : '');
    } catch {invalidate(); message('qrError',true)}
  }
  $('tool-form').addEventListener('submit',event => {event.preventDefault(); generate(true)});
  $('url').addEventListener('input',() => {clearTimeout(timer); invalidate(); timer = setTimeout(() => generate(),320)});
  $('example').addEventListener('click',() => {$('url').value = 'https://example.com'; generate(true); $('url').focus()});
  $('clear').addEventListener('click',() => {clearTimeout(timer); $('url').value = ''; invalidate(); $('url').focus()});
  $('correction').addEventListener('change',() => generate());
  for (const id of ['size','ink']) $(id).addEventListener('change',() => {if (qr) render()});
  function download(blob,name) {
    const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = name;
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url),10000); message('saved');
  }
  $('svg').addEventListener('click',() => {if (qr) download(new Blob([window.QRModel.svg(qr,$('ink').value,Number($('size').value))],{type:'image/svg+xml;charset=utf-8'}),'nr-qr.svg')});
  $('png').addEventListener('click',() => {
    if (!qr) return;
    const size = Number($('size').value), count = qr.getModuleCount(), cell = Math.floor(size/(count + 8)), offset = Math.floor((size-count*cell)/2);
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,size,size); ctx.fillStyle = $('ink').value;
    for (let y=0;y<count;y++) for (let x=0;x<count;x++) if (qr.isDark(y,x)) ctx.fillRect(offset+x*cell,offset+y*cell,cell,cell);
    canvas.toBlob(blob => {if (blob) download(blob,'nr-qr.png')},'image/png');
  });
  localize();
})();
