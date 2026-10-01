export function fuelRound(d,e){
 const rounds=d.rounds||[],trip=d.trips.find(t=>t.id===e.trip_id);
 const explicit=rounds.find(r=>r.id===(trip?.round_id||e.round_id));
 if(explicit)return explicit;
 if(e.previous_odometer==null||e.odometer==null)return null;
 // A historical outing may include several refuelling intervals.
 // Use original measurements so later corrections do not lose the association.
 const matches=rounds.filter(r=>{
  if(r.vehicle_id!==e.vehicle_id)return false;
  const original=(d.history_records||[]).find(h=>h.id===r.source_record_id)?.data;
  const start=original?.odometer_start??r.odometer_start,end=original?.odometer_end??r.odometer_end;
  return start!=null&&end!=null&&Number(e.odometer)>Number(e.previous_odometer)&&Number(start)<=Number(e.previous_odometer)&&Number(end)>=Number(e.odometer);
 });
 return matches.length===1?matches[0]:null;
}
