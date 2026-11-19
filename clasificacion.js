function normalizar(t){return String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ').replace(/[ .]+$/g,'')}
function dimensionRequests(texto){
 const n=normalizar(texto),out=[];
 // Identifica el sentido solicitado; no confunde una descripción del estado actual con una petición explícita.
 const sizeSmall=/(mas (?:pequen|chic|chiquit)|(?:catalogo|libro|acordeon).{0,18}mas (?:pequen|chic)|(?:reducir|reduzcan|reducido|menor|mas corto).{0,18}(?:tamano|formato)|(?:tamano|formato).{0,22}(?:menor|reduc|chic|pequen)|(?:esta|estan|viene|vienen|son|se ve|se ven).{0,14}(?:muy )?grand(?:e|es)|no tan grand(?:e|es)|menos grand(?:e|es)|mas reducido|que sea chico|que sea pequeno)/.test(n);
 const sizeLarge=/(mas grand(?:e|es)|agrand(?:ar|en)|mayor tamano|aumentar.{0,14}tamano|(?:tamano|formato).{0,22}(?:mayor|ampli)|mas amplio|no tan pequen|no tan chic|menos pequen|que sea grand(?:e|es)|que lo hagan mas grande|(?:esta|estan|viene|vienen|se ve|se ven).{0,14}(?:muy )?(?:pequen|chic))/.test(n);
 if(sizeSmall&&!sizeLarge)out.push('Tamaño: más pequeño');
 else if(sizeLarge&&!sizeSmall)out.push('Tamaño: más grande');
 else if((sizeSmall&&sizeLarge)||(/(?:tamano|formato|catalogo|libro|acordeon)/.test(n)&&/(?:pequen|chic|grand|medida|dimension)/.test(n)))out.push('Tamaño: dirección no especificada (¿más pequeño o más grande?)');
 // Grosor: más delgado frente a más grueso.
 const thin=/(mas delgad|menos grues|menos espeso|mas fino|no tan grues|reducir.{0,14}(?:grosor|espesor)|menos grosor|delgadito|delgaditos|muy grues(?:o|a|os|as)|(?:esta|estan|viene|vienen).{0,12}grues(?:o|a|os|as)|no tan grues)/.test(n);
 const thick=/(mas grues|mas espeso|mayor grosor|aumentar.{0,14}(?:grosor|espesor)|mas grosor|mas ancho.{0,14}(?:grosor|espesor)|no tan delgad|menos delgad|que sea mas grues)/.test(n);
 if(thin&&!thick)out.push('Grosor: más delgado');
 else if(thick&&!thin)out.push('Grosor: más grueso');
 else if((thin&&thick)||/(grosor|gruesor|espesor|grues|delgad)/.test(n))out.push('Grosor: dirección no especificada (¿más delgado o más grueso?)');
 // Peso: distingue reducirlo de aumentarlo.
 const light=/(mas liger|menos pesad|que pese menos|que no pese tanto|menos peso|reducir.{0,14}peso|peso.{0,14}(?:menor|menos|liger)|muy pesad|(?:esta|estan|viene|vienen).{0,12}pesad|no tan pesad|que pese poquito)/.test(n);
 const heavy=/(mas pesad|que pese mas|mayor peso|aumentar.{0,14}peso|peso.{0,14}(?:mayor|mas)|mas peso|no tan liger|menos liger|que tenga mas peso)/.test(n);
 if(light&&!heavy)out.push('Peso: más ligero');
 else if(heavy&&!light)out.push('Peso: más pesado');
 else if((light&&heavy)||/(peso|pesad|cargar|estorba)/.test(n))out.push('Peso: dirección no especificada (¿más ligero o más pesado?)');
 if(/pocket|formato compacto|mas compacto|compacto/.test(n))out.push('Formato pocket / compacto');
 return [...new Set(out)];
}
function dimensionesClasificadas(a){
 const m=new Map();
 a.forEach(x=>{
  const comentario=String(x.p2||'').trim();if(!comentario)return;
  dimensionRequests(comentario).forEach(c=>{
   if(!m.has(c))m.set(c,[]);
   m.get(c).push({...x,__dimensionCatalogos:catalogosDeRespuesta(x.p1),__dimensionComentario:comentario});
  });
 });
 return [...m.entries()].sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0],'es'));
}

