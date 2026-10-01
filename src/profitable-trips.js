export function profitableTrips(rows,unallocated=()=>false){
 return rows.filter(t=>t.status==='finished'&&t.settlement_status==='settled'&&!unallocated(t)&&Number.isFinite(t.operating_result))
  .slice().sort((a,b)=>b.operating_result-a.operating_result||b.start_date.localeCompare(a.start_date)||a.number-b.number).slice(0,5);
}
