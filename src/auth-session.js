export function readSession(storage){
 try{const value=JSON.parse(storage.getItem('mt-session')||'null');return value?.access_token&&value?.refresh_token&&value?.user?.id?value:null;}catch{storage.removeItem('mt-session');return null;}
}
export async function authToken(url,key,grant,values,fetcher=fetch){
 let response;
 try{response=await fetcher(url+'/auth/v1/token?grant_type='+grant,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify(values),signal:AbortSignal.timeout(20000)});}catch{throw Error('No se pudo conectar. Revisa tu conexión e intenta nuevamente.');}
 const data=await response.json().catch(()=>null);
 if(!response.ok){
  const invalid=grant==='refresh_token'&&[400,401,403].includes(response.status);
  const message=response.status===429?'Demasiados intentos. Espera unos minutos antes de volver a ingresar.':response.status>=500?'El servicio de acceso no responde. Intenta nuevamente en unos momentos.':grant==='password'&&data?.error_code==='invalid_credentials'?'El usuario o la contraseña no coinciden. Revisa ambos campos.':invalid?'Tu sesión terminó. Vuelve a ingresar.':'No se pudo iniciar sesión. Intenta nuevamente.';
  throw Object.assign(Error(message),{invalidSession:invalid});
 }
 if(!data?.access_token||!data?.refresh_token||!data?.user?.id)throw Error('El servicio devolvió una respuesta incompleta. Intenta nuevamente.');
 return {...data,expires_at:Date.now()/1000+Number(data.expires_in||3600)};
}
export function singleFlight(action){let pending;return (...args)=>{if(!pending)pending=Promise.resolve().then(()=>action(...args)).finally(()=>{pending=null;});return pending;};}
