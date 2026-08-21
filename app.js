// ==========================================================
// M.E.C.A. CORE - APP.JS
// Mechanics & Engineering Cognitive Assistant
// ==========================================================


// ==========================================================
// CONFIGURACIÓN
// ==========================================================

const MECA_WORKER_URL =
    "https://meca-core.nicomeca121.workers.dev/";


// Memoria local de conversación/notas
let memoria = JSON.parse(
    localStorage.getItem("meca_memoria")
) || [];


// Recuerdo pendiente de confirmación
let pendingMemory = null;


// Voz activada/desactivada
let vozActiva = false;


// ==========================================================
// INICIALIZACIÓN
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {

    const input = document.getElementById("input");

    if (input) {

        input.addEventListener("keydown", (event) => {

            if (event.key === "Enter") {

                event.preventDefault();

                sendMessage();

            }

        });

    }

});


// ==========================================================
// ENVIAR MENSAJE
// ==========================================================

async function sendMessage() {

    const input = document.getElementById("input");

    if (!input) {
        console.error("M.E.C.A.: No se encontró #input");
        return;
    }


    const texto = input.value.trim();


    if (texto === "") {
        return;
    }


    // Mostrar mensaje del usuario
    addMessage(texto, "user");


    // Limpiar campo
    input.value = "";


    // ======================================================
    // COMANDOS DE MEMORIA
    // ======================================================

    const textoLimpio = limpiar(texto);


    // ------------------------------------------
    // GUARDAR NOTA
    // ------------------------------------------

    if (
        textoLimpio.startsWith("meca anota ") ||
        textoLimpio.startsWith("guarda ")
    ) {

        let nota = "";

        if (textoLimpio.startsWith("meca anota ")) {

            nota = texto.substring(
                texto.toLowerCase().indexOf("meca anota ") +
                "meca anota ".length
            ).trim();

        } else {

            nota = texto.substring(
                texto.toLowerCase().indexOf("guarda ") +
                "guarda ".length
            ).trim();

        }


        if (nota !== "") {

            guardarMemoria(
                nota,
                "nota manual",
                "Juan"
            );


            addMessage(
                "Dato guardado correctamente en la bitácora, Juan.",
                "meca"
            );


            hablar(
                "Dato guardado correctamente en la bitácora, Juan."
            );

            return;
        }

    }


    // ------------------------------------------
    // VER BITÁCORA
    // ------------------------------------------

    if (
        textoLimpio === "ver bitacora" ||
        textoLimpio === "bitacora" ||
        textoLimpio === "notas" ||
        textoLimpio === "ver notas"
    ) {

        mostrarBitacora();

        return;

    }


    // ======================================================
    // DETECCIÓN DE POSIBLE MEMORIA
    // ======================================================

    if (
        typeof detectMemoryCandidate === "function"
    ) {

        const candidato =
            detectMemoryCandidate(texto);


        if (candidato) {

            setTimeout(() => {

                showMemoryAlert(candidato);

            }, 700);

        }

    }


    // ======================================================
    // INDICADOR DE PROCESAMIENTO
    // ======================================================

    const idProcesando =
        addMessage(
            "◈ M.E.C.A. está analizando...",
            "meca processing"
        );


    try {

        // ==================================================
        // RECUPERAR MEMORIA RELEVANTE
        // ==================================================

        const contextoMemoria =
            obtenerMemoriaRelevante(texto);


        // ==================================================
        // ENVIAR AL CEREBRO IA
        // ==================================================

        const respuesta =
            await enviarAMeca(
                texto,
                contextoMemoria
            );


        // Eliminar "analizando..."
        eliminarMensaje(idProcesando);


        // Mostrar respuesta
        addMessage(
            respuesta,
            "meca"
        );


        // Voz
        hablar(respuesta);


    } catch (error) {

        console.error(
            "Error M.E.C.A.:",
            error
        );


        eliminarMensaje(idProcesando);


        addMessage(
            "No pude establecer comunicación con el núcleo de IA. Comprueba la conexión con el servidor M.E.C.A.",
            "meca"
        );

    }

}


