import {roundSummary} from './rounds.js?v=20261007g';
import {tripMonth} from './operations.js?v=20261007d';
import {payableRows} from './balances.js?v=20261005b';
import {summarize,money,round} from './domain.js?v=20261005b';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inMonth=(date,month)=>date?.slice(0,7)===month;
const sum=(rows,key)=>round(rows.reduce((s,r)=>s+Number(r[key]||0),0));

export function monthlyOverviewData(d,month){
 const monthlyTrips=d.trips.filter(t=>tripMonth(t)===month);
 const rounds=(d.rounds||[]).filter(r=>inMonth(r.start_date,month)).map(r=>roundSummary(d,r));
 const trips=rounds.flatMap(r=>r.trips),unassigned=monthlyTrips.filter(t=>!t.round_id);
 const incomes=sum(rounds,'revenue'),travelExpenses=sum(rounds,'cost'),travelProfit=sum(rounds,'profit');
 const administrative=sum((d.administrative_expenses||[]).filter(e=>!e.archived_at&&inMonth(e.period,month)),'amount');
 const result={incomes,administrative,expenses:travelExpenses,result:round(travelProfit-administrative),other:0};
 const verified=monthlyTrips.filter(t=>t.collection_verified!==false).map(t=>summarize(t,[],d.customer_payments||[]));
 const debts=payableRows(d).filter(e=>inMonth(e.incurred_on,month));
 const receivable=round(verified.reduce((s,t)=>s+Math.max(0,t.customer_balance),0));
 const detraction=round(verified.reduce((s,t)=>s+Math.max(0,t.detraction_balance),0));
 const payable=round(debts.reduce((s,e)=>s+Math.max(0,Number(e.amount)-e.paid),0));
 const fuelPayable=round(debts.filter(e=>(e.concept||'').trim().toLocaleLowerCase('es')==='combustible').reduce((s,e)=>s+Math.max(0,Number(e.amount)-e.paid),0));
 const categories=new Map();
 for(const e of rounds.flatMap(r=>r.expenses)){
  const label=(e.category||'Otros gastos de viajes').trim().toLocaleUpperCase('es');
  categories.set(label,round((categories.get(label)||0)+Number(e.amount||0)));
 }
 if(result.administrative)categories.set('GASTOS DE LA EMPRESA',result.administrative);
 const expenses=round(result.expenses+result.administrative);
 return {...result,expenses,travelExpenses:result.expenses,trips,rounds,unassigned,receivable,detraction,payable,fuelPayable,travelProfit,
  review:monthlyTrips.filter(t=>t.collection_verified===false).length,
  completed:trips.filter(t=>t.status==='finished').length,
  settled:rounds.filter(r=>r.settlement_status==='settled').length,
  categories:[...categories].map(([label,amount])=>({label,amount})).sort((a,b)=>b.amount-a.amount)};
}

export function monthlyOverview(d,month){
 const m=monthlyOverviewData(d,month),name=new Intl.DateTimeFormat('es-PE',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(month+'-01T12:00:00Z'));
 const provisional=m.rounds.some(r=>r.settlement_status!=='settled')||m.trips.some(t=>t.status!=='finished'),max=Math.max(1,...m.categories.map(c=>Math.abs(c.amount)));
 const card=(label,value,note,kind='')=>'<div class="metric month-card '+kind+'"><small>'+label+'</small><strong>'+money(value)+'</strong><span>'+note+'</span></div>';
 return '<div class="monthly-overview"><header class="month-heading"><div><div class="eyebrow">RESUMEN DEL MES</div><h1>'+esc(name)+'</h1><p>Tu empresa, solo en el mes seleccionado.</p></div><label>Mes del resumen<input type="month" id="month" aria-label="Mes del resumen" value="'+month+'" required></label></header>'+
 '<div class="month-result-grid">'+card('Ganancia por viajes',m.travelProfit,'Suma de ganancias de las vueltas del mes.')+card('Gastos de empresa',m.administrative,'Reparaciones y demás gastos de empresa.')+
 card('Ganancia total del mes',m.result,'Ganancia por viajes − gastos de empresa'+(m.other?' + otros resultados':'')+'.'+(provisional?' Provisional.':''),m.result<0?'month-loss':'month-profit')+'</div>'+
 (m.other?'<p class="month-note">Otros resultados incluidos en este mes: <strong>'+money(m.other)+'</strong>.</p>':'')+
 (m.unassigned.length?'<p class="notice">'+m.unassigned.length+' viajes del mes aún no están asociados a una vuelta. Añádelos desde Vueltas para incluirlos en esta ganancia.</p>':'')+'<section class="month-activity" aria-label="Actividad del mes"><div><strong>'+m.trips.length+'</strong><span>viajes de estas vueltas</span></div><div><strong>'+m.completed+'</strong><span>viajes terminados</span></div><div><strong>'+(m.trips.length-m.completed)+'</strong><span>viajes en curso</span></div><div><strong>'+m.settled+' / '+m.rounds.length+'</strong><span>vueltas liquidadas</span></div></section>'+
 '<section class="card month-pending"><h2>Lo que sigue pendiente de '+esc(name)+'</h2><p class="muted">Saldos actuales de los viajes y las deudas registrados en este mes. Se descuentan los pagos recibidos o realizados después.</p><div class="month-result-grid month-pending-grid">'+card('Clientes por cobrar',m.receivable,'Saldo pendiente de los clientes.')+card('Proveedores por pagar',m.payable,'Combustible pendiente: '+money(m.fuelPayable)+'<br>Otros proveedores: '+money(round(m.payable-m.fuelPayable)))+'</div>'+
 (m.review?'<p class="notice">'+m.review+' viajes del mes tienen cobros por revisar; todavía no se incluyen en los saldos de clientes.</p>':'')+'</section>'+
 '<div class="month-bottom"><section class="card"><h2>¿En qué se gastó este mes?</h2><p class="muted">De mayor a menor importe.</p>'+m.categories.map(c=>'<div class="category"><div><span>'+esc(c.label)+'</span><b>'+money(c.amount)+'</b></div><div class="track" aria-hidden="true"><b style="width:'+100*Math.abs(c.amount)/max+'%"></b></div></div>').join('')+(!m.categories.length?'<p class="empty">No hay gastos registrados para este mes.</p>':'')+'<div class="month-expense-total"><strong>Total de gastos</strong><strong>'+money(m.expenses)+'</strong></div></section>'+
 '<section class="card month-guide"><h2>Cómo se calcula este mes</h2><p><strong>Viajes:</strong> de las vueltas que iniciaron en el mes seleccionado.</p><p><strong>Gastos:</strong> se incluyen todos los gastos de esas vueltas, aunque se registren en el mes siguiente. Los gastos de empresa corresponden al mes seleccionado.</p><p><strong>Ganancia:</strong> cambia al completar o corregir gastos. Cobrar una factura o pagar una deuda actualiza los saldos pendientes.</p>'+
 (provisional?'<p class="notice">Hay viajes en curso o vueltas por liquidar. La ganancia del mes todavía puede cambiar.</p>':'')+
 '<p class="muted">El historial completo está disponible en Cobros y Pagos.</p></section></div></div>';
}
