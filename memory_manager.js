// ======================================
// M.E.C.A. MEMORY MANAGER v1.0
// Sistema de memoria persistente
// ======================================


let mecaDatabase = JSON.parse(
    localStorage.getItem("MECA_DATABASE")
) || [];



// Guardar recuerdo

function saveMemoryAdvanced(texto, categoria="general", origen="usuario"){


    let recuerdo = {

        id: Date.now(),

        texto:texto,

        categoria:categoria,

        origen:origen,

        fecha:new Date().toLocaleString()

    };


    mecaDatabase.push(recuerdo);


    localStorage.setItem(
        "MECA_DATABASE",
        JSON.stringify(mecaDatabase)
    );


}




// Obtener todos los recuerdos

function getAllMemories(){


    if(mecaDatabase.length===0){

        return "La bitácora de M.E.C.A. está vacía.";

    }


    let respuesta=
    "╔════ BITÁCORA M.E.C.A. ════╗\n\n";


    mecaDatabase.forEach((dato,index)=>{


        respuesta+=
        (index+1)+
        ". "+
        dato.texto+
        "\nCategoría: "+
        dato.categoria+
        "\nFecha: "+
        dato.fecha+
        "\n\n";


    });


    respuesta+="╚════════════════════╝";


    return respuesta;

}





// Detectar si algo parece importante

function detectMemoryCandidate(texto){


    let t=texto.toLowerCase();



    let palabrasImportantes=[

        "mi proyecto",
        "estoy haciendo",
        "estoy creando",
        "mi idea",
        "mi objetivo",
        "me gusta",
        "quiero aprender",
        "estoy diseñando"

    ];



    let puntuacion=0;



    palabrasImportantes.forEach(p=>{

        if(t.includes(p)){

            puntuacion++;

        }

    });



    if(puntuacion>0){


        return {

            texto:texto,

            categoria:"posible recuerdo"


        };


    }


    return null;


                                }
