export async function readResponse(response){
 const text=await response.text();
 let data=null;
 if(text.trim()){
  try{data=JSON.parse(text);}catch{
   throw Error(response.ok?'La respuesta del servidor no se pudo leer. Actualiza la página para comprobar si se guardó el cambio.':'No se pudo completar la solicitud. Intenta nuevamente.');
  }
 }
 if(!response.ok)throw Error(data?.message||data?.error_description||data?.msg||'No se pudo completar la solicitud. Intenta nuevamente.');
 return data;
}
