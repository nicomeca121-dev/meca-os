const knowledge = {


lanzatelaranas:`

Proyecto Lanzatelarañas detectado.

El concepto combina:
- química de polímeros
- dinámica de fluidos
- presión y expansión controlada
- mecanismos de seguridad redundantes

El diseño busca una salida rápida, solidificación posterior y control mediante un sistema mecánico.`,



mecanismo:`

El mecanismo de disparo está planteado en tres etapas:

1. Movimiento inicial del brazo para generar una condición de activación.
2. Botón físico que habilita la válvula.
3. Movimiento final que libera el sello de seguridad.

La ventaja principal es evitar disparos accidentales.`,



dedos:`

El selector de dedos funciona como una matriz de entradas.

La combinación de meñique y anular habilita un tercer control con el dedo corazón para cambiar la configuración de salida.`


};


function searchKnowledge(text){

    let t=text.toLowerCase();


    if(t.includes("telarana") ||
       t.includes("lanzatelaranas")){

        return knowledge.lanzatelaranas;

    }


    if(t.includes("mecanismo") ||
       t.includes("disparo")){

        return knowledge.mecanismo;

    }


    if(t.includes("dedo") ||
       t.includes("selector")){

        return knowledge.dedos;

    }


    return null;

}
