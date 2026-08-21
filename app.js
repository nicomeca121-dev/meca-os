function sendMessage(){

let input=document.getElementById("input");

let text=input.value.trim();

if(text==="") return;


addMessage(text,"user");

input.value="";


setTimeout(()=>{

let response=
"Procesando información, Juan. Mi núcleo de análisis está activo. Actualmente soy el módulo HUD de M.E.C.A.; el siguiente paso será conectar el motor cognitivo.";

addMessage(response,"meca");


},700);


}



function addMessage(text,type){

let box=document.getElementById("messages");

let div=document.createElement("div");

div.className="message "+type;

div.innerText=text;

box.appendChild(div);


box.scrollTop=box.scrollHeight;

}
