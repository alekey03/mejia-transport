export function availableTrips(d,r){return d.trips.filter(t=>!t.round_id&&t.vehicle_id===r.vehicle_id).sort((a,b)=>b.start_date.localeCompare(a.start_date)||b.number-a.number);}
export function attachExistingTrip(ctx,id){
 const {data,form,select,rpc}=ctx,d=data(),r=d.rounds.find(x=>x.id===id);if(!r)return;
 const candidates=availableTrips(d,r);
 if(r.status==='finished'||r.settlement_status==='settled'){form('Añadir viaje existente','<p>Reabre la vuelta y su liquidación antes de añadir viajes.</p>',async()=>{});document.querySelector('#modal button.primary').textContent='Cerrar';return;}
 if(!candidates.length){form('Añadir viaje existente','<p class="full">No hay viajes disponibles de esta unidad. Registra el servicio en la pestaña Viajes y luego vuelve aquí. Los viajes que ya pertenecen a otra vuelta no aparecen.</p>',async()=>{});document.querySelector('#modal button.primary').textContent='Cerrar';return;}
 form('Añadir viaje existente',select('Viaje registrado','trip_id',[['','Selecciona un viaje'],...candidates.map(t=>[t.id,'V-'+String(t.number).padStart(3,'0')+' · '+t.start_date.split('-').reverse().join('/')+' · '+(d.clients.find(c=>c.id===t.client_id)?.name||'')+' · '+t.origin+' → '+t.destination])],'')+'<p class="full">Solo aparecen viajes de esta unidad que todavía no pertenecen a una vuelta. Se conservan su factura y sus cobros.</p>',f=>{if(!candidates.some(t=>t.id===f.trip_id))throw Error('Selecciona un viaje.');return rpc('mt_attach_trip',{p_trip:f.trip_id,p_round:id});});
 document.querySelector('#modal button.primary').textContent='Añadir a la vuelta';
}
