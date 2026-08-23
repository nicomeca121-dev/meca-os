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


/* =========================================================
   ESTADO DEL SISTEMA
   ========================================================= */

let procesando = false;
let vozActiva = false;
let escuchando = false;


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


        if (!datos)
            return [];


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
     * Conservamos los últimos 20 mensajes.
     */

    const limitado =
        historial.slice(-20);


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


    if (!caja)
        return;


    historial.forEach(
        mensaje => {

            if (
                mensaje.role ===
                "user"
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

        const datos =
            localStorage.getItem(
                BITACORA_KEY
            );


        if (!datos)
            return [];


        const notas =
            JSON.parse(datos);


        return Array.isArray(notas)
            ? notas
            : [];

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


    /* -----------------------------------------
       VER BITÁCORA
       ----------------------------------------- */

    if (
        limpio === "ver bitacora" ||
        limpio === "bitacora" ||
        limpio === "ver notas" ||
        limpio === "mostrar bitacora"
    ) {

        mostrarBitacora();

        return true;
    }


    /* -----------------------------------------
       BORRAR BITÁCORA
       ----------------------------------------- */

    if (
        limpio === "borrar bitacora" ||
        limpio === "vaciar bitacora"
    ) {

        const confirmar =
            confirm(
                "¿Seguro que quieres borrar toda la bitácora?"
            );


        if (confirmar) {

            localStorage.removeItem(
                BITACORA_KEY
            );


            addMessage(
                "Bitácora eliminada."
            );

        } else {

            addMessage(
                "Operación cancelada."
            );

        }


        return true;
    }


    /* -----------------------------------------
       GUARDAR NOTA
       ----------------------------------------- */

    const patrones = [

        "meca anota ",
        "hector anota ",
        "h.e.c.t.o.r. anota ",
        "anota ",
        "guarda ",
        "guardar "

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
   BÚSQUEDA EN GOOGLE
   ========================================================= */

function buscarGoogle(consulta) {

    if (!consulta)
        return;


    consulta =
        consulta.trim();


    if (!consulta)
        return;


    const url =
        "https://www.google.com/search?q=" +
        encodeURIComponent(
            consulta
        );


    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );


    addMessage(
        `Abriendo búsqueda: ${consulta}`
    );
}


window.buscarGoogle =
    buscarGoogle;


/* =========================================================
   COMANDO "BUSCAR"
   ========================================================= */

function procesarBusqueda(texto) {

    const limpio =
        normalizar(texto);


    const patrones = [

        "buscar ",
        "busca ",
        "google ",
        "busca en google "

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


            const consulta =
                texto
                    .substring(
                        posicion +
                        patron.length
                    )
                    .trim();


            if (!consulta) {

                addMessage(
                    "¿Qué quieres que busque?"
                );

                return true;

            }


            buscarGoogle(
                consulta
            );


            return true;
        }
    }


    return false;
}


/* =========================================================
   ESTADOS DEL HUD
   ========================================================= */

function establecerEstado(
    estado,
    secundario = ""
) {

    const status =
        document.getElementById(
            "thinkingStatus"
        );


    const core =
        document.getElementById(
            "coreStatus"
        );


    const systemStatus =
        document.getElementById(
            "systemStatus"
        );


    if (status)
        status.textContent =
            estado;


    if (core)
        core.textContent =
            secundario ||
            estado;


    if (systemStatus)
        systemStatus.textContent =
            estado;


    /*
     * Permite que CSS pueda reaccionar
     * al estado del sistema.
     */

    document.body.dataset.hectorState =
        estado.toLowerCase();


    const coreElement =
        document.querySelector(
            ".core"
        );


    if (coreElement) {

        coreElement.dataset.state =
            estado.toLowerCase();

    }
}


function estadoListo() {

    establecerEstado(
        "READY",
        "ONLINE"
    );
}


function estadoProcesando() {

    establecerEstado(
        "PROCESSING",
        "ANALYZING"
    );
}


function estadoEscuchando() {

    establecerEstado(
        "LISTENING",
        "AUDIO INPUT"
    );
}


function estadoRespondiendo() {

    establecerEstado(
        "RESPONDING",
        "VOICE OUTPUT"
    );
}


/* =========================================================
   IA
   ========================================================= */

async function hablarConIA(texto) {

    if (procesando)
        return;


    procesando =
        true;


    estadoProcesando();


    try {

        const historial =
            obtenerHistorial();


        const bitacora =
            obtenerBitacora();


        /*
         * Mandamos tanto historial como bitácora.
         *
         * Esto es importante:
         * antes el Worker recibía el historial,
         * pero no la bitácora.
         */

        const respuesta =
            await fetch(
                WORKER_URL,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            message:
                                texto,

                            history:
                                historial,

                            bitacora:
                                bitacora

                        })

                }
            );


        let datos;


        try {

            datos =
                await respuesta.json();

        } catch {

            datos = null;

        }


        /* -----------------------------------------
           ERROR DEL WORKER
           ----------------------------------------- */

        if (!respuesta.ok) {

            console.error(
                "Error Worker:",
                datos
            );


            let detalle =
                datos
                    ? JSON.stringify(
                        datos
                    )
                    : "Sin detalles.";


            addMessage(
                "El núcleo devolvió un error.\n" +
                detalle
            );


            return;
        }


        /* -----------------------------------------
           RESPUESTA
           ----------------------------------------- */

        const respuestaIA =
            datos?.reply;


        if (
            !respuestaIA
        ) {

            addMessage(
                "Recibí una respuesta vacía del núcleo."
            );

            return;
        }


        /* -----------------------------------------
           MOSTRAR RESPUESTA
           ----------------------------------------- */

        addMessage(
            respuestaIA,
            "meca"
        );


        registrarConversacion(
            "assistant",
            respuestaIA
        );


        /* -----------------------------------------
           VOZ
           ----------------------------------------- */

        if (vozActiva) {

            estadoRespondiendo();

            hablar(
                respuestaIA
            );

        }


    } catch (error) {

        console.error(
            "Error de comunicación:",
            error
        );


        addMessage(
            "No pude establecer comunicación con el núcleo de IA."
        );


    } finally {

        procesando =
            false;


        /*
         * Si sigue hablando, no cambiamos
         * inmediatamente el estado.
         */

        if (
            !vozActiva ||
            !speechSynthesis.speaking
        ) {

            estadoListo();

        }

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
     * --------------------------------------
     * COMANDOS LOCALES
     * --------------------------------------
     */

    if (
        procesarBitacora(texto)
    ) {

        return;
    }


    if (
        procesarBusqueda(texto)
    ) {

        return;
    }


    /*
     * --------------------------------------
     * IA
     * --------------------------------------
     */

    await hablarConIA(
        texto
    );
}


