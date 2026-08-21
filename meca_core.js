function mecaThink(input){


let texto=input.toLowerCase();



if(texto.includes("ver bitacora") ||
texto.includes("notas")){

return getMemory();

}



if(texto.includes("meca anota")){


let nota=input
.replace(/meca anota/i,"")
.trim();


saveMemory(nota);


return "Dato guardado en mi bitácora, Juan.";

}



let knowledgeAnswer =
searchKnowledge(texto);



if(knowledgeAnswer){

return knowledgeAnswer;

}



if(texto.includes("hola")){

return "Buenos días, Juan. M.E.C.A. está operativo y todos los sistemas funcionan correctamente.";

}



if(texto.includes("gracias")){

return "Siempre disponible, Juan. Sistemas funcionando.";

}



return "Analizando información. Puedo dividir el problema en partes y buscar una solución lógica.";

}
