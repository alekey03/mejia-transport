export function separateDeleted(d){
 const gone=kind=>new Set((d.deleted_operations||[]).filter(x=>x.deleted&&x.kind===kind).map(x=>x.record_id));
 for(const [table,kind] of [['trips','trip'],['rounds','round']]){
  const ids=gone(kind),all=d[table]||[];
  d['deleted_'+table]=all.filter(x=>ids.has(x.id));d[table]=all.filter(x=>!ids.has(x.id));
 }
 return d;
}
export function installOperationTrash({data,form,rpc,afterDelete}){
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const rename=label=>{document.querySelector('#modal button.primary').textContent=label;};
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.deleteTrip||b.dataset.deleteRound){
   const kind=b.dataset.deleteTrip?'trip':'round',id=b.dataset.deleteTrip||b.dataset.deleteRound;
   const r=data()[kind==='trip'?'trips':'rounds'].find(x=>x.id===id);if(!r)return;
   form('Eliminar '+(kind==='trip'?'viaje':'vuelta')+' '+esc(r.number),'<p class="full">Se moverá a Eliminados y dejará de aparecer en los listados y totales. Podrás restaurarlo. Solo se permite si no tiene factura, gastos, pagos ni datos importados.</p>'+(kind==='round'?'<p class="full">Primero elimina los viajes de prueba que estén dentro de esta vuelta.</p>':''),async()=>{await rpc('mt_operation_trash',{p_kind:kind,p_id:id,p_deleted:true});afterDelete(kind);});rename('Eliminar');
  }
  if(b.hasAttribute('data-operation-trash')){
   const d=data();const rows=[...(d.deleted_rounds||[]).map(x=>({...x,kind:'round'})),...(d.deleted_trips||[]).map(x=>({...x,kind:'trip'}))];
   form('Eliminados','<p class="full">Restaura primero la vuelta y después sus viajes.</p>'+rows.map(x=>'<p class="full">'+(x.kind==='round'?'Vuelta ':'Viaje V-')+esc(x.number)+' · '+esc(x.start_date)+' · '+esc(d.vehicles.find(v=>v.id===x.vehicle_id)?.plate)+' <button type="button" data-restore-operation="'+x.id+'" data-kind="'+x.kind+'">Restaurar</button></p>').join('')+(!rows.length?'<p>No hay registros eliminados.</p>':''),async()=>{});rename('Cerrar');
  }
  if(b.dataset.restoreOperation){form('Restaurar registro','<p class="full">Volverá a aparecer en los listados y totales con los datos que tenía.</p>',()=>rpc('mt_operation_trash',{p_kind:b.dataset.kind,p_id:b.dataset.restoreOperation,p_deleted:false}));rename('Restaurar');}
 });
}
