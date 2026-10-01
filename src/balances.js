import {round,summarize,money} from './domain.js';
export function payableRows(d){
 const paid=(rows,key,id)=>rows.filter(p=>p[key]===id).reduce((s,p)=>s+Number(p.amount),0);
 return [...(d.payable_accounts||[]).map(e=>({...e,paid:paid(d.payable_payments||[],'account_id',e.id)})),...(d.expenses||[]).filter(e=>e.payment_mode==='credit').map(e=>({...e,concept:e.category,vehicle_id:d.trips.find(t=>t.id===e.trip_id)?.vehicle_id,incurred_on:e.occurred_at?.slice(0,10),paid:paid(d.supplier_payments||[],'expense_id',e.id)}))];
}
export function pendingBalances(d){
 const pendingReview=d.trips.filter(t=>t.collection_verified===false).length;
 const verified=d.trips.filter(t=>t.collection_verified!==false).map(t=>summarize(t,[],d.customer_payments||[]));
 const receivable=round(verified.reduce((s,t)=>s+Math.max(0,t.customer_balance),0));
 const detraction=round(verified.reduce((s,t)=>s+Math.max(0,t.detraction_balance),0));
 const payable=round(payableRows(d).reduce((s,e)=>s+Math.max(0,Number(e.amount)-e.paid),0));
 return {receivable,payable,detraction,difference:round(receivable-payable),pendingReview};
}
export function balancesPanel(d){
 const b=pendingBalances(d);
 return '<section class="pending-overview"><div class="page-head"><div><h2>Cobros y pagos pendientes</h2><p class="muted">Acumulado de todos los meses, independiente de los filtros de viajes.</p></div></div><div class="metrics balance-metrics"><button class="metric" data-page="Cobros"><small>Por cobrar'+(b.pendingReview?' · verificado':'')+'</small><strong>'+money(b.receivable)+'</strong><span>Ver cobros →</span></button><button class="metric" data-page="Por pagar"><small>Por pagar</small><strong>'+money(b.payable)+'</strong><span>Ver deudas y registrar pagos →</span></button><div class="metric balance-net"><small>Por cobrar menos por pagar'+(b.pendingReview?' · parcial':'')+'</small><strong>'+money(b.difference)+'</strong><span>Por cobrar − por pagar</span></div></div><p class="muted">Esta diferencia no es la utilidad ni el dinero disponible en caja. Se actualiza con cada cobro o pago registrado.'+(b.detraction?' Detracciones pendientes, separadas de este saldo: '+money(b.detraction)+'.':'')+'</p>'+(b.pendingReview?'<p class="notice">Hay '+b.pendingReview+' viajes con pagos por revisar. Sus importes aún no están incluidos: el total por cobrar y la diferencia son parciales.</p>':'')+'</section>';
}
