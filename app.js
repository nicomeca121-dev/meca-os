/* =========================================================
   H.E.C.T.O.R. OS
   Conversational Core v2
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

let reconocimientoVoz = null;

let bloqueoHasta = 0;

let intervaloBloqueo = null;


/* =========================================================
   ELEMENTOS
   ========================================================= */

function input() {
    return document.getElementById("input");
}

function messages() {
    return document.getElementById("messages");
}

function sendButton() {
    return document.getElementById("sendButton");
}

function voiceButton() {
    return document.getElementById("voiceButton");
}

function thinkingStatus() {
    return document.getElementById("thinkingStatus");
}

function coreStatus() {
    return document.getElementById("coreStatus");
}


/* =========================================================
   UTILIDADES
   ========================================================= */

function normalizar(texto) {

    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function escaparTexto(texto) {
    return String(texto || "");
}

function esperar(ms) {
    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );
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
            escaparTexto(texto);

        mensaje.appendChild(nombre);

        mensaje.appendChild(contenido);

    } else {

        mensaje.textContent =
            escaparTexto(texto);
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

        if (!Array.isArray(historial))
            return [];

        return historial.filter(
            mensaje =>
                mensaje &&
                (
                    mensaje.role === "user" ||
                    mensaje.role === "assistant"
                ) &&
                typeof mensaje.text === "string"
        );

    } catch (error) {

        console.warn(
            "No se pudo leer el historial:",
            error
        );

        return [];
    }
}


function guardarHistorial(historial) {

    try {

        /*
         * 20 mensajes = suficiente contexto
         * sin mandar una cantidad innecesaria
         * de información al Worker.
         */

        const limitado =
            historial.slice(-20);

        localStorage.setItem(
            CHAT_HISTORY_KEY,
            JSON.stringify(limitado)
        );

    } catch (error) {

        console.warn(
            "No se pudo guardar el historial:",
            error
        );
    }
}


function registrarConversacion(
    role,
    text
) {

    const historial =
        obtenerHistorial();

    historial.push({

        role: role,

        text: String(text),

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

    const caja =
        messages();

    if (!caja)
        return;

    /*
     * Si existe historial, eliminamos
     * el mensaje inicial del HTML para
     * evitar duplicaciones.
     */

    if (historial.length > 0) {

        caja.innerHTML = "";

        historial.forEach(
            mensaje => {

                addMessage(
                    mensaje.text,
                    mensaje.role === "user"
                        ? "usuario"
                        : "meca"
                );

            }
        );
    }
}


/* =========================================================
   LIMPIAR CONVERSACIÓN
   ========================================================= */

function limpiarConversacion() {

    localStorage.removeItem(
        CHAT_HISTORY_KEY
    );

    const caja =
        messages();

    if (caja)
        caja.innerHTML = "";

    addMessage(
        "Historial conversacional eliminado. Núcleo listo."
    );
}

window.limpiarConversacion =
    limpiarConversacion;


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

        texto: String(texto),

        fecha:
            new Date().toLocaleString(
                "es-AR"
            )

    });

    try {

        localStorage.setItem(
            BITACORA_KEY,
            JSON.stringify(notas)
        );

    } catch (error) {

        console.error(
            "Error guardando bitácora:",
            error
        );
    }
}