const REGLAS=[
 ['Disponibilidad de mercancía',/no hay|nunca hay|no esta[n]?|no existe|se agot|agota|existencia|disponib|negado|inventario|haya mercancia|haya producto|encuentre.*(producto|mercancia)|mercancia.*tienda/],
 ['Vigencia y cambios de edición',/vigencia|edicion|cambia.*(seguido|rapido|rato|pronto|constant)|dure mas|tiempo de vida/],
 ['Contenido repetido entre catálogos',/repetid|repetitiv|lo mismo|contenido.*(demas|otros).*catalog|ya.*otro.*catalog/],
 ['Tamaño del catálogo: más pequeño',/mas (?:pequen|chic)|catalogo(?:s)? (?:mas )?(?:pequen|chic)|catalogo.{0,18}(?:pequen|chic)/],
 ['Tamaño del catálogo: más grande',/mas grand|catalogo(?:s)? (?:mas )?grand|agrand(?:ar|en)|catalogo.{0,18}grand/],
 ['Grosor: más delgado',/mas delgad|menos grues|menos espeso|mas fino|menos grueso/],
 ['Grosor: más grueso',/mas grues|mas espeso|mas ancho.{0,12}grosor/],
 ['Peso: más ligero',/mas liger|menos pesad|que pese menos|menos peso/],
 ['Peso: más pesado',/mas pesad|mas pesado|que pese mas|mayor peso/],
 ['Formato pocket / compacto',/pocket|formato compacto|mas compacto/],
 ['Tamaño, peso o grosor: sin precisar',/\bpeso\b|\btamano\b|\bgrosor\b|cargar|estorba/],
 ['Información y legibilidad',/\bid\b|\baidi\b|legib|caracteristica|descripcion|informacion|senaliz/],
 ['Promociones y rentabilidad',/promocion|oferta|ganancia|margen|rentab|no le gana/],
 ['Precio / costo',/precio|caro|costo|cuesta|econom|barato/],
 ['Preferencia digital',/digital|descarg|en linea/],
 ['Servicio y cumplimiento',/pedido.*(llega|tiempo)|no.*quisieron.*cambiar|servicio|ubicacion|destiempo|devolucion/],
 ['Entrega de catálogos en afiliación',/no den catalog|afiliacion|entreg.*catalog/],
 ['Uso personal',/uso personal|consumo personal|mi consumo|no.*para venta/],
 ['Temporada de compra',/temporada|diciembre|navidad/],
 ['Sin clientes para ese catálogo',/no tengo.*(cliente|nino)|no tiene.*publico|publico.*(no|adult|infant)|solo vendo|vendo mas|no vendo (ropa|accesorio|calzado)|client.*son.*(hombre|mujer|adult)/],
 ['Baja demanda de sus clientes',/no.*solicitan|no.*piden|rara vez.*pedido|no.*compran|baja demanda/],
 ['Bajo resultado de venta / causa por precisar',/no.*vend|no.*venta|poco.*vend|baja.*venta|no.*funcion.*venta/],
 ['Poco contenido o variedad',/variedad|muy poco|muy poquito|mas.*(modelo|estilo|marca|calzado|ropa)|poco.*(producto|contenido)/],
 ['Contenido y organización del catálogo',/seccion|organiza|no debe.*ahi|solo catalogo/],
 ['Papel / calidad física',/papel|encuaderna|hoja|calidad fisica/],
 ['Diseño / presentación',/diseno|portada|presentacion|apariencia/],
 ['Imágenes / fotografías',/foto|imagen/],
 ['Marcas',/marca/]
];
function categoryNames(t){
 const n=normalizar(t);if(!n)return [];
 let mapped=CLASIFICACION_VALIDADA[n];
 if(mapped){
  const clean=mapped.filter(c=>!/^Tamaño, peso/.test(c) && !/^Tamaño del catálogo:/.test(c) && !/^Grosor:/.test(c) && !/^Peso:/.test(c) && c!=='No especificó el motivo');
  const dims=dimensionRequests(t);
  if(clean.length||dims.length)return [...new Set([...clean,...dims])];
 }
 if(/^(nada|ninguna|ninguno|todo bien|todo esta bien|esta bien|asi esta bien|sin quejas|no le mejoraria nada|me gusta todo)[.! ]*$/.test(n))return ['Sin mejora solicitada / satisfecho'];
 if(/^(si )?(compro|compra|utilizo|usa|utiliza).*todos/.test(n))return ['No aplica: compra o utiliza todos'];
 const hits=REGLAS.filter(([c,re])=>re.test(n)
   && !/^Tamaño, peso/.test(c) && !/^Tamaño del catálogo:/.test(c) && !/^Grosor:/.test(c) && !/^Peso:/.test(c)
   && !((/\bid\b|\baidi\b/.test(n))&&/^(Tamaño del catálogo|Grosor:|Peso:|Formato pocket)/.test(c))
 ).map(([c])=>c);
 const dims=dimensionRequests(t);
 // Respuestas vagas pero interpretables se separan para evitar acumular motivos distintos en "No especificó".
 if(/no me gusta|no me agrad|no me convence|no me llama la atencion|no es de mi agrado|no es mi estilo|no es mi preferencia|no les gusta|no le gusta|no me gustan|no le gustan/.test(n))hits.push('No es de su preferencia / no le agrada');
 if(/no me sirve|no me sirven|no le sirve|no le sirven|no me funciona|no me funcionan|no le funciona|no le funcionan|no me es util|no le es util|no es util|no lo necesito|no los necesito|no me interesa|no le interesa|no lo ocupo|no los ocupo/.test(n)){
  if(/no me interesa|no le interesa|no lo necesito|no los necesito|no lo ocupo|no los ocupo/.test(n))hits.push('No le interesa / no lo necesita');
  else hits.push('No le resulta útil / no le sirve');
 }
 if(/casi no lo utilizo|casi no lo uso|no lo utilizo|no lo uso|lo utilizo poco|lo uso poco|casi no los utilizo|casi no los uso|no los utilizo|no los uso|lo utilizo muy poco|lo uso muy poco/.test(n))hits.push('Uso poco / no utiliza el catálogo');
 if(/estan muy sencill|esta muy sencill|muy sencillo|muy sencilla|demasiado sencillo/.test(n))hits.push('Diseño / presentación');
 if(/no tengo clientes|no hay clientes|mis clientes no|mis clientas no|no vendo ese tipo|no es mi giro|no trabajo esa linea/.test(n))hits.push('Sin clientes para ese catálogo');
 if(/no lo conozco|no conozco ese catalogo|no sabia que existia|no sabia que habia/.test(n))hits.push('No conoce el catálogo');

 // Segunda pasada semántica para comentarios que anteriormente terminaban en categorías genéricas.
 // Solo asigna categorías cuando el texto contiene señales explícitas; nunca inventa una causa.
 if(/no (?:me|le) (?:interesa|interes|necesita)|no (?:lo|la|los|las) (?:ocupo|necesito)|no es necesario|no requiero/.test(n))hits.push('No le interesa / no lo necesita');
 if(/no (?:tengo|hay|cuento con) (?:clientes|clientela)|(?:clientes|clientela) (?:no|nunca) (?:me|le) (?:compran|piden)|solo (?:vendo|manejo|trabajo) (?:calzado|ropa|caballero|dama|bebes|infantil)/.test(n))hits.push('Sin clientes para ese catálogo');
 if(/(?:no|nunca) (?:me|le) (?:piden|solicitan|compran)|(?:rara vez|casi nunca) (?:me|le) (?:piden|solicitan|compran)|no hay demanda|poca demanda/.test(n))hits.push('Baja demanda de sus clientes');
 if(/(?:no|nunca) (?:lo|la|los|las) (?:vendo|vend[eé])|no se vende|no tiene venta|ventas bajas|vende poco|pocas ventas/.test(n))hits.push('Bajo resultado de venta / causa por precisar');
 if(/(?:muy )?(?:caro|costoso)|(?:precio|costo) (?:alto|elevado)|no (?:pueden|podemos) pagar|no alcanza.*(?:precio|pagar)|competencia.*(?:precio|mas barato)|mas barato.*competencia/.test(n))hits.push('Precio / costo');
 if(/(?:faltan|falta|agregar|mas) (?:modelos|productos|estilos|marcas|variedad)|(?:muy|demasiado) (?:poca|poco) (?:variedad|contenido|mercancia)|trae poco|trae muy poco/.test(n))hits.push('Poco contenido o variedad');
 if(/(?:se )?agota(?:n)?|no hay (?:existencia|stock|mercancia|producto)|falta (?:mercancia|producto|existencia)|no llega(?:n)? (?:la|el|los|las)? ?(?:mercancia|producto)|no encuentro (?:el|la|los|las)? ?(?:producto|modelo)/.test(n))hits.push('Disponibilidad de mercancía');
 if(/(?:cambia|cambiar|cambien|actualiza|actualizar) (?:muy )?(?:seguido|rapido|constantemente)|(?:muy )?poca vigencia|dura poco la edicion|edicion corta/.test(n))hits.push('Vigencia y cambios de edición');
 if(/(?:catalogos?|contenido|modelos?) (?:se )?(?:repiten|repetido|igual)|es lo mismo que|viene lo mismo|ya viene en otro catalogo/.test(n))hits.push('Contenido repetido entre catálogos');

 // Nuevas reglas de respuestas frecuentes previamente acumuladas en etiquetas genéricas.
 if(/^(si me gusta|me gusta(?: todo| el catalogo)?|asi estan bien|estan bien|todo bien(?: por el momento| hasta el momento)?|por ahora todo bien|sin queja(?:s)?(?: alguna)?|no tengo queja(?:s)?|me parece bien|me parece perfecto|estan perfectos|asi esta bien|esta bien(?: el tamano y todo)?|nada(?:,? asi esta bien)?)[.! ]*$/.test(n))hits.push('Sin mejora solicitada / satisfecho');
 if(/(?:compro|compra|adquiero|pido) (?:lo que )?(?:me|le|les|nos) (?:pidan|piden|soliciten|solicita)|(?:segun|de acuerdo a) (?:lo que )?(?:me|le|les) (?:pidan|piden|solicitan)|por pedido/.test(n))hits.push('Compra según solicitud del cliente');
 if(/casi no (?:compro|compra|compran|consulto|consulta|consultamos|utilizo|uso)|rara vez (?:compro|compra|compran)|por ahora no (?:lo )?compre|no tengo pedidos|no hay pedidos/.test(n))hits.push('Baja frecuencia de compra / consulta');
 if(/(?:no encuentra|nunca encuentra|no encontr|no hay) (?:en tienda )?(?:lo que|los articulos|los productos|la mercancia)|(?:articulos|productos) que requiere/.test(n))hits.push('Disponibilidad de mercancía');
 if(/(?:no coincide|no son|no es) (?:con )?(?:los intereses|el interes|mi giro|su giro)|no es de mi interes|no le interesa a (?:mis|sus) socios/.test(n))hits.push('Sin clientes para ese catálogo');
 if(/(?:por )?(?:motivos|motivo|problema|dificultad) (?:de|con|por)? ?(?:los )?cambios|se nos dificulta (?:los )?cambios/.test(n))hits.push('Vigencia y cambios de edición');
 if(/(?:mejorar|baja|bajado|mala|poca) (?:la )?calidad|calidad (?:de|del) (?:los )?(?:articulos|productos|calzado)/.test(n))hits.push('Calidad de producto');
 if(/(?:muy|demasiado) pequen|pequeno|reducid[oa]s|no conviene|no conv[ie]ne/.test(n))hits.push('Tamaño del catálogo: más pequeño');
 if(/(?:se parece|parecido|similar|lo mismo) (?:a|que) (?:los|el|otros|demas)|(?:ya )?vienen? (?:los )?modelos? en (?:los )?otros/.test(n))hits.push('Contenido repetido entre catálogos');
 if(/(?:uso|utilizo|veo|consulto) (?:el catalogo )?(?:en|mediante|por) (?:la )?(?:app|aplicacion)|(?:app|aplicacion) es mas facil/.test(n))hits.push('Preferencia digital');
 // Reclasificación reforzada de frases frecuentes que anteriormente quedaban genéricas.
 // Se conserva el texto original; estas reglas solo asignan categorías con evidencia textual.
 if(/^(?:no compro|no compra|ni compro|no compran|nunca compro|nunca compra|no comprar|nada .*no compro|no los compro|no las compro|no adquiere|no adquiero)(?: catalogos?| esos catalogos?| de esos catalogos?| por ahora)?[.! ]*$/.test(n)
   || /no (?:compro|compra|compran) (?:ningun|ninguno|ningunos|los|esos|de esos)? catalogos?/.test(n)) hits.push('No compra catálogos');
 if(/no me gusta|no me gustan|no le gusta|no le gustan|no les gusta|no les gustan|no es de mi agrado|no es de su agrado|no me agrada|no le agrada/.test(n)) hits.push('No es de su preferencia / no le agrada');
 if(/no me sirve|no me sirven|no le sirve|no le sirven|no me es util|no le es util|no se me hace util|no lo considero util|no resulta util|no les resulta util/.test(n)) hits.push('No le resulta útil / no le sirve');
 if(/no me interesa|no le interesa|no les interesa|no es de mi interes|no es necesario|no lo necesito|no los necesito|no la necesito|no requiere|no requiero|no lo ocupo|no los ocupo/.test(n)) hits.push('No le interesa / no lo necesita');
 if(/no funciona(?:n)? (?:para|en)? (?:mi|su)? venta|no le funciona|no me funciona|no funciona mucho|no les funciona|no genera ventas|no genera venta|no ayuda a vender/.test(n)) hits.push('Bajo resultado de venta / causa por precisar');
 if(/(?:no|casi no) (?:lo|los|la|las)? ?(?:utilizo|uso|usamos)|(?:lo|los|la|las) uso poco|(?:lo|los|la|las) utilizo poco|no acostumbro (?:usar|utilizar|comprar)/.test(n)) hits.push('Uso poco / no utiliza el catálogo');
 if(/no tengo (?:a quien|clientes|clientela)|no hay (?:quien|clientes|clientela)|no cuento con clientes|no tengo publico|no es mi giro|no trabajo (?:esa|esta) linea|no vendo (?:esa|este|esa clase de|ese tipo de)/.test(n)) hits.push('Sin clientes para ese catálogo');
 if(/no me lo solicitan|no me lo piden|no se lo solicitan|no se lo piden|no lo solicitan|no lo piden|no tiene demanda|no hay demanda|no es solicitado/.test(n)) hits.push('Baja demanda de sus clientes');
 if(/no hay producto|no hay mercancia|no encuentro (?:el|la|los|las)? ?(?:producto|mercancia|modelo)|no tienen (?:el|la|los|las)? ?(?:producto|mercancia)|no esta disponible|no se encuentra (?:el|la|los|las)? ?(?:producto|mercancia)/.test(n)) hits.push('Disponibilidad de mercancía');
 if(/^(?:nada|ninguna|ninguno|no|sin comentario|no se|nose|no sabria|no sé)[.! ]*$/.test(n)) hits.push('Respuesta insuficiente / requiere precisar');
 const result=[...new Set([...hits,...dims])];
 return result.length?result:['No especificó el motivo'];
}
function categoriasEfectivas(x,key){
 const manual=key==='p2'?'p2clasificacion':key==='p5a'?'p5clasificacion':'';
 const guardada=String(x[manual]||'').trim();
 // Las etiquetas históricas genéricas se recalculan con las reglas mejoradas;
 // las clasificaciones específicas previamente validadas se respetan.
 const generic=new Set(['no especifico el motivo','no especifico / por aclarar','no especifico el motivo / por aclarar','por aclarar','otro','otra','otros','no especifico','no especificada','sin especificar','pendiente de aclarar','requiere aclaracion','respuesta insuficiente / requiere precisar','no sabe','no responde']);
 if(guardada && !generic.has(normalizar(guardada))) return [guardada];
 return categoryNames(x[key]);
}
function classify(a,key){const m=new Map();a.forEach(x=>categoriasEfectivas(x,key).forEach(c=>m.set(c,(m.get(c)||0)+1)));return [...m].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'es'))}
function catalogoAgrupado(t){return catalogosDeRespuesta(t).join(' + ')||'Sin catálogo identificado'}
const PREGUNTAS=[['p2','¿Qué mejorarían / no les gusta?','p1'],['p5a','¿Por qué no lo compran?','p3']];
function observaciones(a){const out=[];a.forEach((x,i)=>PREGUNTAS.forEach(([key,pregunta,cat])=>{if(!String(x[key]||'').trim())return;out.push({id:x.id||i+1,pregunta,key,fecha:x.fecha||'',tienda:x.tienda||'Sin tienda',catalogo:catalogoAgrupado(x[cat]),catalogos:catalogosDeRespuesta(x[cat]),original:x['__'+cat+'Original']||x[cat]||'',comentario:x[key],categorias:categoriasEfectivas(x,key),nomina:x.nomina||'',socio:x.numeroSocio||''})}));return out}
function agrupados(obs){const m=new Map();obs.forEach(o=>o.categorias.forEach(c=>(o.catalogos?.length?o.catalogos:[o.catalogo]).forEach(cat=>{const k=JSON.stringify([o.pregunta,c,cat,o.tienda]);m.set(k,(m.get(k)||0)+1)})));return [...m].map(([k,n])=>[...JSON.parse(k),n]).sort((a,b)=>a[0].localeCompare(b[0],'es')||a[1].localeCompare(b[1],'es')||b[4]-a[4]||a[2].localeCompare(b[2],'es')||a[3].localeCompare(b[3],'es'))}
function filtroTexto(){const s=selectedStores();return (s.length?s.join(', '):'Todas las tiendas')+' | '+($('fechaDesde').value||'Inicio')+' a '+($('fechaHasta').value||'Todo el histórico')}
function tablaClasificacion(rows){return '<div class="tablewrap"><table><thead><tr><th>Pregunta</th><th>Tipo de comentario</th><th>Catálogo / conjunto</th><th>Tienda</th><th>Cantidad</th></tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(v=>'<td style="white-space:normal;min-width:95px">'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'}
function renderClasificacion(){const obs=observaciones(DATA),rows=agrupados(obs);const el=$('clasificacionCompleta');el.innerHTML='<h3>Detalle de clasificación por pregunta, catálogo y tienda</h3><p class="note">'+DATA.length+' entrevistas · '+obs.length+' respuestas analizadas · '+obs.reduce((s,o)=>s+o.categorias.length,0)+' menciones de categorías. Una observación puede tener varias causas. Los nombres se unifican; respuestas con varios catálogos cuentan una vez en cada catálogo mencionado. La clasificación es orientativa; los motivos vagos requieren aclaración.</p><div class="grid"><label>Pregunta<select id="clasPregunta"><option value="">Ambas preguntas</option>'+PREGUNTAS.map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join('')+'</select></label><label>Tipo de comentario<select id="clasTipo"><option value="">Todos los tipos</option>'+[...new Set(rows.map(x=>x[1]))].sort((a,b)=>a.localeCompare(b,'es')).map(x=>'<option>'+esc(x)+'</option>').join('')+'</select></label></div><div id="clasTabla"></div><p class="note">Este detalle y el PDF respetan los filtros de tienda y fechas del dashboard. Excel incluye ambas preguntas en hojas separadas.</p>';
 const paint=()=>{const key=$('clasPregunta').value,c=$('clasTipo').value,question=PREGUNTAS.find(x=>x[0]===key)?.[1];$('clasTabla').innerHTML=tablaClasificacion(rows.filter(r=>(!question||r[0]===question)&&(!c||r[1]===c)))};paint();$('clasPregunta').onchange=paint;$('clasTipo').onchange=paint;
}
function detalleClasificacion(id,value){const key=id==='chartMejoras'?'p2':'p5a',obs=observaciones(DATA).filter(o=>o.key===key&&o.categorias.includes(value)),g=GUIA[value]||GUIA['No especificó el motivo'];const el=$('drill_'+id);el.classList.remove('hidden','expanded');el.innerHTML='<div class="drill-controls"><button type="button" class="drill-expand secondary">Ampliar</button><button type="button" class="drill-hide secondary">Ocultar</button></div><h4>'+esc(value)+' · '+obs.length+' observaciones</h4><div class="help"><b>Preguntas para precisar:</b> '+esc(g.questions)+'<br><b>Seguimiento sugerido:</b> '+esc(g.action)+'</div><div class="drill-body">'+tablaClasificacion(agrupados(obs).filter(r=>r[1]===value))+'<details><summary style="cursor:pointer;padding:12px">Ver los '+obs.length+' comentarios originales</summary>'+obs.map(o=>'<div class="comment"><small>'+esc(o.tienda)+' · '+esc(o.fecha)+'</small><div><b>Catálogo:</b> '+esc(o.catalogo)+'</div><div>'+esc(o.comentario)+'</div></div>').join('')+'</details></div>';el.querySelector('.drill-expand').onclick=()=>toggleDrill(id);el.querySelector('.drill-hide').onclick=()=>hideDrill(id)}
function sheet(name,headers,data){const cell=(v,h=false)=>'<Cell'+(h?' ss:StyleID="head"':' ss:StyleID="body"')+'><Data ss:Type="'+(typeof v==='number'?'Number':'String')+'">'+xmlEsc(v)+'</Data></Cell>';return '<Worksheet ss:Name="'+xmlEsc(name)+'"><Table>'+headers.map((h,i)=>'<Column ss:Width="'+(i===0?180:i===1?215:i===2?190:120)+'"/>').join('')+'<Row>'+headers.map(h=>cell(h,true)).join('')+'</Row>'+data.map(row=>'<Row>'+row.map(v=>cell(v)).join('')+'</Row>').join('')+'</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane><ActivePane>2</ActivePane></WorksheetOptions></Worksheet>'}
function crearExcel(a){const obs=observaciones(a),group=agrupados(obs),summary=[];for(const [key,pregunta] of PREGUNTAS){const n=obs.filter(o=>o.key===key).length;classify(a,key).forEach(([c,v])=>summary.push([pregunta,c,v,n,n?Math.round(v/n*1000)/10+'%':'0%']))}const heads=['Pregunta','Tipo de comentario','Catálogo / conjunto','Tienda','Cantidad'];const guides=summary.map(([q,c,n])=>[q,c,n,GUIA[c]?.questions||'',GUIA[c]?.action||'']);const raw=a.map(x=>[x.fecha,x.tienda,x.nomina,x.numeroSocio,x.area,x.p1,x.frecuencia,x.p2,x.p3,x.p4,x.p5a,x.p5b,x.p5br,x.p6,x.p6d,x.creado]);return '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="head"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#17365D" ss:Pattern="Solid"/><Alignment ss:WrapText="1"/></Style><Style ss:ID="body"><Alignment ss:Vertical="Top" ss:WrapText="1"/></Style></Styles>'+sheet('Panorama general',['Pregunta / indicador','Respuesta','Cantidad','Respuestas no vacías','%'],Object.entries(panoramaEjecutivo(a)).flatMap(([key,g])=>g.datos.map(([label,n])=>[({comprados:'1. Catálogo habitual',frecuencia:'1. Frecuencia',noCompra:'3. Catálogo no comprado',conoce:'4. Conocimiento',mostrado:'5B. Se mostró',reaccion:'5B. Reacción inicial',potencial:'6. Utilidad para vender',explicacion:'6. Explicación / mejora',areas:'Área'})[key],label,n,g.total,g.total?(n/g.total*100).toFixed(1)+'%':'0.0%'])))+sheet('Categoría y catálogo',['Pregunta','Categoría','Catálogo / conjunto','Cantidad','Total de categoría','% dentro de categoría'],filasDesgloseCatalogo(a))+sheet('Resumen clasificación',['Pregunta','Tipo de comentario','Menciones','Observaciones respondidas','% de observaciones'],summary)+sheet('Mejoras por catálogo',heads,group.filter(r=>r[0]===PREGUNTAS[0][1]))+sheet('No compra por catálogo',heads,group.filter(r=>r[0]===PREGUNTAS[1][1]))+sheet('Comentarios clasificados',['Pregunta','Clasificación principal','Clasificación secundaria','Catálogo agrupado','Catálogo original','Tienda','Fecha','Nómina','Número socio','Comentario original'],obs.map(o=>[o.pregunta,o.categorias[0],o.categorias.slice(1).join('; '),o.catalogo,o.original,o.tienda,o.fecha,o.nomina,o.socio,o.comentario]))+sheet('Guía de seguimiento',['Pregunta','Tipo','Menciones','Preguntas para precisar','Acción sugerida'],guides)+sheet('Detalle',['Fecha','Tienda','Nómina','Número socio','Área','Catálogo habitual','Frecuencia','Qué mejoraría/no gusta','Catálogo no comprado','¿Lo conoce?','Motivo no compra','¿Se mostró?','Reacción inicial','¿Le serviría?','Explicación / mejora','Creado'],raw)+sheet('Criterios',['Concepto','Definición'],[['Filtros',filtroTexto()],['Unidad','Una observación por respuesta no vacía en cada pregunta; no representa socios únicos.'],['Varias causas','Una observación puede contar en varias categorías; el total de menciones y los porcentajes pueden superar las observaciones y el 100%.'],['Catálogo relacionado','p2 usa catálogo habitual p1. p5a usa catálogo no comprado p3.'],['Catálogos conjuntos','Se separan en catálogos individuales; cada respuesta cuenta una vez por catálogo mencionado.'],['Clasificación','Orientativa. Las respuestas ambiguas requieren aclaración. Se conserva el comentario original.']])+'</Workbook>'}
async function descargarExcel(){try{const a=await detail();if(!a.length)return alert('No hay datos en el filtro seleccionado.');download('\ufeff'+crearExcel(a),'Resultados_Encuesta_V16_Clasificacion.xls','application/vnd.ms-excel')}catch(e){alert('No se pudo generar el Excel: '+e.message)}}
// PDF sin servicios externos: texto WinAnsi, paginación y longitudes en bytes.
function pdfBytes(lines){const pages=[];let current=[];for(const text of lines){const words=String(text).split(/\s+/);let line='';for(const word of words){if((line+' '+word).length>104){current.push(line);line=word}else line+=(line?' ':'')+word;if(current.length>=46){pages.push(current);current=[]}}current.push(line);if(current.length>=46){pages.push(current);current=[]}}if(current.length)pages.push(current);if(!pages.length)pages.push(['Sin información.']);
 const win={'€':128,'‚':130,'ƒ':131,'„':132,'…':133,'†':134,'‡':135,'ˆ':136,'‰':137,'Š':138,'‹':139,'Œ':140,'Ž':142,'‘':145,'’':146,'“':147,'”':148,'•':149,'–':150,'—':151,'˜':152,'™':153,'š':154,'›':155,'œ':156,'ž':158,'Ÿ':159};
 const enc=s=>Uint8Array.from(Array.from(s,c=>win[c]??(c.charCodeAt(0)<=255?c.charCodeAt(0):63)));const lit=s=>String(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\r\n]/g,' ');const objs=[];const kids=pages.map((_,i)=>(4+i*2)+' 0 R').join(' ');objs[1]='<< /Type /Catalog /Pages 2 0 R >>';objs[2]='<< /Type /Pages /Kids ['+kids+'] /Count '+pages.length+' >>';objs[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';pages.forEach((ls,i)=>{const n=4+i*2;objs[n]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents '+(n+1)+' 0 R >>';const s='BT /F1 13 Tf 40 803 Td (Detección de Necesidades - Socios) Tj /F1 9 Tf 0 -23 Td 15 TL '+ls.map(t=>'('+lit(t)+') Tj T*').join('\n')+' ET\nBT /F1 8 Tf 40 25 Td (Guía de seguimiento | Página '+(i+1)+' de '+pages.length+') Tj ET';objs[n+1]='<< /Length '+enc(s).length+' >>\nstream\n'+s+'\nendstream'});let out='%PDF-1.4\n',offsets=[0];for(let i=1;i<objs.length;i++){offsets[i]=enc(out).length;out+=i+' 0 obj\n'+objs[i]+'\nendobj\n'}const start=enc(out).length;out+='xref\n0 '+objs.length+'\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+objs.length+' /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF';return enc(out)}
