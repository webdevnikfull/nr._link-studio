(() => {
 'use strict';
 const languages={pl:'Polski',en:'English',de:'Deutsch',es:'Español',fr:'Français',uk:'Українська',ru:'Русский'};
 const params=new URLSearchParams(location.search);
 let saved;try{saved=localStorage.getItem('nr-studio-language')}catch{}
 let lang=Object.hasOwn(languages,params.get('lang'))?params.get('lang'):Object.hasOwn(languages,saved)?saved:'pl';
 window.StudioLanguage=lang;
 window.StudioText=key=>window.StudioTranslations[lang][key]||window.StudioTranslations.en[key]||key;
 const $=id=>document.getElementById(id),t=window.StudioText;
 const picker=$('language-toggle'),menu=$('language-menu');
 function close(){menu.hidden=true;picker.setAttribute('aria-expanded','false');}
 for(const [code,name] of Object.entries(languages)){
  const button=document.createElement('button');button.type='button';button.lang=code;button.dataset.lang=code;
  const abbr=document.createElement('span');abbr.textContent=code.toUpperCase();button.append(abbr,document.createTextNode(name));
  button.addEventListener('click',()=>{$('language').value=code;$('language').dispatchEvent(new Event('change',{bubbles:true}));close();picker.focus();});menu.append(button);
 }
 picker.addEventListener('click',()=>{menu.hidden=!menu.hidden;picker.setAttribute('aria-expanded',String(!menu.hidden));if(!menu.hidden)menu.querySelector(`[data-lang="${lang}"]`).focus();});
 document.addEventListener('click',e=>{if(!e.target.closest('.language-picker'))close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){close();picker.focus();}});
 menu.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const buttons=[...menu.children],i=buttons.indexOf(document.activeElement);buttons[e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus();}});
 function clock(){const now=new Date();$('studio-date').textContent=new Intl.DateTimeFormat(lang,{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now);$('studio-clock').textContent=new Intl.DateTimeFormat(lang,{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(now);$('studio-clock').dateTime=now.toISOString();}
 function localize(){
  document.documentElement.lang=lang;$('language').value=lang;$('language-code').textContent=lang.toUpperCase();picker.setAttribute('aria-label',t('language'));
  menu.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
  document.querySelectorAll('[data-x]').forEach(el=>el.textContent=t(el.dataset.x));document.querySelectorAll('[data-x-aria]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.xAria)));
  document.querySelectorAll('.tool-tabs a').forEach(a=>{const u=new URL(a.href);u.searchParams.set('lang',lang);a.href=u.href;});
  clock();if(serviceError)$('service-detail').textContent=t(serviceError);
 }
 let serviceError='';
 $('language').addEventListener('change',()=>{lang=$('language').value;window.StudioLanguage=lang;try{localStorage.setItem('nr-studio-language',lang)}catch{}const u=new URL(location.href);u.searchParams.set('lang',lang);history.replaceState(null,'',u);localize();document.dispatchEvent(new Event('studio:language'));});
 async function check(){
  const tool=params.get('tool');if(!['short','image'].includes(tool))return;
  $('service-check').disabled=true;
  try{
   if(location.protocol==='file:')throw Error('serviceFile');
   const response=await fetch(new URL('service-status.php',window.NR_LINK_STUDIO.apiUrl),{signal:AbortSignal.timeout(8000),cache:'no-store'});
   if(response.status===404)throw Error('serviceMissing');
   const data=await response.json();if(!response.ok||!data[tool==='short'?'links':'images'])throw Error('serviceSetup');
   serviceError='';$('service-state').hidden=true;
  }catch(error){serviceError=['serviceFile','serviceMissing','serviceSetup'].includes(error.message)?error.message:'serviceNetwork';$('service-state').hidden=false;$('service-detail').textContent=t(serviceError);}
  finally{$('service-check').disabled=false;}
 }
 $('service-check').addEventListener('click',check);
 localize();setInterval(()=>{if(!document.hidden)clock();},1000);document.addEventListener('visibilitychange',clock);check();
})();