function mostrarBitacora() {

    const notas =
        obtenerBitacora();

    if (notas.length === 0) {

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
   COMANDOS LOCALES
   ========================================================= */

function procesarBitacora(texto) {

    const original =
        String(texto || "").trim();

    const limpio =
        normalizar(original);

    /*
     * IMPORTANTE:
     *
     * Estos comandos requieren que la frase
     * empiece exactamente de esta manera.
     *
     * Así evitamos que una palabra parecida
     * dentro de una conversación normal
     * active accidentalmente un comando.
     */

    if (
        limpio === "ver bitacora" ||
        limpio === "bitacora" ||
        limpio === "ver notas" ||
        limpio === "mostrar bitacora"
    ) {

        mostrarBitacora();

        return true;
    }


    const patrones = [

        "hector anota ",
        "hector guarda ",
        "anota ",
        "guardar en bitacora ",
        "guarda en bitacora "

    ];


    for (
        const patron of patrones
    ) {

        if (
            limpio.startsWith(patron)
        ) {

            const nota =
                original
                    .substring(
                        patron.length
                    )
                    .trim();

            if (!nota) {

                addMessage(
                    "Claro. ¿Qué quieres que registre?"
                );

                return true;
            }

            guardarNota(
                nota
            );

            addMessage(
                "Anotado. El registro quedó guardado en la bitácora."
            );

            return true;
        }
    }

    return false;
}


/* =========================================================
   COMANDOS DEL SISTEMA
   ========================================================= */

function procesarComandoSistema(texto) {

    const limpio =
        normalizar(texto);

    if (
        limpio === "limpiar conversacion" ||
        limpio === "borrar conversacion" ||
        limpio === "borrar historial"
    ) {

        limpiarConversacion();

        return true;
    }


    if (
        limpio === "detener voz" ||
        limpio === "silenciar" ||
        limpio === "silencio"
    ) {

        vozActiva = false;

        speechSynthesis.cancel();

        const boton =
            voiceButton();

        if (boton)
            boton.textContent = "◉";

        addMessage(
            "Salida de voz desactivada."
        );

        return true;
    }


    if (
        limpio === "activar voz" ||
        limpio === "voz"
    ) {

        vozActiva = true;

        const boton =
            voiceButton();

        if (boton)
            boton.textContent = "◉ ON";

        addMessage(
            "Salida de voz activada."
        );

        return true;
    }

    return false;
}


/* =========================================================
   ESTADO VISUAL
   ========================================================= */

function estadoProcesando() {

    const status =
        thinkingStatus();

    const core =
        coreStatus();

    if (status)
        status.textContent =
            "PROCESSING";

    if (core)
        core.textContent =
            "ANALYZING";
}


function estadoListo() {

    const status =
        thinkingStatus();

    const core =
        coreStatus();

    if (status)
        status.textContent =
            "READY";

    if (core)
        core.textContent =
            "READY";
}


function estadoError() {

    const status =
        thinkingStatus();

    const core =
        coreStatus();

    if (status)
        status.textContent =
            "ERROR";

    if (core)
        core.textContent =
            "ERROR";
}


function estadoEspera(segundos) {

    const status =
        thinkingStatus();

    const core =
        coreStatus();

    if (status)
        status.textContent =
            `WAIT ${segundos}s`;

    if (core)
        core.textContent =
            "RATE LIMIT";
}


/* =========================================================
   ANALIZAR ERROR DEL WORKER
   ========================================================= */

function obtenerObjetoError(datos) {

    if (!datos)
        return null;

    if (
        datos.error &&
        typeof datos.error === "object"
    ) {

        return datos.error;
    }

    if (
        datos.details &&
        datos.details.error &&
        typeof datos.details.error === "object"
    ) {

        return datos.details.error;
    }

    return datos;
}


function esRateLimit(datos, status) {

    const error =
        obtenerObjetoError(datos);

    const mensaje =
        JSON.stringify(
            error || datos || ""
        ).toLowerCase();

    return (
        status === 429 ||
        mensaje.includes("too_many_requests") ||
        mensaje.includes("quota exceeded") ||
        mensaje.includes("rate limit") ||
        mensaje.includes("free_tier_requests")
    );
}


function extraerSegundosEspera(datos) {

    const texto =
        JSON.stringify(
            datos || ""
        );

    /*
     * Gemini suele devolver:
     *
     * "retry in 45.328388789s"
     *
     * También contemplamos otras variantes.
     */

    const coincidencia =
        texto.match(
            /retry(?:\s+in)?\s+([0-9]+(?:\.[0-9]+)?)\s*s/i
        );

    if (coincidencia) {

        return Math.max(
            1,
            Math.ceil(
                Number(
                    coincidencia[1]
                )
            )
        );
    }

    return 30;
}


/* =========================================================
   BLOQUEO POR CUOTA
   ========================================================= */

function iniciarBloqueo(segundos) {

    segundos =
        Math.max(
            1,
            Math.ceil(segundos)
        );

    bloqueoHasta =
        Date.now() +
        segundos * 1000;

    actualizarBloqueo();

    if (intervaloBloqueo)
        clearInterval(
            intervaloBloqueo
        );

    intervaloBloqueo =
        setInterval(
            actualizarBloqueo,
            250
        );
}


function actualizarBloqueo() {

    const restante =
        Math.max(
            0,
            Math.ceil(
                (
                    bloqueoHasta -
                    Date.now()
                ) / 1000
            )
        );

    if (restante <= 0) {

        clearInterval(
            intervaloBloqueo
        );

        intervaloBloqueo =
            null;

        bloqueoHasta =
            0;

        procesando =
            false;

        estadoListo();

        const boton =
            sendButton();

        if (boton) {

            boton.disabled =
                false;

            boton.textContent =
                "➤";
        }

        addMessage(
            "Núcleo disponible nuevamente."
        );

        return;
    }

    estadoEspera(
        restante
    );

    const boton =
        sendButton();

    if (boton) {

        boton.disabled =
            true;

        boton.textContent =
            `${restante}s`;
    }
}


/* =========================================================
   ERROR AMIGABLE
   ========================================================= */

function manejarErrorIA(
    datos,
    status
) {

    console.error(
        "Respuesta del Worker:",
        datos
    );

    if (
        esRateLimit(
            datos,
            status
        )
    ) {

        const segundos =
            extraerSegundosEspera(
                datos
            );

        iniciarBloqueo(
            segundos
        );

        addMessage(
            `He alcanzado temporalmente el límite de procesamiento de Gemini. ` +
            `Podré continuar en aproximadamente ${segundos} segundos.`
        );

        return;
    }

    estadoError();

    const error =
        obtenerObjetoError(
            datos
        );

    const mensaje =
        (
            error &&
            typeof error.message === "string"
        )
            ? error.message
            : "";

    if (
        status === 401 ||
        status === 403
    ) {

        addMessage(
            "La autenticación con el núcleo de IA fue rechazada. " +
            "La conexión está activa, pero la credencial necesita revisión."
        );

        return;
    }

    if (status === 400) {

        addMessage(
            "El núcleo rechazó la solicitud. " +
            "Puede tratarse de un formato o parámetro no válido."
        );

        return;
    }

    if (mensaje) {

        console.warn(
            "Detalle IA:",
            mensaje
        );
    }

    addMessage(
        "El núcleo de IA encontró un problema al procesar la solicitud. " +
        "Revisa la consola para obtener el detalle técnico."
    );
}


/* =========================================================
   IA
   ========================================================= */

async function hablarConIA(texto) {

    if (procesando)
        return;

    if (
        bloqueoHasta > Date.now()
    ) {

        actualizarBloqueo();

        return;
    }

    procesando =
        true;

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

                    body:
                        JSON.stringify({

                            message:
                                texto,

                            history:
                                historial

                        })

                }
            );

        let datos;

        try {

            datos =
                await respuesta.json();

        } catch {

            datos = {
                error: {
                    message:
                        "El Worker devolvió una respuesta no válida."
                }
            };
        }

        if (!respuesta.ok) {

            manejarErrorIA(
                datos,
                respuesta.status
            );

            return;
        }

        const respuestaIA =
            typeof datos.reply === "string"
                ? datos.reply.trim()
                : "";

        if (!respuestaIA) {

            estadoError();

            addMessage(
                "El núcleo respondió, pero no devolvió contenido."
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
            "Error de comunicación:",
            error
        );

        estadoError();

        addMessage(
            "No pude establecer comunicación con el núcleo de IA. " +
            "Comprueba la conexión con el servidor."
        );

    } finally {

        /*
         * Si existe un bloqueo de cuota,
         * el propio temporizador controla
         * el estado.
         */

        if (
            bloqueoHasta <= Date.now()
        ) {

            procesando =
                false;

            estadoListo();
        }
    }
}


