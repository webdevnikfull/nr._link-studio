(() => {
 'use strict';
 if(new URLSearchParams(location.search).get('tool')!=='convert')return;
 const $=id=>document.getElementById(id),t=window.StudioText;
 let mode='images-pdf',files=[],results=[],busy=false,cancelled=false,messageKey='';
 document.documentElement.dataset.tool='convert';$('link-workspace').hidden=true;$('converter-workspace').hidden=false;
 document.querySelectorAll('.tool-tabs a').forEach(a=>{if(new URL(a.href).searchParams.get('tool')==='convert')a.setAttribute('aria-current','page');});
 document.querySelector('.how-it-works').hidden=true;
 function localize(){
  const common=NRLinkTranslations[StudioLanguage];document.querySelectorAll('[data-i]').forEach(el=>{if(common[el.dataset.i])el.textContent=common[el.dataset.i]});
  document.querySelector('[data-i=title]').textContent=t('convertTitle');document.querySelector('[data-i=intro]').textContent=t('convertIntro');
  document.title='NR. Link Studio — '+t('convertTab');$('theme').setAttribute('aria-label',common.theme);$('portfolio-link').href=NR_LINK_STUDIO.portfolioUrl;$('back-link').href=NR_LINK_STUDIO.portfolioUrl;
  list();output();if(messageKey)message(messageKey,$('convert-message').classList.contains('error'));
 }
 function message(key,error=false){messageKey=key;$('convert-message').textContent=key?t(key):'';$('convert-message').classList.toggle('error',error);}
 function controls(){
  document.querySelectorAll('#converter-workspace input,#converter-workspace select,[data-mode],#convert-drop,#convert-list button').forEach(e=>e.disabled=busy);
  $('convert-start').disabled=busy||!files.length;$('convert-progress').hidden=!busy;
  $('format-label').hidden=!['images','pdf-images'].includes(mode);$('quality-label').hidden=mode==='merge'||(['images','pdf-images'].includes(mode)&&$('convert-format').value==='png');
  $('width-label').hidden=mode==='merge';$('paper-label').hidden=mode!=='images-pdf';$('pages-label').hidden=mode!=='pdf-images';
  $('convert-files').accept=mode.startsWith('pdf')||mode==='merge'?'.pdf':'image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif,image/x-icon,image/svg+xml,.ico';
  $('convert-files').multiple=mode!=='pdf-images';
 }
 function clearResults(){for(const r of results)URL.revokeObjectURL(r.url);results=[];output();}
 function list(){
  $('convert-list').replaceChildren(...files.map((file,index)=>{
   const row=document.createElement('li'),info=document.createElement('div');info.className='file-info';const name=document.createElement('strong');name.textContent=file.name;const size=document.createElement('small');size.textContent=(file.size/1024/1024).toFixed(2)+' MB';info.append(name,size);row.append(info);
   for(const [symbol,key,delta] of [['↑','moveUp',-1],['↓','moveDown',1],['×','remove',0]]){const b=document.createElement('button');b.type='button';b.textContent=symbol;b.setAttribute('aria-label',t(key)+': '+file.name);b.disabled=busy||delta===-1&&index===0||delta===1&&index===files.length-1;b.addEventListener('click',()=>{if(delta){const other=index+delta;if(other<0||other>=files.length)return;[files[index],files[other]]=[files[other],files[index]];}else files.splice(index,1);clearResults();list();controls();});row.append(b);}return row;
  }));
 }
 function output(){
  $('convert-empty').hidden=!!results.length;$('convert-ready').hidden=!results.length;$('convert-zip').hidden=results.length<2;
  $('convert-results').replaceChildren(...results.map(r=>{const card=document.createElement('article');card.className='converted-item';if(r.blob.type.startsWith('image/')){const img=document.createElement('img');img.src=r.url;img.alt=t('preview');card.append(img);}const box=document.createElement('div'),title=document.createElement('strong'),size=document.createElement('small'),link=document.createElement('a');title.textContent=r.name;size.textContent=(r.blob.size/1024).toFixed(1)+' KB';link.href=r.url;link.download=r.name;link.textContent=t('download')+' ↓';box.append(title,size,document.createElement('br'),link);card.append(box);return card;}));
 }
 function addResult(blob,name){results.push({blob,name,url:URL.createObjectURL(blob)});}
 function addFiles(incoming){
  const next=[...files,...incoming];try{ConverterModel.files(next);if(mode==='pdf-images'&&next.length>1)throw Error('onePdf');const pdf=mode==='merge'||mode==='pdf-images';if(next.some(f=>pdf?!/\.pdf$/i.test(f.name):/\.pdf$/i.test(f.name)))throw Error('fileError');files=next;clearResults();list();controls();message('');}catch(e){message(e.message,true);}$('convert-files').value='';
 }
 $('convert-drop').addEventListener('click',()=>$('convert-files').click());$('convert-files').addEventListener('change',e=>addFiles([...e.target.files]));
 ['dragenter','dragover','dragleave','drop'].forEach(type=>$('convert-drop').addEventListener(type,event=>{event.preventDefault();if(type==='drop'&&!busy)addFiles([...event.dataTransfer.files]);}));
 document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;files=[];clearResults();list();controls();message('');document.querySelectorAll('[data-mode]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));}));
 document.querySelectorAll('.converter-settings input,.converter-settings select').forEach(el=>el.addEventListener('input',()=>{$('quality-value').textContent=$('convert-quality').value+'%';clearResults();controls();message('');}));
 const libraries={};
 function script(src){return libraries[src]||(libraries[src]=new Promise((resolve,reject)=>{const tag=document.createElement('script');tag.src=src;tag.onload=resolve;tag.onerror=()=>{delete libraries[src];reject(Error('fileError'))};document.head.append(tag);}));}
 async function raster(file,white=false){
  const p=await NRImageFiles.prepare(file,20*1024*1024);if(!p.preview)throw Error('fileError');
  const bitmap=await createImageBitmap(p.file),dimensions=ConverterModel.fit(bitmap.width,bitmap.height,Number($('convert-width').value));
  const canvas=document.createElement('canvas');canvas.width=dimensions.width;canvas.height=dimensions.height;const c=canvas.getContext('2d');if(white){c.fillStyle='#fff';c.fillRect(0,0,canvas.width,canvas.height);}c.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return canvas;
 }
 async function blob(canvas,format){const mime='image/'+format;const b=await new Promise(resolve=>canvas.toBlob(resolve,mime,Number($('convert-quality').value)/100));if(!b||b.type!==mime)throw Error('fileError');return b;}
 async function tick(value){if(cancelled)throw Error('cancelled');$('convert-progress progress').value=value;await new Promise(resolve=>setTimeout(resolve,0));if(cancelled)throw Error('cancelled');}
 const baseName=file=>file.name.replace(/\.[^.]+$/,'').replace(/[\\/:*?"<>|]/g,'_').slice(0,90)||'file';
 async function run(){
  if(!files.length){message('selectFirst',true);return;}if(mode==='merge'&&files.length<2){message('mergeMin',true);return;}
  busy=true;cancelled=false;clearResults();controls();list();message('processing');
  try{
   if(mode==='images'){
    for(let i=0;i<files.length;i++){await tick(i/files.length*100);const format=$('convert-format').value,canvas=await raster(files[i],format==='jpeg');addResult(await blob(canvas,format),`${String(i+1).padStart(2,'0')}-${baseName(files[i])}.${format==='jpeg'?'jpg':format}`);canvas.width=canvas.height=0;}
   }else if(mode==='images-pdf'){
    await script('vendor/pdf-lib.min.js');const pdf=await PDFLib.PDFDocument.create();
    for(let i=0;i<files.length;i++){await tick(i/files.length*90);const canvas=await raster(files[i],true),image=await pdf.embedJpg(await (await blob(canvas,'jpeg')).arrayBuffer());let w=canvas.width*.75,h=canvas.height*.75;
     if($('convert-paper').value==='a4'){const landscape=w>h;w=landscape?841.89:595.28;h=landscape?595.28:841.89;}
     const margin=$('convert-paper').value==='a4'?28:0,scale=Math.min((w-2*margin)/image.width,(h-2*margin)/image.height),iw=image.width*scale,ih=image.height*scale;
     pdf.addPage([w,h]).drawImage(image,{x:(w-iw)/2,y:(h-ih)/2,width:iw,height:ih});canvas.width=canvas.height=0;
    }
    addResult(new Blob([await pdf.save()],{type:'application/pdf'}),'nr-images.pdf');
   }else if(mode==='merge'){
    await script('vendor/pdf-lib.min.js');const pdf=await PDFLib.PDFDocument.create();let count=0;
    for(let i=0;i<files.length;i++){await tick(i/files.length*90);const source=await PDFLib.PDFDocument.load(await files[i].arrayBuffer());count+=source.getPageCount();if(count>40)throw Error('limitError');const pages=await pdf.copyPages(source,source.getPageIndices());pages.forEach(page=>pdf.addPage(page));}
    addResult(new Blob([await pdf.save()],{type:'application/pdf'}),'nr-merged.pdf');
   }else{
    const pdfjs=await import('./vendor/pdfjs/pdf.min.mjs');pdfjs.GlobalWorkerOptions.workerSrc=new URL('vendor/pdfjs/pdf.worker.min.mjs',location.href).href;
    const loading=pdfjs.getDocument({data:new Uint8Array(await files[0].arrayBuffer()),isEvalSupported:false,enableXfa:false,useWasm:false,standardFontDataUrl:new URL('vendor/pdfjs/standard_fonts/',location.href).href});
    let pdf;try{pdf=await loading.promise;const selected=ConverterModel.pages($('convert-pages').value,pdf.numPages);
     for(let i=0;i<selected.length;i++){await tick(i/selected.length*100);const page=await pdf.getPage(selected[i]),base=page.getViewport({scale:1.5});let scale=1.5;const max=Number($('convert-width').value);if(max&&base.width>max)scale*=max/base.width;const vp=page.getViewport({scale});ConverterModel.fit(vp.width,vp.height,0);const canvas=document.createElement('canvas');canvas.width=Math.ceil(vp.width);canvas.height=Math.ceil(vp.height);await page.render({canvasContext:canvas.getContext('2d'),viewport:vp,background:'rgb(255,255,255)'}).promise;const format=$('convert-format').value;addResult(await blob(canvas,format),`${baseName(files[0])}-${String(selected[i]).padStart(3,'0')}.${format==='jpeg'?'jpg':format}`);canvas.width=canvas.height=0;page.cleanup();}
    }finally{await loading.destroy();}
   }
   await tick(100);output();message('finished');
  }catch(error){clearResults();message(['limitError','pagesError','cancelled'].includes(error.message)?error.message:'fileError',error.message!=='cancelled');}
  finally{busy=false;controls();list();}
 }
 $('convert-start').addEventListener('click',run);$('convert-cancel').addEventListener('click',()=>{cancelled=true;});
 $('convert-zip').addEventListener('click',async()=>{const b=$('convert-zip');b.disabled=true;try{await script('vendor/jszip.min.js');const zip=new JSZip();for(const r of results)zip.file(r.name,r.blob);const file=await zip.generateAsync({type:'blob'}),url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download='nr-converted-files.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}catch{message('fileError',true)}finally{b.disabled=false;}});
 $('theme').setAttribute('aria-pressed',String(document.documentElement.dataset.theme==='dark'));$('theme').addEventListener('click',()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';$('theme').setAttribute('aria-pressed',String(dark));try{localStorage.setItem('qa-portfolio-theme',dark?'dark':'light')}catch{}});
 document.addEventListener('studio:language',localize);window.addEventListener('beforeunload',()=>results.forEach(r=>URL.revokeObjectURL(r.url)));controls();localize();
})();
