let mecaMemory = JSON.parse(localStorage.getItem("meca_memory")) || [];


function saveMemory(data){

    mecaMemory.push({
        texto:data,
        fecha:new Date().toLocaleString()
    });

    localStorage.setItem(
        "meca_memory",
        JSON.stringify(mecaMemory)
    );
}



function getMemory(){

    if(mecaMemory.length === 0){

        return "La bitácora está vacía.";

    }


    let salida="BITÁCORA M.E.C.A.\n\n";


    mecaMemory.forEach((item,index)=>{

        salida += 
        (index+1)+
        ". "+
        item.texto+
        "\nFecha: "+
        item.fecha+
        "\n\n";

    });


    return salida;

}
