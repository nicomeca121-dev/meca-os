/* =========================================================
   M.E.C.A. OS
   APP.JS — Núcleo de conversación
   ========================================================= */

const WORKER_URL =
    "https://meca-core.nicomeca121.workers.dev";

let procesando = false;
let vozActiva = false;


/* =========================================================
   ELEMENTOS DEL HUD
   ========================================================= */

function obtenerInput() {
    return document.getElementById("input");
}

function obtenerMensajes() {
    return document.getElementById("messages");
}


/* =========================================================
   CHAT
   ========================================================= */

function agregarMensaje(texto, tipo = "meca") {

    const contenedor = obtenerMensajes();

    if (!contenedor) {
        console.error("M.E.C.A.: no encuentro #messages");
        return;
    }

    const mensaje = document.createElement("div");

    mensaje.classList.add("message");

    if (tipo === "usuario") {
        mensaje.classList.add("usuario");
    } else {
        mensaje.classList.add("meca");
    }

    mensaje.textContent = texto;

    contenedor.appendChild(mensaje);

    contenedor.scrollTop = contenedor.scrollHeight;
}


function mostrarProcesando() {

    const contenedor = obtenerMensajes();

    if (!contenedor) return;

    const anterior =
        document.getElementById("meca-processing");

    if (anterior) anterior.remove();

    const mensaje =
        document.createElement("div");

    mensaje.id = "meca-processing";
    mensaje.className = "message meca";
    mensaje.textContent =
        "M.E.C.A.: procesando...";

    contenedor.appendChild(mensaje);

    contenedor.scrollTop =
        contenedor.scrollHeight;
}


function quitarProcesando() {

    const elemento =
        document.getElementById("meca-processing");

    if (elemento) {
        elemento.remove();
    }
}


/* =========================================================
   NORMALIZACIÓN
   ========================================================= */

function normalizar(texto) {

    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}


/* =========================================================
   BITÁCORA
   ========================================================= */

const BITACORA_KEY =
    "meca_bitacora";


function obtenerBitacora() {

    try {

        const datos =
            localStorage.getItem(BITACORA_KEY);

        if (!datos) {
            return [];
        }

        const notas =
            JSON.parse(datos);

        if (!Array.isArray(notas)) {
            return [];
        }

        return notas;

    } catch (error) {

        console.error(
            "Error leyendo bitácora:",
            error
        );

        return [];
    }
}


function guardarNota(texto) {

    const notas =
        obtenerBitacora();

    notas.push({

        texto: texto,

        fecha:
            new Date().toLocaleString("es-AR")

    });

    localStorage.setItem(
        BITACORA_KEY,
        JSON.stringify(notas)
    );
}


function mostrarBitacora() {

    const notas =
        obtenerBitacora();

    if (notas.length === 0) {

        agregarMensaje(
            "La bitácora está vacía, Juan."
        );

        return;
    }

    agregarMensaje(
        "M.E.C.A.: BITÁCORA — " +
        notas.length +
        " registro(s)"
    );


    notas.forEach(
        (nota, indice) => {

            agregarMensaje(
                `${indice + 1}. [${nota.fecha}] ${nota.texto}`
            );

        }
    );
}


/* =========================================================
   PROCESAMIENTO DE BITÁCORA
   ========================================================= */

function procesarBitacora(texto) {

    const limpio =
        normalizar(texto);


    /* ---------- VER BITÁCORA ---------- */

    if (
        limpio === "ver bitacora" ||
        limpio === "bitacora" ||
        limpio === "ver notas" ||
        limpio === "notas"
    ) {

        mostrarBitacora();

        return true;
    }


    /* ---------- MECA ANOTA ---------- */

    if (
        limpio.startsWith("meca anota ")
    ) {

        const nota =
            texto.substring(
                texto.toLowerCase()
                    .indexOf("meca anota ") +
                11
            ).trim();


        if (!nota) {

            agregarMensaje(
                "Juan, necesito saber qué quieres que anote."
            );

            return true;
        }


        guardarNota(nota);

        agregarMensaje(
            "Anotado. El registro ha sido añadido a la bitácora."
        );

        return true;
    }


    /* ---------- GUARDA ---------- */

    if (
        limpio.startsWith("guarda ")
    ) {

        const nota =
            texto.substring(
                texto.toLowerCase()
                    .indexOf("guarda ") +
                7
            ).trim();


        if (!nota) {

            agregarMensaje(
                "¿Qué deseas que guarde?"
            );

            return true;
        }


        guardarNota(nota);

        agregarMensaje(
            "Registro almacenado en la bitácora."
        );

        return true;
    }


    return false;
}


/* =========================================================
   CALCULADORA FÍSICA
   ========================================================= */

function obtenerNumero(texto, palabras) {

    for (
        const palabra of palabras
    ) {

        const expresion =
            new RegExp(
                palabra +
                "\\s*(?:=|:)?" +
                "\\s*(-?\\d+(?:[.,]\\d+)?)",
                "i"
            );

        const coincidencia =
            texto.match(expresion);


        if (coincidencia) {

            return parseFloat(
                coincidencia[1]
                    .replace(",", ".")
            );
        }
    }

    return null;
}


