/* =========================================================
   H.E.C.T.O.R. OS
   Conversational Core
   ========================================================= */

const WORKER_URL =
    "https://meca-core.nicomeca121.workers.dev";

const CHAT_HISTORY_KEY =
    "hector_conversation";

const BITACORA_KEY =
    "meca_bitacora";

let procesando = false;
let vozActiva = false;


/* =========================================================
   UTILIDADES
   ========================================================= */

function input() {
    return document.getElementById("input");
}


function messages() {
    return document.getElementById("messages");
}


function normalizar(texto) {

    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}


/* =========================================================
   CHAT VISUAL
   ========================================================= */

function addMessage(texto, tipo = "meca") {

    const caja = messages();

    if (!caja) return;


    const mensaje =
        document.createElement("div");

    mensaje.className =
        "message " + tipo;


    if (tipo === "meca") {

        const nombre =
            document.createElement("strong");

        nombre.textContent =
            "H.E.C.T.O.R.";

        const contenido =
            document.createElement("span");

        contenido.textContent =
            texto;

        mensaje.appendChild(nombre);
        mensaje.appendChild(contenido);

    } else {

        mensaje.textContent =
            texto;
    }


    caja.appendChild(mensaje);

    caja.scrollTop =
        caja.scrollHeight;
}


/* =========================================================
   HISTORIAL CONVERSACIONAL
   ========================================================= */

function obtenerHistorial() {

    try {

        const datos =
            localStorage.getItem(
                CHAT_HISTORY_KEY
            );

        if (!datos) return [];

        const historial =
            JSON.parse(datos);

        return Array.isArray(historial)
            ? historial
            : [];

    } catch {

        return [];
    }
}


function guardarHistorial(historial) {

    /*
     * Conservamos los últimos 16 mensajes.
     * Esto evita que el navegador acumule
     * una cantidad gigantesca de información.
     */

    const limitado =
        historial.slice(-16);

    localStorage.setItem(
        CHAT_HISTORY_KEY,
        JSON.stringify(limitado)
    );
}


function registrarConversacion(
    role,
    text
) {

    const historial =
        obtenerHistorial();

    historial.push({

        role: role,

        text: text,

        timestamp:
            Date.now()

    });

    guardarHistorial(
        historial
    );
}


/* =========================================================
   RESTAURAR CHAT
   ========================================================= */

function restaurarConversacion() {

    const historial =
        obtenerHistorial();


    if (
        historial.length === 0
    ) {
        return;
    }


    const caja =
        messages();

    if (!caja) return;


    /*
     * Dejamos el mensaje inicial
     * del sistema y añadimos el historial.
     */

    historial.forEach(
        mensaje => {

            if (
                mensaje.role === "user"
            ) {

                addMessage(
                    mensaje.text,
                    "usuario"
                );

            } else {

                addMessage(
                    mensaje.text,
                    "meca"
                );
            }

        }
    );
}


/* =========================================================
   BITÁCORA
   ========================================================= */

function obtenerBitacora() {

    try {

        return JSON.parse(
            localStorage.getItem(
                BITACORA_KEY
            )
        ) || [];

    } catch {

        return [];
    }
}


function guardarNota(texto) {

    const notas =
        obtenerBitacora();


    notas.push({

        texto: texto,

        fecha:
            new Date().toLocaleString(
                "es-AR"
            )

    });


    localStorage.setItem(
        BITACORA_KEY,
        JSON.stringify(notas)
    );
}


function mostrarBitacora() {

    const notas =
        obtenerBitacora();


    if (
        notas.length === 0
    ) {

        addMessage(
            "La bitácora está vacía."
        );

        return;
    }


    addMessage(
        `BITÁCORA — ${notas.length} registro(s)`
    );


    notas.forEach(
        (nota, indice) => {

            addMessage(
                `${indice + 1}. [${nota.fecha}] ${nota.texto}`
            );

        }
    );
}


window.mostrarBitacora =
    mostrarBitacora;


/* =========================================================
   COMANDOS DE BITÁCORA
   ========================================================= */

