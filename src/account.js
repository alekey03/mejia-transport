const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function accountPage(user){return '<p class="muted">'+esc(user.display_name)+' · '+esc(user.username||'')+'</p><br><section class="card" style="max-width:640px"><h2>Cambiar contraseña</h2><form id="change-password"><div class="form-grid"><label class="full">Contraseña actual<input type="password" name="current" autocomplete="current-password" required></label><label>Nueva contraseña<input type="password" name="password" autocomplete="new-password" minlength="6" maxlength="128" required></label><label>Repetir nueva contraseña<input type="password" name="confirmation" autocomplete="new-password" minlength="6" maxlength="128" required></label></div><p class="muted">Mínimo 6 caracteres. Después del cambio, vuelve a ingresar con tu nueva contraseña.</p><p class="error" role="alert"></p><button class="primary" type="submit">Guardar nueva contraseña</button></form></section>';}
export async function updateOwnPassword({url,key,userId,email,current,password,confirmation,fetcher=fetch}){
 if(!current)throw Error('Escribe tu contraseña actual.');
 if(password.length<6||password.length>128)throw Error('La nueva contraseña debe tener entre 6 y 128 caracteres.');
 if(password!==confirmation)throw Error('Las nuevas contraseñas no coinciden.');
 if(password===current)throw Error('Elige una contraseña diferente a la actual.');
 const headers={apikey:key,'Content-Type':'application/json'};
 const verify=await fetcher(url+'/auth/v1/token?grant_type=password',{method:'POST',headers,body:JSON.stringify({email,password:current})});
 const identity=await verify.json();
 if(!verify.ok)throw Error(verify.status===429?'Demasiados intentos. Espera unos minutos.':'No se pudo verificar la contraseña actual. Revisa e intenta nuevamente.');
 if(identity.user?.id!==userId||!identity.access_token)throw Error('No se pudo verificar tu cuenta. Vuelve a iniciar sesión.');
 const response=await fetcher(url+'/auth/v1/user',{method:'PUT',headers:{...headers,Authorization:'Bearer '+identity.access_token},body:JSON.stringify({password,current_password:current})});
 if(!response.ok){const error=await response.json().catch(()=>({}));throw Error(error.code==='same_password'?'Elige una contraseña diferente a la actual.':error.code==='weak_password'?'Supabase rechazó esa contraseña. Prueba con otra.':'No se pudo cambiar la contraseña. Vuelve a iniciar sesión e inténtalo otra vez.');}
}
export function installAccount({changePassword,render,toast}){document.addEventListener('submit',async e=>{
 if(e.target.id!=='change-password')return;e.preventDefault();const form=e.target,button=form.querySelector('button[type=submit]'),error=form.querySelector('.error');button.disabled=true;error.textContent='';
 try{await changePassword(Object.fromEntries(new FormData(form)));form.reset();render();toast('Contraseña actualizada. Ingresa con tu nueva contraseña.');}catch(err){error.textContent=err.message;}finally{button.disabled=false;}
});}