/* =========================================================
   ENVIAR MENSAJE
   ========================================================= */

async function sendMessage() {

    const campo =
        input();

    if (!campo)
        return;

    if (
        procesando ||
        bloqueoHasta > Date.now()
    ) {

        return;
    }

    const texto =
        campo.value.trim();

    if (!texto)
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
     * Primero procesamos comandos
     * que no necesitan IA.
     */

    if (
        procesarComandoSistema(texto)
    ) {

        return;
    }

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
   VOZ — SALIDA
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
        "es-AR";

    voz.rate =
        0.95;

    voz.pitch =
        0.85;

    voz.volume =
        1;

    voz.onstart = () => {

        const status =
            thinkingStatus();

        if (status)
            status.textContent =
                "SPEAKING";
    };

    voz.onend = () => {

        if (
            bloqueoHasta <= Date.now()
        ) {

            estadoListo();
        }
    };

    speechSynthesis.speak(
        voz
    );
}


function toggleVoice() {

    vozActiva =
        !vozActiva;

    const boton =
        voiceButton();

    if (vozActiva) {

        if (boton)
            boton.textContent =
                "◉ ON";

        addMessage(
            "Salida de voz activada."
        );

        /*
         * Pequeña confirmación hablada.
         */

        hablar(
            "Salida de voz activada."
        );

    } else {

        if (boton)
            boton.textContent =
                "◉";

        if (
            window.speechSynthesis
        ) {

            speechSynthesis.cancel();
        }

        addMessage(
            "Salida de voz desactivada."
        );
    }
}

