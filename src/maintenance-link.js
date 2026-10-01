const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function maintenanceFields(input,m={},prefix=''){
 return '<fieldset class="full maintenance-fields"><legend>Historial de mantenimiento (opcional)</legend><p class="muted">Completa la pieza para incluir este gasto en el historial de la unidad. El costo se cuenta una sola vez. Si aún no se instaló, deja la instalación vacía.</p>'+input('Pieza / trabajo realizado',prefix+'component','text',m?.component||'')+input('Fecha de compra o gasto',prefix+'purchased_on','date',m?.purchased_on||'')+input('Fecha de instalación / reparación',prefix+'installed_on','date',m?.installed_on||'')+input('Taller / lugar',prefix+'place','text',m?.place||'')+'</fieldset>';
}
export function maintenanceValue(v,prefix=''){
 if(!v[prefix+'component']?.trim())return null;
 if(!v[prefix+'purchased_on'])throw Error('Completa la fecha de compra o gasto del repuesto.');
 if(v[prefix+'installed_on']&&v[prefix+'installed_on']<v[prefix+'purchased_on'])throw Error('La instalación no puede ser anterior a la compra.');
 return Object.fromEntries(['component','purchased_on','installed_on','place'].map(k=>[k,v[prefix+k]?.trim()||null]));
}
export function linkedMaintenance(d){
 const trips=d.expenses.filter(e=>e.maintenance).map(e=>({id:e.id,vehicle_id:d.trips.find(t=>t.id===e.trip_id)?.vehicle_id,...e.maintenance,description:e.description,amount:e.amount,origin:'Liquidación del viaje',trip_id:e.trip_id,edit:'data-edit-expense'}));
 const company=d.administrative_details.filter(e=>e.active&&e.maintenance&&!d.administrative_expenses?.find(a=>a.id===e.expense_id)?.archived_at).map(e=>({id:e.expense_id,vehicle_id:e.vehicle_id,...e.maintenance,description:e.description,amount:e.amount,origin:'Gasto de empresa',edit:'data-edit-admin'}));
 return [...trips,...company];
}
export function linkedMaintenanceTable(d,vehicle,money,table){
 const rows=linkedMaintenance(d).filter(r=>!vehicle||r.vehicle_id===vehicle).sort((a,b)=>(b.installed_on||b.purchased_on).localeCompare(a.installed_on||a.purchased_on));
 return '<section class="card"><h2>Repuestos y trabajos registrados en gastos</h2><p class="muted">Estos costos ya están incluidos en su gasto de origen.</p>'+table(['Unidad','Pieza / detalle','Compra / gasto','Instalación / reparación','Lugar','Costo','Origen',''],rows.map(r=>[esc(d.vehicles.find(v=>v.id===r.vehicle_id)?.plate),esc(r.component)+'<br>'+esc(r.description),esc(r.purchased_on),esc(r.installed_on||'Pendiente de instalar / reparar'),esc(r.place||'—'),money(r.amount),esc(r.origin),'<button '+r.edit+'="'+esc(r.id)+'">Ver / editar gasto</button>']))+(!rows.length?'<p class="empty">Agrega la pieza al registrar un gasto del viaje o de la empresa.</p>':'')+'</section>';
}
