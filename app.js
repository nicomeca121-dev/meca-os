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
   CONFIGURACIÓN
   ========================================================= */

const CONFIG = {

    // Cantidad máxima de reintentos ante errores temporales
    maxRetries: 2,

    // Tiempo inicial de espera
    retryDelay: 2000,

    // Tiempo máximo para considerar una petición demasiado larga
    requestTimeout: 60000

};


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
   HISTORIAL
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


    if (!caja)
        return;


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
   QUICK COMMANDS
   =========================================================

   IMPORTANTE:

   No buscamos simplemente palabras como:

       "anota"
       "guarda"

   porque pueden aparecer dentro de una conversación normal.

   Ahora exigimos que la frase empiece explícitamente
   con una orden.
   ========================================================= */

function procesarBitacora(texto) {

    const limpio =
        normalizar(texto);


    /* -----------------------------------------------
       VER BITÁCORA
       ----------------------------------------------- */

    const comandosVer = [

        "ver bitacora",
        "abre la bitacora",
        "abrir bitacora",
        "mostrar bitacora",
        "muestra la bitacora",
        "ver notas",
        "mostrar notas"

    ];


    if (
        comandosVer.includes(limpio)
    ) {

        mostrarBitacora();

        return true;
    }


    /* -----------------------------------------------
       COMANDOS PARA GUARDAR
       -----------------------------------------------

       Solo funcionan si la frase comienza
       con uno de estos comandos.
       ----------------------------------------------- */

    const comandosGuardar = [

        "hector anota ",
        "hector guarda ",
        "hector registra ",

        "hector, anota ",
        "hector, guarda ",
        "hector, registra ",

        "anota en la bitacora ",
        "guarda en la bitacora ",
        "registra en la bitacora "

    ];


    for (
        const comando
        of comandosGuardar
    ) {

        if (
            limpio.startsWith(comando)
        ) {

            const posicion =
                texto
                    .toLowerCase()
                    .indexOf(
                        comando
                    );


            const nota =
                texto
                    .substring(
                        posicion +
                        comando.length
                    )
                    .trim();


            if (!nota) {

                addMessage(
                    "Claro. ¿Qué quieres que registre en la bitácora?"
                );

                return true;
            }


            guardarNota(nota);


            addMessage(
                "Registro almacenado en la bitácora."
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


function estadoEsperando() {

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
            "WAITING";


    if (core)
        core.textContent =
            "RATE LIMIT";
}


/* =========================================================
   ESPERA
   ========================================================= */

function esperar(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );
}


/* =========================================================
   PETICIÓN AL WORKER
   ========================================================= */

async function realizarPeticion(
    texto,
    historial
) {

    let ultimoError =
        null;


    for (
        let intento = 0;
        intento <= CONFIG.maxRetries;
        intento++
    ) {

        try {

            const controller =
                new AbortController();


            const timeout =
                setTimeout(
                    () => {
                        controller.abort();
                    },
                    CONFIG.requestTimeout
                );


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
                                    historial

                            }),

                        signal:
                            controller.signal

                    }
                );


            clearTimeout(timeout);


            let datos = null;


            try {

                datos =
                    await respuesta.json();

            } catch {

                datos = null;

            }


            /* -----------------------------------------
               ÉXITO
               ----------------------------------------- */

            if (
                respuesta.ok
            ) {

                return {

                    ok: true,

                    data:
                        datos

                };

            }


            /* -----------------------------------------
               RATE LIMIT
               ----------------------------------------- */

            if (
                respuesta.status === 429
            ) {

                ultimoError = {

                    type:
                        "rate_limit",

                    data:
                        datos

                };


                /*
                 * Si todavía tenemos intentos,
                 * esperamos antes de repetir.
                 */

                if (
                    intento <
                    CONFIG.maxRetries
                ) {

                    estadoEsperando();


                    const espera =
                        CONFIG.retryDelay *
                        Math.pow(
                            2,
                            intento
                        );


                    addMessage(
                        `Cuota temporalmente limitada. Reintentando en ${Math.round(espera / 1000)} segundos...`
                    );


                    await esperar(
                        espera
                    );


                    estadoProcesando();

                    continue;

                }


                return {

                    ok: false,

                    error:
                        ultimoError

                };

            }


            /* -----------------------------------------
               OTROS ERRORES
               ----------------------------------------- */

            return {

                ok: false,

                error: {

                    type:
                        "api",

                    status:
                        respuesta.status,

                    data:
                        datos

                }

            };


        } catch (error) {

            ultimoError =
                error;


            /*
             * AbortError = timeout
             */

            if (
                error.name ===
                "AbortError"
            ) {

                return {

                    ok: false,

                    error: {

                        type:
                            "timeout"

                    }

                };

            }


            /*
             * Error de conexión.
             * Podemos intentar nuevamente.
             */

            if (
                intento <
                CONFIG.maxRetries
            ) {

                const espera =
                    CONFIG.retryDelay *
                    Math.pow(
                        2,
                        intento
                    );


                await esperar(
                    espera
                );


                continue;

            }

        }

    }


    return {

        ok: false,

        error: {

            type:
                "connection",

            original:
                ultimoError

        }

    };
}