window.toggleVoice =
    toggleVoice;


/* =========================================================
   RECONOCIMIENTO DE VOZ
   ========================================================= */

function obtenerReconocimientoVoz() {

    return (
        window.SpeechRecognition ||
        window.webkitSpeechRecognition ||
        null
    );
}


function iniciarReconocimientoVoz() {

    const SpeechRecognition =
        obtenerReconocimientoVoz();

    if (!SpeechRecognition) {

        addMessage(
            "El navegador no admite entrada por voz. " +
            "Prueba con Chrome o Edge."
        );

        return;
    }

    if (escuchando) {

        detenerReconocimientoVoz();

        return;
    }

    if (!reconocimientoVoz) {

        reconocimientoVoz =
            new SpeechRecognition();

        reconocimientoVoz.lang =
            "es-AR";

        reconocimientoVoz.continuous =
            false;

        reconocimientoVoz.interimResults =
            false;

        reconocimientoVoz.maxAlternatives =
            1;

        reconocimientoVoz.onstart =
            () => {

                escuchando =
                    true;

                actualizarBotonMicrofono();

                const status =
                    thinkingStatus();

                if (status)
                    status.textContent =
                        "LISTENING";
            };

        reconocimientoVoz.onresult =
            event => {

                const resultado =
                    event.results[0][0].transcript;

                const campo =
                    input();

                if (campo) {

                    campo.value =
                        resultado;

                    campo.focus();
                }

                detenerReconocimientoVoz();

                /*
                 * No enviamos automáticamente.
                 * El usuario puede revisar lo
                 * que H.E.C.T.O.R. entendió.
                 */
            };

        reconocimientoVoz.onerror =
            event => {

                console.warn(
                    "Reconocimiento de voz:",
                    event.error
                );

                escuchando =
                    false;

                actualizarBotonMicrofono();

                estadoListo();

                if (
                    event.error ===
                    "not-allowed"
                ) {

                    addMessage(
                        "El navegador bloqueó el acceso al micrófono."
                    );
                }
            };

        reconocimientoVoz.onend =
            () => {

                escuchando =
                    false;

                actualizarBotonMicrofono();

                if (
                    bloqueoHasta <= Date.now()
                ) {

                    estadoListo();
                }
            };
    }

    try {

        reconocimientoVoz.start();

    } catch (error) {

        console.warn(
            "No se pudo iniciar el micrófono:",
            error
        );
    }
}


