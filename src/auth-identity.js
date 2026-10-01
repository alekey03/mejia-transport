// Identificador interno de Supabase para cuentas que ingresan con usuario.
// No es un buzón de correo. La recuperación la realiza el administrador.
export function loginIdentity(value){
 const name=String(value||'').trim().toLowerCase();
 if(name.includes('@'))return name;
 if(!/^[a-z0-9_.-]{3,40}$/.test(name))throw Error('Escribe tu usuario, por ejemplo amejia.');
 return name+'@usuarios.mt.invalid';
}