/* =========================================================
   INTERPRETAR ERROR
   ========================================================= */

function manejarErrorIA(error) {

    if (!error) {

        addMessage(
            "El núcleo de IA no respondió correctamente."
        );

        return;
    }


    /* -----------------------------------------------
       CUOTA
       ----------------------------------------------- */

    if (
        error.type ===
        "rate_limit"
    ) {

        let esperaTexto =
            "";


        const mensaje =
            error.data?.details?.error?.message ||
            error.data?.error?.message ||
            "";


        const coincidencia =
            mensaje.match(
                /retry in ([0-9.]+)s/i
            );


        if (
            coincidencia
        ) {

            const segundos =
                Math.ceil(
                    Number(
                        coincidencia[1]
                    )
                );


            esperaTexto =
                ` El servicio indica esperar aproximadamente ${segundos} segundos.`;

        }


        addMessage(
            "El núcleo de IA alcanzó temporalmente su cuota de solicitudes." +
            esperaTexto +
            " No es un fallo de H.E.C.T.O.R.; Gemini está limitando nuevas peticiones."
        );


        return;
    }


    /* -----------------------------------------------
       TIMEOUT
       ----------------------------------------------- */

    if (
        error.type ===
        "timeout"
    ) {

        addMessage(
            "La respuesta del núcleo tardó demasiado. La comunicación fue cancelada para evitar que H.E.C.T.O.R. quedara bloqueado."
        );

        return;
    }


    /* -----------------------------------------------
       CONEXIÓN
       ----------------------------------------------- */

    if (
        error.type ===
        "connection"
    ) {

        addMessage(
            "No pude establecer comunicación con el núcleo de IA. Comprueba la conexión con el servidor H.E.C.T.O.R."
        );

        return;
    }


    /* -----------------------------------------------
       API
       ----------------------------------------------- */

    if (
        error.type ===
        "api"
    ) {

        console.error(
            "Error Worker:",
            error.data
        );


        const codigo =
            error.data?.error?.code ||
            error.data?.code ||
            error.status;


        if (
            codigo === 401
        ) {

            addMessage(
                "El núcleo rechazó las credenciales de autenticación."
            );

            return;
        }


        if (
            codigo === 403
        ) {

            addMessage(
                "El núcleo rechazó la solicitud por permisos o configuración del proyecto."
            );

            return;
        }


        if (
            codigo === 400
        ) {

            addMessage(
                "El núcleo rechazó la solicitud porque los datos enviados no tienen el formato esperado."
            );

            return;
        }


        addMessage(
            "El núcleo de IA devolvió un error."
        );


        return;
    }


    addMessage(
        "Se produjo un error inesperado en el núcleo de IA."
    );
}


/* =========================================================
   IA
   ========================================================= */

async function hablarConIA(texto) {

    if (
        procesando
    )
        return;


    procesando =
        true;


    estadoProcesando();


    try {

        const historial =
            obtenerHistorial();


        const resultado =
            await realizarPeticion(
                texto,
                historial
            );


        if (
            !resultado.ok
        ) {

            manejarErrorIA(
                resultado.error
            );

            return;
        }


        const datos =
            resultado.data;


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


    if (
        procesando
    )
        return;


    addMessage(
        texto,
        "usuario"
    );


    campo.value =
        "";


    registrarConversacion(
        "user",
        texto
    );


    /*
     * Primero intentamos detectar
     * comandos locales.
     *
     * Solo los comandos explícitos
     * son interceptados.
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


    if (
        vozActiva
    ) {

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

                hour:
                    "2-digit",

                minute:
                    "2-digit"

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


        /*
         * Restauramos conversaciones
         * anteriores.
         */

        restaurarConversacion();

    }
);