window.sendMessage =
    sendMessage;


/* =========================================================
   VOZ DE H.E.C.T.O.R.
   ========================================================= */

function hablar(texto) {

    if (!vozActiva)
        return;


    if (
        !window.speechSynthesis
    ) {

        addMessage(
            "El navegador no dispone de síntesis de voz."
        );

        return;
    }


    speechSynthesis.cancel();


    const voz =
        new SpeechSynthesisUtterance(
            texto
        );


    voz.lang =
        "es-AR";


    voz.rate =
        0.95;


    voz.pitch =
        0.82;


    voz.volume =
        1;


    voz.onstart =
        () => {

            estadoRespondiendo();

        };


    voz.onend =
        () => {

            estadoListo();

        };


    voz.onerror =
        () => {

            estadoListo();

        };


    speechSynthesis.speak(
        voz
    );
}


/* =========================================================
   ACTIVAR / DESACTIVAR VOZ
   ========================================================= */

function toggleVoice() {

    vozActiva =
        !vozActiva;


    const boton =
        document.getElementById(
            "voiceButton"
        );


    if (vozActiva) {

        if (boton) {

            boton.textContent =
                "◉ ON";

            boton.classList.add(
                "active"
            );

        }


        addMessage(
            "Salida de voz activada."
        );


        /*
         * Pequeña prueba de voz.
         */

        hablar(
            "Sistema de voz H.E.C.T.O.R. activado."
        );


    } else {

        if (boton) {

            boton.textContent =
                "◉";

            boton.classList.remove(
                "active"
            );

        }


        if (
            window.speechSynthesis
        ) {

            speechSynthesis.cancel();

        }


        addMessage(
            "Salida de voz desactivada."
        );


        estadoListo();

    }
}


