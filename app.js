```javascript
/* =========================================================
   H.E.C.T.O.R. OS
   Conversational Core v3.1
   Sistema integrado
   ========================================================= */

const WORKER_URL =
    "https://meca-core.nicomeca121.workers.dev";

const CHAT_HISTORY_KEY =
    "hector_conversation";

const BITACORA_KEY =
    "meca_bitacora";

const INTERFACE_KEY =
    "hector_interface";


/* =========================================================
   ESTADO
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


/* =========================================================
   CHAT
   ========================================================= */

function addMessage(texto, tipo = "meca") {

    const caja = messages();

    if (!caja) return;

    const mensaje = document.createElement("div");

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
            String(texto || "");

        mensaje.appendChild(nombre);
        mensaje.appendChild(contenido);

    } else {

        mensaje.textContent =
            String(texto || "");
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
            "Error leyendo historial:",
            error
        );

        return [];
    }
}


function guardarHistorial(historial) {

    try {

        localStorage.setItem(
            CHAT_HISTORY_KEY,
            JSON.stringify(
                historial.slice(-20)
            )
        );

    } catch (error) {

        console.warn(
            "Error guardando historial:",
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
        timestamp: Date.now()
    });

    guardarHistorial(
        historial
    );
}


function restaurarConversacion() {

    const historial =
        obtenerHistorial();

    const caja =
        messages();

    if (!caja)
        return;

    if (historial.length === 0)
        return;

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
        fecha: new Date().toLocaleString("es-AR")
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
   COMANDOS DE BITÁCORA
   ========================================================= */

function procesarBitacora(texto) {

    const original =
        String(texto || "").trim();

    const limpio =
        normalizar(original);

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

    for (const patron of patrones) {

        if (limpio.startsWith(patron)) {

            const nota =
                original
                    .substring(patron.length)
                    .trim();

            if (!nota) {

                addMessage(
                    "Claro. ¿Qué quieres que registre?"
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
   INTERFACES
   ========================================================= */

const INTERFACES = [
    {
        id: "hud",
        nombre: "H.E.C.T.O.R. HUD",
        clase: "theme-hud"
    },
    {
        id: "tactical",
        nombre: "TACTICAL",
        clase: "theme-tactical"
    },
    {
        id: "research",
        nombre: "RESEARCH",
        clase: "theme-research"
    },
    {
        id: "core",
        nombre: "CORE",
        clase: "theme-core"
    }
];


function obtenerInterfazActual() {

    const guardada =
        localStorage.getItem(
            INTERFACE_KEY
        );

    return (
        INTERFACES.find(
            interfaz =>
                interfaz.id === guardada
        ) ||
        INTERFACES[0]
    );
}


function aplicarInterfaz(id, anunciar = false) {

    const interfaz =
        INTERFACES.find(
            item =>
                item.id === id
        ) ||
        INTERFACES[0];

    const body =
        document.body;

    if (!body)
        return;

    INTERFACES.forEach(
        item => {

            body.classList.remove(
                item.clase
            );

        }
    );

    body.classList.add(
        interfaz.clase
    );

    localStorage.setItem(
        INTERFACE_KEY,
        interfaz.id
    );

    const indicador =
        document.getElementById(
            "interfaceName"
        );

    if (indicador) {

        indicador.textContent =
            interfaz.nombre;
    }

    if (anunciar) {

        addMessage(
            `Interfaz activa: ${interfaz.nombre}.`
        );
    }
}


function cambiarInterfaz() {

    const actual =
        obtenerInterfazActual();

    const indice =
        INTERFACES.findIndex(
            item =>
                item.id === actual.id
        );

    const siguiente =
        INTERFACES[
            (indice + 1) %
            INTERFACES.length
        ];

    aplicarInterfaz(
        siguiente.id,
        true
    );
}

window.cambiarInterfaz =
    cambiarInterfaz;


/* =========================================================
   BOTÓN DE INTERFAZ
   ========================================================= */

function crearBotonInterfaz() {

    if (
        document.getElementById(
            "interfaceButton"
        )
    )
        return;

    const status =
        document.querySelector(
            ".system-status"
        );

    if (!status)
        return;

    const boton =
        document.createElement(
            "button"
        );

    boton.id =
        "interfaceButton";

    boton.type =
        "button";

    boton.className =
        "interface-button";

    boton.textContent =
        "INTERFACE";

    boton.title =
        "Cambiar interfaz";

    boton.addEventListener(
        "click",
        cambiarInterfaz
    );

    status.appendChild(
        boton
    );
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

        vozActiva =
            false;

        if (
            window.speechSynthesis
        ) {

            speechSynthesis.cancel();
        }

        const boton =
            voiceButton();

        if (boton)
            boton.textContent =
                "◉";

        addMessage(
            "Salida de voz desactivada."
        );

        return true;
    }

    if (
        limpio === "activar voz" ||
        limpio === "voz"
    ) {

        vozActiva =
            true;

        const boton =
            voiceButton();

        if (boton)
            boton.textContent =
                "◉ ON";

        addMessage(
            "Salida de voz activada."
        );

        return true;
    }

    if (
        limpio === "cambiar interfaz" ||
        limpio === "cambiar hud" ||
        limpio === "siguiente interfaz"
    ) {

        cambiarInterfaz();

        return true;
    }

    return false;
}


/* =========================================================
   ESTADO
   ========================================================= */

function estadoProcesando() {

    if (thinkingStatus())
        thinkingStatus().textContent =
            "PROCESSING";

    if (coreStatus())
        coreStatus().textContent =
            "ANALYZING";
}


function estadoListo() {

    if (thinkingStatus())
        thinkingStatus().textContent =
            "READY";

    if (coreStatus())
        coreStatus().textContent =
            "READY";
}


function estadoError() {

    if (thinkingStatus())
        thinkingStatus().textContent =
            "ERROR";

    if (coreStatus())
        coreStatus().textContent =
            "ERROR";
}


function estadoEspera(segundos) {

    if (thinkingStatus())
        thinkingStatus().textContent =
            `WAIT ${segundos}s`;

    if (coreStatus())
        coreStatus().textContent =
            "RATE LIMIT";
}


/* =========================================================
   ERRORES GEMINI
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
            error ||
            datos ||
            ""
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

        if (intervaloBloqueo)
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
   ERROR IA
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
            `Límite temporal alcanzado. ` +
            `H.E.C.T.O.R. podrá continuar en aproximadamente ${segundos} segundos.`
        );

        return;
    }

    estadoError();

    if (
        status === 401 ||
        status === 403
    ) {

        addMessage(
            "La autenticación con el núcleo de IA fue rechazada. Revisa la credencial del Worker."
        );

        return;
    }

    if (status === 400) {

        addMessage(
            "El núcleo rechazó la solicitud por un formato no válido."
        );

        return;
    }

    addMessage(
        "El núcleo de IA encontró un problema al procesar la solicitud."
    );
}


/* =========================================================
   IA
   ========================================================= */

async function hablarConIA(texto) {

    if (procesando)
        return;

    if (
        bloqueoHasta >
        Date.now()
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
                        "Respuesta no válida del Worker."
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
            "No pude establecer comunicación con el núcleo de IA."
        );

    } finally {

        if (
            bloqueoHasta <=
            Date.now()
        ) {

            procesando =
                false;

            estadoListo();
        }
    }
}


/* =========================================================
   SEND
   ========================================================= */

async function sendMessage() {

    const campo =
        input();

    if (!campo)
        return;

    if (
        procesando ||
        bloqueoHasta >
        Date.now()
    )
        return;

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

    if (
        procesarComandoSistema(
            texto
        )
    )
        return;

    if (
        procesarBitacora(
            texto
        )
    )
        return;

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

    if (!window.speechSynthesis)
        return;

    speechSynthesis.cancel();

    const voz =
        new SpeechSynthesisUtterance(
            texto
        );

    voz.lang =
        "es-AR";

    /*
     * Voz más grave y pausada.
     * La voz disponible depende del navegador/SO.
     */
    voz.rate =
        0.90;

    voz.pitch =
        0.65;

    voz.volume =
        1;

    voz.onstart =
        () => {

            if (thinkingStatus())
                thinkingStatus().textContent =
                    "SPEAKING";
        };

    voz.onend =
        () => {

            if (
                bloqueoHasta <=
                Date.now()
            )
                estadoListo();
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

    } else {

        if (boton)
            boton.textContent =
                "◉";

        if (
            window.speechSynthesis
        )
            speechSynthesis.cancel();

        addMessage(
            "Salida de voz desactivada."
        );
    }
}

window.toggleVoice =
    toggleVoice;


/* =========================================================
   MICROFONO
   ========================================================= */

function obtenerReconocimientoVoz() {

    return (
        window.SpeechRecognition ||
        window.webkitSpeechRecognition ||
        null
    );
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


function detenerReconocimientoVoz() {

    if (
        reconocimientoVoz &&
        escuchando
    ) {

        try {
            reconocimientoVoz.stop();
        } catch {}
    }

    escuchando =
        false;

    actualizarBotonMicrofono();

    if (
        bloqueoHasta <=
        Date.now()
    )
        estadoListo();
}


function iniciarReconocimientoVoz() {

    const SpeechRecognition =
        obtenerReconocimientoVoz();

    if (!SpeechRecognition) {

        addMessage(
            "Este navegador no admite entrada por voz. Prueba con Chrome o Edge."
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

                if (thinkingStatus())
                    thinkingStatus().textContent =
                        "LISTENING";
            };

        reconocimientoVoz.onresult =
            event => {

                const resultado =
                    event.results[0][0]
                        .transcript;

                const campo =
                    input();

                if (campo) {

                    campo.value =
                        resultado;

                    campo.focus();
                }
            };

        reconocimientoVoz.onerror =
            event => {

                console.warn(
                    "Micrófono:",
                    event.error
                );

                escuchando =
                    false;

                actualizarBotonMicrofono();

                if (
                    event.error ===
                    "not-allowed"
                ) {

                    addMessage(
                        "El navegador bloqueó el acceso al micrófono."
                    );
                }

                estadoListo();
            };

        reconocimientoVoz.onend =
            () => {

                escuchando =
                    false;

                actualizarBotonMicrofono();

                if (
                    bloqueoHasta <=
                    Date.now()
                )
                    estadoListo();
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

window.iniciarReconocimientoVoz =
    iniciarReconocimientoVoz;


/* =========================================================
   GOOGLE
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
   HERRAMIENTAS
   ========================================================= */

function crearHerramientasExtra() {

    const area =
        document.querySelector(
            ".input-area"
        );

    if (!area)
        return;

    /*
     * MICROFONO
     */

    if (
        !document.getElementById(
            "microphoneButton"
        )
    ) {

        const boton =
            document.createElement(
                "button"
            );

        boton.id =
            "microphoneButton";

        boton.className =
            "icon-button";

        boton.type =
            "button";

        boton.textContent =
            "🎙";

        boton.title =
            "Hablar con H.E.C.T.O.R.";

        boton.addEventListener(
            "click",
            iniciarReconocimientoVoz
        );

        const campo =
            input();

        if (campo)
            area.insertBefore(
                boton,
                campo
            );
        else
            area.appendChild(
                boton
            );
    }


    /*
     * GOOGLE
     */

    if (
        !document.getElementById(
            "searchButton"
        )
    ) {

        const boton =
            document.createElement(
                "button"
            );

        boton.id =
            "searchButton";

        boton.className =
            "icon-button";

        boton.type =
            "button";

        boton.textContent =
            "⌕";

        boton.title =
            "Buscar en Google";

        boton.addEventListener(
            "click",
            buscarEnGoogle
        );

        area.appendChild(
            boton
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

    reloj.textContent =
        new Date().toLocaleTimeString(
            "es-AR",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
}


/* =========================================================
   INPUT
   ========================================================= */

function configurarInput() {

    const campo =
        input();

    if (!campo)
        return;

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
   ATAJOS
   ========================================================= */

function configurarAtajos() {

    if (
        document.body.dataset.hectorShortcuts
    )
        return;

    document.body.dataset.hectorShortcuts =
        "true";

    document.addEventListener(
        "keydown",
        event => {

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

            if (
                event.ctrlKey &&
                event.key.toLowerCase() === "i"
            ) {

                event.preventDefault();

                cambiarInterfaz();
            }

            if (
                event.key ===
                "Escape"
            ) {

                if (
                    window.speechSynthesis
                )
                    speechSynthesis.cancel();
            }
        }
    );
}


/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

function iniciarHECTOR() {

    inicializarInterfaz();

    configurarInput();

    configurarAtajos();

    crearHerramientasExtra();

    restaurarConversacion();

    actualizarReloj();

    estadoListo();
}


function inicializarInterfaz() {

    const interfaz =
        obtenerInterfazActual();

    aplicarInterfaz(
        interfaz.id
    );

    crearBotonInterfaz();
}


setInterval(
    actualizarReloj,
    1000
);


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarHECTOR,
        {
            once: true
        }
    );

} else {

    iniciarHECTOR();
}
```