function guiaLines(a){const obs=observaciones(a),lines=['GUÍA DE COMENTARIOS, PREGUNTAS Y ACCIONES',filtroTexto(),'Observaciones: '+obs.length+' | Menciones de categorías: '+obs.reduce((s,o)=>s+o.categorias.length,0),'Una respuesta puede tener varias causas. Clasificación orientativa; no representa socios únicos.',''];for(const [key,pregunta] of PREGUNTAS){lines.push(pregunta.toUpperCase());const counts=classify(a,key);if(!counts.length)lines.push('Sin respuestas para esta pregunta en el filtro seleccionado.');for(const [c,n] of counts){const g=GUIA[c]||GUIA['No especificó el motivo'];lines.push(c+' | '+n+' observaciones');if(g.example)lines.push('Ejemplos: '+g.example);lines.push('Preguntar: '+g.questions,'Definir: '+g.action,'Catálogo / conjunto - tienda - cantidad:');agrupados(obs.filter(o=>o.key===key&&o.categorias.includes(c))).filter(r=>r[1]===c).forEach(r=>lines.push(r[2]+' | '+r[3]+' | '+r[4]));lines.push('')}}lines.push('REGISTRO DE SEGUIMIENTO','Catálogo y tienda | Tipo de comentario | Hallazgo confirmado | Acción | Responsable | Fecha compromiso | Resultado / respuesta al socio','Regla: precisar el motivo y vincularlo al catálogo y la tienda. Si aún se desconoce la causa, registrar Pendiente de aclarar.','Los catálogos mencionados juntos se conservan como conjunto; no se distribuye la observación entre ellos.');return lines}
async function descargarGuiaPDF(){try{const a=await detail();if(!observaciones(a).length)return alert('No hay comentarios para generar la guía en el filtro seleccionado.');download(pdfBytes(guiaLines(a)),'Guia_Seguimiento_Socios_Filtrada.pdf','application/pdf')}catch(e){alert('No se pudo generar el PDF: '+e.message)}}