function procesarCalculadora(texto) {

    const limpio =
        normalizar(texto);


    /* ---------- FUERZA ---------- */

    if (
        limpio.includes("calcular fuerza") ||
        limpio.includes("calcula fuerza")
    ) {

        const presion =
            obtenerNumero(
                texto,
                ["presion"]
            );

        const area =
            obtenerNumero(
                texto,
                ["area"]
            );


        if (
            presion !== null &&
            area !== null
        ) {

            const fuerza =
                presion * area;


            agregarMensaje(
                "CÁLCULO FÍSICO\n\n" +
                "F = P × A\n" +
                `F = ${presion} × ${area}\n\n` +
                `F = ${fuerza} N`
            );

        } else {

            agregarMensaje(
                "Necesito presión y área.\n\n" +
                "Ejemplo:\n" +
                "calcular fuerza presión 500 área 0.02"
            );
        }

        return true;
    }


    /* ---------- TORQUE ---------- */

    if (
        limpio.includes("calcular torque") ||
        limpio.includes("calcula torque")
    ) {

        const fuerza =
            obtenerNumero(
                texto,
                ["fuerza"]
            );

        const distancia =
            obtenerNumero(
                texto,
                ["distancia", "radio"]
            );


        if (
            fuerza !== null &&
            distancia !== null
        ) {

            const torque =
                fuerza * distancia;


            agregarMensaje(
                "CÁLCULO FÍSICO\n\n" +
                "τ = F × r\n" +
                `τ = ${fuerza} × ${distancia}\n\n` +
                `τ = ${torque} N·m`
            );

        } else {

            agregarMensaje(
                "Necesito fuerza y distancia.\n\n" +
                "Ejemplo:\n" +
                "calcular torque fuerza 20 distancia 0.15"
            );
        }

        return true;
    }


    /* ---------- PRESIÓN ---------- */

    if (
        limpio.includes("calcular presion") ||
        limpio.includes("calcula presion")
    ) {

        const fuerza =
            obtenerNumero(
                texto,
                ["fuerza"]
            );

        const area =
            obtenerNumero(
                texto,
                ["area"]
            );


        if (
            fuerza !== null &&
            area !== null
        ) {

            const presion =
                fuerza / area;


            agregarMensaje(
                "CÁLCULO FÍSICO\n\n" +
                "P = F / A\n" +
                `P = ${fuerza} / ${area}\n\n` +
                `P = ${presion} Pa`
            );

        } else {

            agregarMensaje(
                "Necesito fuerza y área."
            );
        }

        return true;
    }


    return false;
}


/* =========================================================
   VOZ
   ========================================================= */

function hablar(texto) {

    if (!vozActiva) return;

    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }


    window.speechSynthesis.cancel();


    const voz =
        new SpeechSynthesisUtterance(
            texto
        );


    voz.lang = "es-ES";
    voz.rate = 0.95;
    voz.pitch = 0.75;
    voz.volume = 1;


    window.speechSynthesis.speak(
        voz
    );
}


function activarVoz() {

    vozActiva = !vozActiva;


    if (!vozActiva) {

        window.speechSynthesis.cancel();

        agregarMensaje(
            "Lectura de voz desactivada."
        );

        return;
    }


    agregarMensaje(
        "Lectura de voz activada."
    );


    hablar(
        "Lectura de voz activada."
    );
}


/* =========================================================
   COMUNICACIÓN CON EL WORKER
   ========================================================= */

async function hablarConGemini(texto) {

    if (procesando) {
        return;
    }


    procesando = true;

    mostrarProcesando();


    try {

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
                        message: texto
                    })

                }
            );


        const datos =
            await respuesta.json();


        quitarProcesando();


        console.log(
            "Respuesta del núcleo:",
            datos
        );


        if (!respuesta.ok) {

            console.error(
                "Error Worker:",
                datos
            );


            agregarMensaje(
                "M.E.C.A.: el núcleo de IA devolvió un error."
            );

            procesando = false;

            return;
        }


        if (
            datos.reply
        ) {

            agregarMensaje(
                datos.reply
            );

            hablar(
                datos.reply
            );

        } else {

            agregarMensaje(
                "M.E.C.A.: recibí una respuesta, pero no pude interpretarla."
            );
        }


    } catch (error) {

        quitarProcesando();


        console.error(
            "Error de comunicación:",
            error
        );


        agregarMensaje(
            "M.E.C.A.: no pude comunicarme con el núcleo de IA."
        );

    }


    procesando = false;
}


/* =========================================================
   FUNCIÓN PRINCIPAL
   IMPORTANTE:
   EL HTML LLAMA A sendMessage()
   ========================================================= */

async function sendMessage() {

    const input =
        obtenerInput();


    if (!input) {

        console.error(
            "M.E.C.A.: no existe #input"
        );

        return;
    }


    const texto =
        input.value.trim();


    if (!texto) {
        return;
    }


    /* Mostrar mensaje de Juan */

    agregarMensaje(
        texto,
        "usuario"
    );


    /* Limpiar campo */

    input.value = "";


    /* ---------- BITÁCORA ---------- */

    if (
        procesarBitacora(texto)
    ) {
        return;
    }


    /* ---------- CALCULADORA ---------- */

    if (
        procesarCalculadora(texto)
    ) {
        return;
    }


    /* ---------- GEMINI ---------- */

    await hablarConGemini(
        texto
    );
}


/* =========================================================
   HACER sendMessage VISIBLE PARA onclick=""
   ========================================================= */

window.sendMessage =
    sendMessage;


/* =========================================================
   ENTER PARA ENVIAR
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const input =
            obtenerInput();


        if (!input) {
            return;
        }


        input.addEventListener(
            "keydown",
            function(event) {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    sendMessage();
                }

            }
        );


        console.log(
            "M.E.C.A. OS iniciado."
        );

        console.log(
            "Núcleo:",
            WORKER_URL
        );

    }
);
