// Visual overlays keep the real amounts in the document and accessible at all times.
const root=document.querySelector('#app'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
let previous=new Map(),frame=0,active=[];
function finish(){cancelAnimationFrame(frame);for(const a of active){a.overlay.remove();a.value.style.opacity='';a.el.classList.remove('mt-counting');}active=[];}
function refresh(){
 finish();const next=new Map(),page=root.querySelector('.topbar>span')?.textContent||'';
 root.querySelectorAll('.metric strong').forEach((el,i)=>{
  const label=el.textContent,key=page+'|'+el.parentElement.querySelector('small')?.textContent+'|'+i;next.set(key,label);
  if(reduced.matches||document.hidden||previous.get(key)===label)return;
  const match=label.match(/^(S\/\s*)?(-?[\d,]+(?:\.\d+)?)$/);if(!match)return;
  const target=Number(match[2].replaceAll(',',''));if(!Number.isFinite(target)||target===0)return;
  const precision=(match[2].split('.')[1]||'').length,formatter=new Intl.NumberFormat('en-US',{minimumFractionDigits:precision,maximumFractionDigits:precision});
  const value=document.createElement('span');value.textContent=label;
  const overlay=document.createElement('span');overlay.className='mt-number-overlay';overlay.setAttribute('aria-hidden','true');
  overlay.textContent=(match[1]||'')+formatter.format(0);value.style.opacity='0';el.replaceChildren(value,overlay);el.classList.add('mt-counting');
  active.push({el,value,overlay,target,prefix:match[1]||'',formatter});
 });
 previous=next;if(!active.length)return;
 const start=performance.now();function tick(now){const t=Math.min(1,(now-start)/650),ease=1-Math.pow(1-t,3);for(const a of active)a.overlay.textContent=a.prefix+a.formatter.format(a.target*ease);if(t<1)frame=requestAnimationFrame(tick);else finish();}frame=requestAnimationFrame(tick);
}
if(root){new MutationObserver(refresh).observe(root,{childList:true});refresh();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)finish();});
reduced.addEventListener('change',()=>{if(reduced.matches)finish();});