window.toggleVoice =
    toggleVoice;


/* =========================================================
   RECONOCIMIENTO DE VOZ
   ========================================================= */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


let reconocimiento =
    null;


if (SpeechRecognition) {

    reconocimiento =
        new SpeechRecognition();


    reconocimiento.lang =
        "es-AR";


    reconocimiento.continuous =
        false;


    reconocimiento.interimResults =
        false;


    reconocimiento.onstart =
        () => {

            escuchando =
                true;


            estadoEscuchando();


            const boton =
                document.getElementById(
                    "micButton"
                );


            if (boton) {

                boton.textContent =
                    "●";

                boton.classList.add(
                    "active"
                );

            }

        };


    reconocimiento.onresult =
        event => {

            const resultado =
                event
                    .results[0][0]
                    .transcript;


            const campo =
                input();


            if (campo) {

                campo.value =
                    resultado;

            }


            /*
             * Mandamos automáticamente
             * lo reconocido.
             */

            sendMessage();

        };


    reconocimiento.onerror =
        event => {

            console.error(
                "SpeechRecognition:",
                event.error
            );


            escuchando =
                false;


            estadoListo();

        };


    reconocimiento.onend =
        () => {

            escuchando =
                false;


            const boton =
                document.getElementById(
                    "micButton"
                );


            if (boton) {

                boton.textContent =
                    "🎙";

                boton.classList.remove(
                    "active"
                );

            }


            if (!procesando) {

                estadoListo();

            }

        };

}


/* =========================================================
   ACTIVAR MICRÓFONO
   ========================================================= */

function toggleMicrofono() {

    if (!reconocimiento) {

        addMessage(
            "El reconocimiento de voz no está disponible en este navegador."
        );

        return;
    }


    if (escuchando) {

        reconocimiento.stop();

        return;
    }


    try {

        reconocimiento.start();

    } catch (error) {

        console.error(
            "No se pudo iniciar el micrófono:",
            error
        );

    }
}


window.toggleMicrofono =
    toggleMicrofono;


/* =========================================================
   BOTÓN DE BÚSQUEDA
   ========================================================= */

function buscarDesdeBoton() {

    const campo =
        input();


    if (!campo)
        return;


    const consulta =
        campo.value.trim();


    if (!consulta) {

        addMessage(
            "Escribe qué quieres buscar."
        );

        campo.focus();

        return;
    }


    buscarGoogle(
        consulta
    );


    campo.value = "";
}


window.buscarDesdeBoton =
    buscarDesdeBoton;


/* =========================================================
   CREAR CONTROLES EXTRA
   ========================================================= */

function crearControlesExtra() {

    /*
     * No obligamos al HTML a tener los botones.
     *
     * Si después los agregamos manualmente,
     * este sistema simplemente los utiliza.
     */


    const voiceButton =
        document.getElementById(
            "voiceButton"
        );


    if (voiceButton) {

        voiceButton.onclick =
            toggleVoice;

    }


    const micButton =
        document.getElementById(
            "micButton"
        );


    if (micButton) {

        micButton.onclick =
            toggleMicrofono;

    }


    const searchButton =
        document.getElementById(
            "searchButton"
        );


    if (searchButton) {

        searchButton.onclick =
            buscarDesdeBoton;

    }

}


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

                minute: "2-digit",

                second: "2-digit"

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


        crearControlesExtra();


        actualizarReloj();


        /*
         * Restaurar conversación
         * después de cargar la interfaz.
         */

        restaurarConversacion();


        estadoListo();

    }
);


/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

window.addEventListener(
    "load",
    () => {

        estadoListo();

    }
);