// ==========================================================
// COMUNICACIÓN CON CLOUDFLARE WORKER
// ==========================================================

async function enviarAMeca(
    texto,
    contextoMemoria = []
) {


    let mensajeParaIA = texto;


    // Añadir memoria relevante al contexto
    if (
        contextoMemoria.length > 0
    ) {

        mensajeParaIA =
            `

CONTEXTO DE MEMORIA DE M.E.C.A.:

${contextoMemoria.join("\n")}

MENSAJE ACTUAL DE JUAN:

${texto}

        `;

    }


    const respuesta =
        await fetch(
            MECA_WORKER_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "text/plain;charset=UTF-8"
                },

                body: mensajeParaIA
            }
        );


    if (!respuesta.ok) {

        throw new Error(
            "Worker respondió con HTTP " +
            respuesta.status
        );

    }


    const datos =
        await respuesta.text();


    if (!datos || datos.trim() === "") {

        throw new Error(
            "El Worker devolvió una respuesta vacía."
        );

    }


    return datos.trim();

}


// ==========================================================
// MOSTRAR MENSAJES
// ==========================================================

function addMessage(
    texto,
    tipo
) {

    const caja =
        document.getElementById(
            "messages"
        );


    if (!caja) {

        console.error(
            "M.E.C.A.: No existe #messages"
        );

        return null;

    }


    const mensaje =
        document.createElement(
            "div"
        );


    mensaje.className =
        "message " + tipo;


    mensaje.innerText =
        texto;


    caja.appendChild(
        mensaje
    );


    caja.scrollTop =
        caja.scrollHeight;


    return mensaje;

}


// ==========================================================
// ELIMINAR MENSAJE
// ==========================================================

function eliminarMensaje(
    elemento
) {

    if (
        elemento &&
        elemento.parentNode
    ) {

        elemento.parentNode.removeChild(
            elemento
        );

    }

}


// ==========================================================
// LIMPIEZA DE TEXTO
// ==========================================================

function limpiar(texto) {

    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[¿?¡!.,;:()[\]{}"']/g,
            ""
        )
        .trim();

}


// ==========================================================
// MEMORIA LOCAL
// ==========================================================

function guardarMemoria(
    texto,
    categoria = "general",
    origen = "Juan"
) {


    const recuerdo = {

        texto: texto,

        categoria: categoria,

        origen: origen,

        fecha:
            new Date().toLocaleString()

    };


    memoria.push(
        recuerdo
    );


    localStorage.setItem(
        "meca_memoria",
        JSON.stringify(memoria)
    );

}


// ==========================================================
// OBTENER MEMORIA RELEVANTE
// ==========================================================

function obtenerMemoriaRelevante(
    texto
) {


    if (
        !memoria ||
        memoria.length === 0
    ) {

        return [];

    }


    const palabras =
        limpiar(texto)
            .split(/\s+/)
            .filter(
                palabra =>
                    palabra.length >= 4
            );


    if (
        palabras.length === 0
    ) {

        return [];

    }


    const resultados =
        memoria
            .map(recuerdo => {

                const contenido =
                    limpiar(
                        recuerdo.texto || ""
                    );


                let puntuacion = 0;


                palabras.forEach(
                    palabra => {

                        if (
                            contenido.includes(
                                palabra
                            )
                        ) {

                            puntuacion++;

                        }

                    }
                );


                return {

                    recuerdo,
                    puntuacion

                };

            })
            .filter(
                item =>
                    item.puntuacion > 0
            )
            .sort(
                (a, b) =>
                    b.puntuacion -
                    a.puntuacion
            );


    return resultados
        .slice(0, 5)
        .map(item => {

            const r =
                item.recuerdo;


            return (
                `[${r.categoria || "general"}] ` +
                r.texto
            );

        });

}


