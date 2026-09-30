(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ConverterModel=factory();})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 function pages(text,total){
  if(!Number.isInteger(total)||total<1)throw Error('pagesError');
  if(!text.trim()){if(total>40)throw Error('limitError');return Array.from({length:total},(_,i)=>i+1);}
  const out=[];
  for(const part of text.split(',')){
   const match=part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);if(!match)throw Error('pagesError');
   const from=Number(match[1]),to=Number(match[2]||match[1]);if(from<1||to<from||to>total)throw Error('pagesError');
   if(to-from>39)throw Error('limitError');for(let p=from;p<=to;p++){if(!out.includes(p))out.push(p);if(out.length>40)throw Error('limitError');}
  }
  return out;
 }
 function files(list){if(list.length>12||list.some(f=>f.size>20*1024*1024)||list.reduce((n,f)=>n+f.size,0)>60*1024*1024)throw Error('limitError');if(list.some(f=>!f.size))throw Error('fileError');return true;}
 function fit(width,height,max){if(!(width>0&&height>0)||width*height>40000000)throw Error('limitError');const ratio=max?Math.min(1,max/width):1;return {width:Math.max(1,Math.round(width*ratio)),height:Math.max(1,Math.round(height*ratio))};}
 return {pages,files,fit};
});
