import {resultData,tripMonth} from './operations.js?v=20261007d';
import {payableRows} from './balances.js?v=20261005b';
import {summarize,money,round} from './domain.js?v=20261005b';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inMonth=(date,month)=>date?.slice(0,7)===month;
const sum=(rows,key)=>round(rows.reduce((s,r)=>s+Number(r[key]||0),0));

export function monthlyOverviewData(d,month){
 const result=resultData(d,month),trips=d.trips.filter(t=>tripMonth(t)===month);
 const rounds=(d.rounds||[]).filter(r=>inMonth(r.start_date,month));
 const verified=trips.filter(t=>t.collection_verified!==false).map(t=>summarize(t,[],d.customer_payments||[]));
 const debts=payableRows(d).filter(e=>inMonth(e.incurred_on,month));
 const receivable=round(verified.reduce((s,t)=>s+Math.max(0,t.customer_balance),0));
 const detraction=round(verified.reduce((s,t)=>s+Math.max(0,t.detraction_balance),0));
 const payable=round(debts.reduce((s,e)=>s+Math.max(0,Number(e.amount)-e.paid),0));
 const categories=new Map();
 for(const e of [...d.expenses.filter(e=>inMonth(e.occurred_at,month)),...(d.trip_costs||[]).filter(e=>inMonth(e.period,month))]){
  const label=(e.category||'Otros gastos de viajes').trim().toLocaleUpperCase('es');
  categories.set(label,round((categories.get(label)||0)+Number(e.amount||0)));
 }
 const classified=round([...categories.values()].reduce((a,b)=>a+b,0)),adjustment=round(result.expenses-classified);
 if(adjustment)categories.set(adjustment>0?'OTROS GASTOS DEL CIERRE MENSUAL':'AJUSTE DEL CIERRE MENSUAL',adjustment);
 if(result.administrative)categories.set('GASTOS DE LA EMPRESA',result.administrative);
 const expenses=round(result.expenses+result.administrative);
 return {...result,expenses,travelExpenses:result.expenses,trips,rounds,receivable,detraction,payable,
  review:trips.filter(t=>t.collection_verified===false).length,
  completed:trips.filter(t=>t.status==='finished').length,
  settled:rounds.filter(r=>r.settlement_status==='settled').length,
  categories:[...categories].map(([label,amount])=>({label,amount})).sort((a,b)=>b.amount-a.amount)};
}

export function monthlyOverview(d,month){
 const m=monthlyOverviewData(d,month),name=new Intl.DateTimeFormat('es-PE',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(month+'-01T12:00:00Z'));
 const provisional=m.rounds.some(r=>r.settlement_status!=='settled')||m.trips.some(t=>t.status!=='finished'),max=Math.max(1,...m.categories.map(c=>Math.abs(c.amount)));
 const card=(label,value,note,kind='')=>'<div class="metric month-card '+kind+'"><small>'+label+'</small><strong>'+money(value)+'</strong><span>'+note+'</span></div>';
 return '<div class="monthly-overview"><header class="month-heading"><div><div class="eyebrow">RESUMEN DEL MES</div><h1>'+esc(name)+'</h1><p>Tu empresa, solo en el mes seleccionado.</p></div><label>Mes del resumen<input type="month" id="month" aria-label="Mes del resumen" value="'+month+'" required></label></header>'+
 '<div class="month-result-grid">'+card('Total de los viajes',m.incomes,'Servicios del mes, cobrados y por cobrar.')+card('Total de gastos',m.expenses,'Viajes: '+money(m.travelExpenses)+'<br>Empresa: '+money(m.administrative))+
 card((m.result<0?'Pérdida':'Ganancia')+(provisional?' provisional':''),m.result,'Total de viajes − gastos'+(m.other?' + otros resultados':'')+'.',m.result<0?'month-loss':'month-profit')+'</div>'+
 (m.other?'<p class="month-note">Otros resultados incluidos en este mes: <strong>'+money(m.other)+'</strong>.</p>':'')+
 '<section class="month-activity" aria-label="Actividad del mes"><div><strong>'+m.trips.length+'</strong><span>viajes del mes</span></div><div><strong>'+m.completed+'</strong><span>viajes terminados</span></div><div><strong>'+(m.trips.length-m.completed)+'</strong><span>viajes en curso</span></div><div><strong>'+m.settled+' / '+m.rounds.length+'</strong><span>vueltas liquidadas</span></div></section>'+
 '<section class="card month-pending"><h2>Lo que sigue pendiente de '+esc(name)+'</h2><p class="muted">Saldos actuales de los viajes y las deudas registrados en este mes. Se descuentan los pagos recibidos o realizados después.</p><div class="month-result-grid">'+card('Clientes por cobrar',m.receivable,'Sin incluir la detracción.')+card('Proveedores por pagar',m.payable,'Deudas y compras a crédito del mes.')+card('Detracción por recibir',m.detraction,'Se registra por separado del cobro al cliente.')+'</div>'+
 (m.review?'<p class="notice">'+m.review+' viajes del mes tienen cobros por revisar; todavía no se incluyen en los saldos de clientes.</p>':'')+'</section>'+
 '<div class="month-bottom"><section class="card"><h2>¿En qué se gastó este mes?</h2><p class="muted">De mayor a menor importe.</p>'+m.categories.map(c=>'<div class="category"><div><span>'+esc(c.label)+'</span><b>'+money(c.amount)+'</b></div><div class="track" aria-hidden="true"><b style="width:'+100*Math.abs(c.amount)/max+'%"></b></div></div>').join('')+(!m.categories.length?'<p class="empty">No hay gastos registrados para este mes.</p>':'')+'<div class="month-expense-total"><strong>Total de gastos</strong><strong>'+money(m.expenses)+'</strong></div></section>'+
 '<section class="card month-guide"><h2>Cómo se calcula este mes</h2><p><strong>Viajes:</strong> según su mes registrado.</p><p><strong>Gastos:</strong> según la fecha del gasto o el periodo de su liquidación.</p><p><strong>Ganancia:</strong> cambia al completar o corregir gastos. Cobrar una factura o pagar una deuda actualiza los saldos pendientes.</p>'+
 (provisional?'<p class="notice">Hay viajes en curso o vueltas por liquidar. La ganancia del mes todavía puede cambiar.</p>':'')+
 '<p class="muted">El historial completo está disponible en Cobros y Pagos.</p></section></div></div>';
}