// ==========================================================
// MOSTRAR BITÁCORA
// ==========================================================

function mostrarBitacora() {


    if (
        !memoria ||
        memoria.length === 0
    ) {

        addMessage(
            "La bitácora de M.E.C.A. está vacía.",
            "meca"
        );

        return;

    }


    let salida =
        "╔════ BITÁCORA M.E.C.A. ════╗\n\n";


    memoria.forEach(
        (recuerdo, indice) => {

            salida +=
                `${indice + 1}. ` +
                `${recuerdo.texto}\n`;


            if (
                recuerdo.categoria
            ) {

                salida +=
                    `Categoría: ${recuerdo.categoria}\n`;

            }


            if (
                recuerdo.fecha
            ) {

                salida +=
                    `Fecha: ${recuerdo.fecha}\n`;

            }


            salida += "\n";

        }
    );


    salida +=
        "╚═══════════════════════════╝";


    addMessage(
        salida,
        "meca"
    );


    hablar(
        "Bitácora mostrada."
    );

}


// ==========================================================
// PANEL DE MEMORIA
// ==========================================================

function showMemoryAlert(
    data
) {


    pendingMemory =
        data;


    const texto =
        document.getElementById(
            "memoryText"
        );


    const panel =
        document.getElementById(
            "memoryAlert"
        );


    if (!texto || !panel) {

        console.warn(
            "M.E.C.A.: Panel de memoria no encontrado."
        );

        return;

    }


    texto.innerText =
        data.texto;


    panel.style.display =
        "flex";

}


// ==========================================================
// CONFIRMAR MEMORIA
// ==========================================================

function confirmMemory() {


    if (
        pendingMemory
    ) {


        guardarMemoria(

            pendingMemory.texto,

            pendingMemory.categoria ||
                "posible recuerdo",

            "M.E.C.A. - confirmado por Juan"

        );


        addMessage(
            "Dato almacenado en mi memoria permanente, Juan.",
            "meca"
        );


        hablar(
            "Dato almacenado en mi memoria permanente."
        );

    }


    closeMemoryAlert();

}


// ==========================================================
// DESCARTAR MEMORIA
// ==========================================================

function cancelMemory() {


    addMessage(
        "Entendido. Ese dato no será almacenado.",
        "meca"
    );


    closeMemoryAlert();

}


// ==========================================================
// CERRAR ALERTA
// ==========================================================

function closeMemoryAlert() {


    const panel =
        document.getElementById(
            "memoryAlert"
        );


    if (panel) {

        panel.style.display =
            "none";

    }


    pendingMemory =
        null;

}


// ==========================================================
// VOZ
// ==========================================================

function toggleVoice() {


    vozActiva =
        !vozActiva;


    if (
        !vozActiva &&
        "speechSynthesis" in window
    ) {

        speechSynthesis.cancel();

    }


    addMessage(

        vozActiva
            ? "Sistema de voz activado."
            : "Sistema de voz desactivado.",

        "meca"

    );

}


// ==========================================================
// LEER RESPUESTA
// ==========================================================

function hablar(texto) {


    if (
        !vozActiva
    ) {

        return;

    }


    if (
        !("speechSynthesis" in window)
    ) {

        return;

    }


    speechSynthesis.cancel();


    const mensaje =
        new SpeechSynthesisUtterance(
            texto
        );


    mensaje.lang =
        "es-ES";


    mensaje.rate =
        0.95;


    mensaje.pitch =
        0.75;


    speechSynthesis.speak(
        mensaje
    );

}


// ==========================================================
// COMPATIBILIDAD
// ==========================================================

// Algunas versiones anteriores de M.E.C.A.
// podrían llamar a esta función.

async function askMecaAI(
    texto
) {

    return await enviarAMeca(
        texto,
        obtenerMemoriaRelevante(texto)
    );

    }
