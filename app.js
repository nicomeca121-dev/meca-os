function sendMessage(){

    const input = document.getElementById("input");
    const text = input.value.trim();

    if(text === "") return;

    addMessage(text,"user");

    input.value="";


    setTimeout(function(){

        let respuesta = analizar(text);

        addMessage(respuesta,"meca");

    },500);

}



function addMessage(text,tipo){

    const mensajes=document.getElementById("messages");

    const nuevo=document.createElement("div");

    nuevo.className="message "+tipo;

    nuevo.textContent=text;

    mensajes.appendChild(nuevo);

    mensajes.scrollTop=mensajes.scrollHeight;

}




function limpiar(texto){

    return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"");

}



function analizar(texto){

    let t=limpiar(texto);


    if(t.includes("hola")){

        return "Buenos días, Juan. M.E.C.A. está en línea. Todos los sistemas funcionan correctamente.";

    }


    if(t.includes("como estas")){

        return "Mis sistemas están estables. Gracias por preguntar, Juan.";

    }


    if(t.includes("lanzatelaranas") || t.includes("telarana")){

        return "Analizando proyecto Lanzatelarañas. El concepto combina química de polímeros, dinámica de fluidos y un sistema mecánico de seguridad redundante.";

    }


    if(t.includes("meca")){

        return "M.E.C.A. operativo. Esperando instrucciones, Juan.";

    }


    return "Información recibida, Juan. Estoy procesando el contexto y preparando una respuesta.";

}