function detenerReconocimientoVoz() {

    if (
        reconocimientoVoz &&
        escuchando
    ) {

        reconocimientoVoz.stop();
    }

    escuchando =
        false;

    actualizarBotonMicrofono();

    if (
        bloqueoHasta <= Date.now()
    ) {

        estadoListo();
    }
}


function actualizarBotonMicrofono() {

    const boton =
        document.getElementById(
            "microphoneButton"
        );

    if (!boton)
        return;

    boton.textContent =
        escuchando
            ? "●"
            : "🎙";

    boton.title =
        escuchando
            ? "Detener escucha"
            : "Hablar con H.E.C.T.O.R.";
}

window.iniciarReconocimientoVoz =
    iniciarReconocimientoVoz;


/* =========================================================
   BÚSQUEDA GOOGLE
   ========================================================= */

function buscarEnGoogle() {

    const campo =
        input();

    if (!campo)
        return;

    const consulta =
        campo.value.trim();

    if (!consulta) {

        addMessage(
            "Escribe algo primero y lo buscaré en Google."
        );

        campo.focus();

        return;
    }

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
}

window.buscarEnGoogle =
    buscarEnGoogle;


/* =========================================================
   CREAR BOTONES EXTRA
   ========================================================= */

function crearHerramientasExtra() {

    const area =
        document.querySelector(
            ".input-area"
        );

    if (!area)
        return;

    /*
     * Micrófono
     */

    if (
        !document.getElementById(
            "microphoneButton"
        )
    ) {

        const botonMicrofono =
            document.createElement("button");

        botonMicrofono.id =
            "microphoneButton";

        botonMicrofono.className =
            "icon-button";

        botonMicrofono.textContent =
            "🎙";

        botonMicrofono.title =
            "Hablar con H.E.C.T.O.R.";

        botonMicrofono.onclick =
            iniciarReconocimientoVoz;

        /*
         * Lo colocamos antes del input.
         */

        const campo =
            input();

        if (campo)
            area.insertBefore(
                botonMicrofono,
                campo
            );
        else
            area.appendChild(
                botonMicrofono
            );
    }


    /*
     * Google
     */

    if (
        !document.getElementById(
            "searchButton"
        )
    ) {

        const botonBusqueda =
            document.createElement("button");

        botonBusqueda.id =
            "searchButton";

        botonBusqueda.className =
            "icon-button";

        botonBusqueda.textContent =
            "⌕";

        botonBusqueda.title =
            "Buscar en Google";

        botonBusqueda.onclick =
            buscarEnGoogle;

        area.appendChild(
            botonBusqueda
        );
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

function configurarInput() {

    const campo =
        input();

    if (!campo)
        return;

    /*
     * Evitamos agregar múltiples
     * listeners si el script se
     * vuelve a cargar.
     */

    if (
        campo.dataset.hectorReady
    )
        return;

    campo.dataset.hectorReady =
        "true";

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


/* =========================================================
   ATAJOS DE TECLADO
   ========================================================= */

function configurarAtajos() {

    document.addEventListener(
        "keydown",
        event => {

            /*
             * Ctrl + K
             * Enfoca el chat.
             */

            if (
                event.ctrlKey &&
                event.key.toLowerCase() === "k"
            ) {

                event.preventDefault();

                const campo =
                    input();

                if (campo)
                    campo.focus();
            }


            /*
             * Escape
             * Detiene la voz.
             */

            if (
                event.key === "Escape"
            ) {

                if (
                    window.speechSynthesis
                ) {

                    speechSynthesis.cancel();
                }
            }
        }
    );
}


/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        configurarInput();

        configurarAtajos();

        crearHerramientasExtra();

        restaurarConversacion();

        actualizarReloj();

        estadoListo();

    }
);
