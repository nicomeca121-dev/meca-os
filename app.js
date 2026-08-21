let memoria = JSON.parse(localStorage.getItem("meca_memoria")) || [];


function sendMessage(){

const input=document.getElementById("input");

const texto=input.value.trim();

if(texto==="") return;


addMessage(texto,"user");


guardarMemoria("Juan: "+texto);


input.value="";


setTimeout(()=>{

let respuesta=mecaAnaliza(texto);

addMessage(respuesta,"meca");

guardarMemoria("M.E.C.A.: "+respuesta);


},600);


}



function addMessage(texto,tipo){

const caja=document.getElementById("messages");

let mensaje=document.createElement("div");

mensaje.className="message "+tipo;

mensaje.innerText=texto;

caja.appendChild(mensaje);

caja.scrollTop=caja.scrollHeight;

}




function limpiar(texto){

return texto
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g,"");

}




function guardarMemoria(texto){

memoria.push({

texto:texto,

fecha:new Date().toLocaleString()

});


localStorage.setItem(

"meca_memoria",

JSON.stringify(memoria)

);

}




function mecaAnaliza(texto){

let t=limpiar(texto);



if(t.includes("hola") || t.includes("buenas")){

return "Buenos días, Juan. M.E.C.A. se encuentra operativo. Núcleo cognitivo preparado.";

}



if(t.includes("quien eres")){

return "Soy M.E.C.A. (Mechanics & Engineering Cognitive Assistant). Un asistente diseñado para ayudarte con ingeniería, ciencia y proyectos.";

}



if(t.includes("memoria") || t.includes("recuerdas")){

return "Tengo acceso a mi memoria local de esta sesión. Puedo almacenar datos mediante mi módulo de bitácora.";

}



if(t.includes("timido") || t.includes("verguenza") || t.includes("miedo")){

return "Juan, analizando la situación: tu cerebro está realizando demasiadas simulaciones antes de actuar. Prueba el Protocolo de los 3 segundos: 3, 2, 1 y acción.";

}



if(t.includes("lanzatelaranas") || t.includes("telarana")){

return "Proyecto Lanzatelarañas detectado. Analizando: polímeros, expansión controlada, adherencia, mecánica de disparo y seguridad redundante.";

}



if(t.includes("fisica") || t.includes("ingenieria") || t.includes("quimica")){

return "Modo ingeniería activado. Preparando análisis científico.";

}



return generarRespuestaGeneral(t);


}




function generarRespuestaGeneral(t){

let respuestas=[

"Interesante, Juan. Estoy analizando los datos desde una perspectiva lógica y científica.",

"Información recibida. Mi sistema está evaluando posibilidades.",

"Entendido, Juan. Podemos dividir el problema en partes más pequeñas y resolverlo paso a paso.",

"Procesando contexto. La combinación de creatividad e ingeniería suele producir soluciones innovadoras."

];


return respuestas[Math.floor(Math.random()*respuestas.length)];

}
