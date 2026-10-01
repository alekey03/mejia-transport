const eye='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path class="eye-slash" d="m3 3 18 18"/></svg>';
function enhancePasswords(){
 document.querySelectorAll('input[type="password"]').forEach(input=>{
  if(input.closest('.password-field'))return;
  const wrapper=document.createElement('span');wrapper.className='password-field';
  input.before(wrapper);wrapper.append(input);
  const button=document.createElement('button');button.type='button';button.className='password-toggle';button.innerHTML=eye;
  button.setAttribute('aria-label','Mostrar contraseña');button.setAttribute('aria-pressed','false');button.title='Mostrar contraseña';
  button.addEventListener('click',()=>{const visible=input.type==='password';input.type=visible?'text':'password';button.setAttribute('aria-pressed',String(visible));button.setAttribute('aria-label',visible?'Ocultar contraseña':'Mostrar contraseña');button.title=visible?'Ocultar contraseña':'Mostrar contraseña';});
  wrapper.append(button);
 });
}
new MutationObserver(enhancePasswords).observe(document.body,{childList:true,subtree:true});
enhancePasswords();