function procesarBitacora(texto) {

    const limpio =
        normalizar(texto);


    if (
        limpio === "ver bitacora" ||
        limpio === "bitacora" ||
        limpio === "ver notas"
    ) {

        mostrarBitacora();

        return true;
    }


    const patrones = [
        "meca anota ",
        "hector anota ",
        "anota ",
        "guarda "
    ];


    for (
        const patron of patrones
    ) {

        if (
            limpio.startsWith(patron)
        ) {

            const posicion =
                texto
                    .toLowerCase()
                    .indexOf(
                        patron
                    );


            const nota =
                texto
                    .substring(
                        posicion +
                        patron.length
                    )
                    .trim();


            if (!nota) {

                addMessage(
                    "Claro, Juan. ¿Qué quieres que anote?"
                );

                return true;
            }


            guardarNota(nota);


            addMessage(
                "Anotado. El registro quedó guardado en la bitácora."
            );


            return true;
        }
    }


    return false;
}


/* =========================================================
   ESTADO VISUAL
   ========================================================= */

function estadoProcesando() {

    const status =
        document.getElementById(
            "thinkingStatus"
        );

    const core =
        document.getElementById(
            "coreStatus"
        );


    if (status)
        status.textContent =
            "PROCESSING";


    if (core)
        core.textContent =
            "ANALYZING";
}


function estadoListo() {

    const status =
        document.getElementById(
            "thinkingStatus"
        );

    const core =
        document.getElementById(
            "coreStatus"
        );


    if (status)
        status.textContent =
            "READY";


    if (core)
        core.textContent =
            "READY";
}


/* =========================================================
   IA
   ========================================================= */

async function hablarConIA(texto) {

    if (procesando)
        return;


    procesando = true;

    estadoProcesando();


    try {

        const historial =
            obtenerHistorial();


        const respuesta =
            await fetch(
                WORKER_URL,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        message: texto,

                        history:
                            historial

                    })

                }
            );


        const datos =
            await respuesta.json();


        if (!respuesta.ok) {

            console.error(
                "Error Worker:",
                datos
            );


            let detalle =
                JSON.stringify(
                    datos
                );


            addMessage(
                "El núcleo devolvió un error.\n" +
                detalle
            );


            return;
        }


        const respuestaIA =
            datos.reply;


        if (
            !respuestaIA
        ) {

            addMessage(
                "Recibí una respuesta vacía del núcleo."
            );

            return;
        }


        addMessage(
            respuestaIA,
            "meca"
        );


        registrarConversacion(
            "assistant",
            respuestaIA
        );


        hablar(
            respuestaIA
        );


    } catch (error) {

        console.error(
            "Error:",
            error
        );


        addMessage(
            "No pude establecer comunicación con el núcleo."
        );

    } finally {

        procesando =
            false;

        estadoListo();

    }
}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage() {

    const campo =
        input();


    if (!campo)
        return;


    const texto =
        campo.value.trim();


    if (!texto)
        return;


    if (procesando)
        return;


    addMessage(
        texto,
        "usuario"
    );


    campo.value = "";


    registrarConversacion(
        "user",
        texto
    );


    /*
     * Comandos locales
     */

    if (
        procesarBitacora(texto)
    ) {

        return;
    }


    await hablarConIA(
        texto
    );
}


window.sendMessage =
    sendMessage;


/* =========================================================
   VOZ
   ========================================================= */

function hablar(texto) {

    if (!vozActiva)
        return;


    if (
        !window.speechSynthesis
    )
        return;


    speechSynthesis.cancel();


    const voz =
        new SpeechSynthesisUtterance(
            texto
        );


    voz.lang =
        "es-ES";

    voz.rate =
        .95;

    voz.pitch =
        .8;


    speechSynthesis.speak(
        voz
    );
}


function toggleVoice() {

    vozActiva =
        !vozActiva;


    const boton =
        document.getElementById(
            "voiceButton"
        );


    if (vozActiva) {

        if (boton)
            boton.textContent =
                "◉ ON";


        addMessage(
            "Voz activada."
        );

    } else {

        if (boton)
            boton.textContent =
                "◉";


        speechSynthesis.cancel();


        addMessage(
            "Voz desactivada."
        );
    }
}


window.toggleVoice =
    toggleVoice;


/* =========================================================
   RELOJ
   ========================================================= */

function actualizarReloj() {

    const reloj =
        document.getElementById(
            "clock"
        );


    if (!reloj)
        return;


    const ahora =
        new Date();


    reloj.textContent =
        ahora.toLocaleTimeString(
            "es-AR",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
}


setInterval(
    actualizarReloj,
    1000
);


/* =========================================================
   ENTER
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const campo =
            input();


        if (campo) {

            campo.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        sendMessage();
                    }

                }
            );

        }


        actualizarReloj();

    }
);
