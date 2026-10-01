const number=v=>v==null||v===''?null:Number(v);
export function fuelSummary(r,expenses){
 const start=number(r.odometer_start),end=number(r.odometer_end),gallons=number(r.fuel_gallons);
 const fuel=expenses.filter(e=>String(e.category).toLowerCase()==='combustible');
 const amount=fuel.length?fuel.reduce((s,e)=>s+Number(e.amount),0):null;
 const km=start!=null&&end!=null&&end>=start?end-start:null;
 return {start,end,gallons,amount,km,price:amount!=null&&gallons>0?amount/gallons:null,yield:km!=null&&gallons>0?km/gallons:null};
}
export function fuelFields(f){
 const values={odometer_start:number(f.odometer_start),odometer_end:number(f.odometer_end),fuel_gallons:number(f.fuel_gallons)};
 for(const [key,value] of Object.entries(values))if(value!=null&&(!Number.isFinite(value)||value<0||(key==='fuel_gallons'&&value===0)))throw Error('Revisa los kilómetros y galones ingresados.');
 if(values.odometer_start!=null&&values.odometer_end!=null&&values.odometer_end<values.odometer_start)throw Error('El kilometraje final debe ser igual o mayor al inicial.');
 return values;
}
export function fuelCard(r,expenses,money){
 const f=fuelSummary(r,expenses),fmt=(v,suffix='',digits=1)=>v==null?'Pendiente':v.toLocaleString('es-PE',{maximumFractionDigits:digits})+suffix;
 const cell=(label,value)=>'<div class="metric"><small>'+label+'</small><strong>'+value+'</strong></div>';
 return '<section class="card"><div class="page-head"><h2>Combustible y kilómetros de la vuelta</h2><button data-round-fuel="'+r.id+'">Completar / editar</button></div><div class="metrics">'+cell('Km al salir',fmt(f.start))+cell('Km al regresar',fmt(f.end))+cell('Km recorridos',fmt(f.km,' km'))+cell('Galones de la vuelta',fmt(f.gallons,' gl',3))+cell('Gasto en combustible',f.amount==null?'Pendiente':money(f.amount))+cell('Costo por galón',f.price==null?'Pendiente':money(f.price))+cell('Rendimiento calculado',fmt(f.yield,' km/gl',3))+'</div><p class="muted">El monto viene de los gastos de combustible de esta vuelta y se cuenta una sola vez. Puedes completar los datos poco a poco.</p><p class="muted">El rendimiento es exacto cuando los galones corresponden al consumo entre ambos kilometrajes. Para medirlo, empieza y termina con el tanque lleno, incluyendo las recargas intermedias y la final; la carga inicial no se suma al consumo.</p></section>';
}
