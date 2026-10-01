export function filterCollections(all,tab,until=''){
 const candidates=all.filter(t=>tab==='uninvoiced'?t.invoice_status==='pending':tab==='paid'?t.collection_verified!==false&&t.customer_balance===0:tab==='detraction'?t.collection_verified!==false&&t.detraction_balance>0:t.invoice_status!=='pending'&&(t.collection_verified===false||t.customer_balance>0));
 const missing=until?candidates.filter(t=>!t.due_date).length:0;
 const rows=candidates.filter(t=>!until||(t.due_date&&t.due_date.slice(0,10)<=until)).sort((a,b)=>(a.due_date||'9999').localeCompare(b.due_date||'9999')||b.start_date.localeCompare(a.start_date));
 return {rows,missing,confirmed:rows.filter(t=>t.collection_verified!==false),unconfirmed:rows.filter(t=>t.collection_verified===false).length};
}
export function collectionsView({all,payments,tab,until,header,metric,money,sum,table,fmt,esc,openButton}){
 const {rows,missing,confirmed,unconfirmed}=filterCollections(all,tab,until);
 const last=(t,kind)=>payments.filter(p=>p.trip_id===t.id&&p.kind===kind).map(p=>p.paid_on).sort().at(-1);
 return header('Cobros de clientes','Consulta los cobros según el vencimiento de cada factura.')+
 '<div class="tabs">'+[['pending','Pendientes'],['paid','Cobradas'],['detraction','Detracciones pendientes'],['uninvoiced','Por facturar']].map(([k,v])=>'<button data-filter="'+k+'" class="'+(tab===k?'active':'')+'">'+v+'</button>').join('')+'</div>'+
 '<section class="card"><div class="actions"><label>Vencimiento hasta<input id="collection-due-until" type="date" value="'+esc(until)+'"></label>'+(until?'<button data-clear-collection-date>Quitar filtro</button>':'')+'</div><p class="muted">'+(until?'Incluye vencimientos hasta el '+fmt(until)+', también los atrasados.':'Elige una fecha para ver lo que vence hasta ese día.')+'</p>'+(missing?'<p class="notice">'+missing+' registros sin fecha de vencimiento quedan fuera del filtro. Completa esa fecha en la factura para incluirlos.</p>':'')+'</section>'+
 '<div class="metrics">'+metric('Por cobrar · esta lista',money(sum(confirmed,'customer_balance')))+metric('Cobros registrados · esta lista',money(sum(rows,'customer_paid')))+metric('Detracción pendiente · esta lista',money(sum(confirmed,'detraction_balance')))+metric('Registros · esta lista',rows.length)+'</div>'+
 (unconfirmed?'<p class="notice">Hay '+unconfirmed+' registros con pagos por confirmar en esta lista. Sus saldos no se suman hasta revisar los pagos en su factura.</p>':'')+
 '<section class="card"><h2>'+({pending:'Facturas pendientes de pago',paid:'Facturas cobradas',detraction:'Facturas con detracción pendiente',uninvoiced:'Viajes por facturar'})[tab]+'</h2>'+table(['Operación / unidad','Factura / cliente','Vencimiento','Importe total','Cobrado','Lo que falta cobrar','Último cobro','Detracción / depósito','Estado',''],rows.map(t=>[
 fmt(t.billing_operation_date||t.start_date)+'<p class="muted">'+esc(t.plate)+'</p>',esc(t.invoice_number||(t.invoice_status==='not_required'?'Sin factura':'Por emitir'))+'<p class="muted">'+esc(t.client_name)+'</p>',t.due_date?fmt(t.due_date):'Sin fecha',money(t.total),money(t.customer_paid),t.collection_verified===false?'Pago por confirmar':money(t.customer_balance),fmt(last(t,'customer')),
 money(t.detraction)+'<p class="muted">'+(t.collection_verified===false?'Por confirmar':t.detraction_balance>0?'Pendiente '+money(t.detraction_balance):t.detraction>0?'Depositada':'No aplica')+'</p>'+fmt(last(t,'detraction')),
 t.collection_verified===false?'Pago por confirmar':t.customer_balance===0&&t.detraction_balance===0?'Todo cancelado':t.customer_balance===0?'Cobrado · falta detracción':'Pendiente',openButton(t)]))+'</section>';
}
