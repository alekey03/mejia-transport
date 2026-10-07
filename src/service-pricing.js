import {amounts,money,round} from './domain.js?v=20261005b';

export function servicePricing(values,previous={}){
 const billed=values.billing==='with',total=Number(values.value),rate=billed?Number(values.rate):0,detraction=Number(values.detraction??0);
 if(!Number.isFinite(total)||total<=0)throw Error('Ingresa el costo total del servicio.');
 if(!Number.isFinite(detraction)||detraction<0||detraction>total)throw Error('La detracción debe estar entre cero y el total del servicio.');
 if(![0,18].includes(rate))throw Error('Revisa el IGV del servicio.');
 if(!billed&&previous.invoice_status==='issued')throw Error('Este servicio tiene una factura emitida. Cambia su situación a Pendiente de emitir en Factura antes de marcarlo Sin factura.');
 const a=amounts(total,rate,'total');
 return {subtotal:a.subtotal,tax_rate:rate,detraction,invoice_status:billed?(previous.invoice_status==='issued'?'issued':'pending'):'not_required'};
}

export function pricingFields(input,select,t={}){
 return input('Costo total del servicio (S/)','value','number',t.subtotal==null?'':amounts(t.subtotal,t.tax_rate,'subtotal').total,'step="0.01" min="0.01" required')+
 select('Comprobante','billing',[['with','Con factura'],['without','Sin factura']],t.invoice_status==='not_required'?'without':'with')+
 '<div id="service-igv">'+select('IGV incluido en el total','rate',[['18','18 %'],['0','0 %']],String(t.tax_rate??18))+'</div>'+
 input('Detracción (S/)','detraction','number',t.detraction??0,'step="0.01" min="0" required')+
 '<div class="notice full" id="service-pricing-summary" aria-live="polite"></div>';
}

export function bindPricing(modal){
 const form=modal.querySelector('form'),billing=form.elements.billing,rate=form.elements.rate,total=form.elements.value,detraction=form.elements.detraction;
 const calc=()=>{
  const billed=billing.value==='with',value=Number(total.value),deduction=Number(detraction.value||0),a=amounts(value,billed?rate.value:0,'total');
  modal.querySelector('#service-igv').hidden=!billed;
  detraction.max=String(value||0);
  modal.querySelector('#service-pricing-summary').innerHTML=!total.value?'Ingresa el costo total del servicio para calcular el monto a cobrar.':
   (billed?'Subtotal: '+money(a.subtotal)+' · IGV incluido: '+money(a.tax)+'<br>':'')+
   'Total del servicio: '+money(a.total)+' − Detracción: '+money(deduction)+'<br><strong>Monto a cobrar: '+money(round(a.total-deduction))+'</strong>'+
   '<p>El total ingresado'+(billed?' ya incluye el IGV; no se suma otra vez.': ' corresponde al servicio sin factura.')+' Este monto es antes de descontar los pagos del cliente.</p>';
 };
 [billing,rate,total,detraction].forEach(el=>el.addEventListener('input',calc));
 billing.addEventListener('change',calc);calc();
}
