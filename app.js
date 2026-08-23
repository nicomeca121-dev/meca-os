/* ============================================================
   M.E.C.A. — APP.JS
   Mechanics & Engineering Cognitive Assistant
   ============================================================ */

/* =========================
   CONFIGURACIÓN
   ========================= */

const WORKER_URL =
  "https://meca-core.nicomeca121.workers.dev/";

/* =========================
   ESTADO
   ========================= */

let vozActiva = false;
let procesando = false;

/* =========================
   ELEMENTOS DEL HUD
   ========================= */

const chat =
  document.getElementById("chat") ||
  document.getElementById("messages") ||
  document.querySelector(".chat");

const input =
  document.getElementById("userInput") ||
  document.getElementById("messageInput") ||
  document.querySelector("input[type='text']");

const sendButton =
  document.getElementById("sendBtn") ||
  document.getElementById("sendButton") ||
  document.querySelector("button");

const voiceButton =
  document.getElementById("voiceBtn") ||
  document.getElementById("voiceButton");


/* =========================
   UTILIDADES
   ========================= */

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}


function escaparHTML(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}


/* =========================
   CHAT
   ========================= */

function agregarMensaje(texto, tipo = "meca") {

  if (!chat) {
    console.warn("No se encontró el contenedor del chat.");
    return;
  }

  const mensaje = document.createElement("div");

  mensaje.className =
    tipo === "usuario"
      ? "message user-message"
      : "message meca-message";

  mensaje.innerHTML = escaparHTML(texto);

  chat.appendChild(mensaje);

  chat.scrollTop = chat.scrollHeight;
}


function mostrarEstado(texto) {

  if (!chat) return;

  const estado = document.createElement("div");

  estado.className = "message meca-message processing";

  estado.textContent = texto;

  estado.id = "meca-processing";

  chat.appendChild(estado);

  chat.scrollTop = chat.scrollHeight;
}


function quitarEstado() {

  const estado =
    document.getElementById("meca-processing");

  if (estado) {
    estado.remove();
  }
}


/* =========================
   BITÁCORA
   ========================= */

const STORAGE_KEY = "meca_bitacora";


function obtenerBitacora() {

  try {

    const datos =
      localStorage.getItem(STORAGE_KEY);

    if (!datos) return [];

    const notas = JSON.parse(datos);

    return Array.isArray(notas)
      ? notas
      : [];

  } catch (error) {

    console.error(
      "Error leyendo bitácora:",
      error
    );

    return [];
  }
}


function guardarNota(texto) {

  const notas = obtenerBitacora();

  notas.push({
    texto: texto,
    fecha: new Date().toLocaleString("es-AR")
  });

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(notas)
  );
}


function mostrarBitacora() {

  const notas = obtenerBitacora();

  if (notas.length === 0) {

    agregarMensaje(
      "La bitácora está vacía, Juan."
    );

    return;
  }

  agregarMensaje(
    "BITÁCORA DE M.E.C.A."
  );

  notas.forEach((nota, indice) => {

    agregarMensaje(
      `${indice + 1}. [${nota.fecha}] ${nota.texto}`
    );

  });
}


/* =========================
   COMANDOS DE BITÁCORA
   ========================= */

function procesarBitacora(texto) {

  const limpio =
    normalizarTexto(texto);

  /*
     MECA ANOTA ...
     GUARDA ...
  */

  if (
    limpio.startsWith("meca anota ")
  ) {

    const nota =
      texto.substring(
        texto.toLowerCase().indexOf("meca anota ") +
        "meca anota ".length
      ).trim();

    if (!nota) {

      agregarMensaje(
        "Necesito saber qué quieres que anote, Juan."
      );

      return true;
    }

    guardarNota(nota);

    agregarMensaje(
      "Anotado en la bitácora, Juan. La información permanecerá guardada en este dispositivo."
    );

    return true;
  }


  if (
    limpio.startsWith("guarda ")
  ) {

    const nota =
      texto.substring(
        texto.toLowerCase().indexOf("guarda ") +
        "guarda ".length
      ).trim();

    if (!nota) {

      agregarMensaje(
        "¿Qué quieres que guarde?"
      );

      return true;
    }

    guardarNota(nota);

    agregarMensaje(
      "Guardado correctamente en la bitácora."
    );

    return true;
  }


  if (
    limpio === "ver bitacora" ||
    limpio === "bitacora" ||
    limpio === "notas" ||
    limpio === "ver notas"
  ) {

    mostrarBitacora();

    return true;
  }


  return false;
}


/* =========================
   CALCULADORA DE FÍSICA
   ========================= */

function procesarCalculadora(texto) {

  const limpio =
    normalizarTexto(texto);

  /*
     FUERZA = PRESIÓN × ÁREA

     Ejemplos:

     fuerza presion 500 area 0.02

     calcular fuerza presion 500 area 0.02
  */

  if (
    limpio.includes("calcular fuerza") ||
    limpio.includes("calcula fuerza")
  ) {

    const presion =
      extraerNumeroDespuesDe(
        texto,
        [
          "presion",
          "presión"
        ]
      );

    const area =
      extraerNumeroDespuesDe(
        texto,
        [
          "area",
          "área"
        ]
      );

    if (
      presion !== null &&
      area !== null
    ) {

      const fuerza =
        presion * area;

      agregarMensaje(
        `Cálculo físico:\nF = P × A\nF = ${presion} × ${area}\n\nF = ${fuerza} N`
      );

    } else {

      agregarMensaje(
        "Para calcular fuerza necesito presión y área. Ejemplo: «calcular fuerza presión 500 área 0.02»."
      );
    }

    return true;
  }


  /*
     TORQUE = FUERZA × DISTANCIA
  */

  if (
    limpio.includes("calcular torque") ||
    limpio.includes("calcula torque")
  ) {

    const fuerza =
      extraerNumeroDespuesDe(
        texto,
        ["fuerza"]
      );

    const distancia =
      extraerNumeroDespuesDe(
        texto,
        [
          "distancia",
          "radio"
        ]
      );

    if (
      fuerza !== null &&
      distancia !== null
    ) {

      const torque =
        fuerza * distancia;

      agregarMensaje(
        `Cálculo físico:\nτ = F × r\nτ = ${fuerza} × ${distancia}\n\nτ = ${torque} N·m`
      );

    } else {

      agregarMensaje(
        "Para calcular torque necesito fuerza y distancia. Ejemplo: «calcular torque fuerza 20 distancia 0.15»."
      );
    }

    return true;
  }


  /*
     PRESIÓN = FUERZA / ÁREA
  */

  if (
    limpio.includes("calcular presion") ||
    limpio.includes("calcula presion")
  ) {

    const fuerza =
      extraerNumeroDespuesDe(
        texto,
        ["fuerza"]
      );

    const area =
      extraerNumeroDespuesDe(
        texto,
        [
          "area",
          "superficie"
        ]
      );

    if (
      fuerza !== null &&
      area !== null
    ) {

      const presion =
        fuerza / area;

      agregarMensaje(
        `Cálculo físico:\nP = F / A\nP = ${fuerza} / ${area}\n\nP = ${presion} Pa`
      );

    } else {

      agregarMensaje(
        "Para calcular presión necesito fuerza y área. Ejemplo: «calcular presión fuerza 20 área 0.01»."
      );
    }

    return true;
  }


  return false;
}


function extraerNumeroDespuesDe(texto, palabras) {

  for (const palabra of palabras) {

    const regex =
      new RegExp(
        palabra + "\\s*[:=]?\\s*(-?\\d+(?:[.,]\\d+)?)",
        "i"
      );

    const resultado =
      texto.match(regex);

    if (resultado) {

      return parseFloat(
        resultado[1].replace(",", ".")
      );

    }
  }

  return null;
}


/* =========================
   PETICIÓN A GEMINI
   ========================= */

async function preguntarAMeca(texto) {

  if (procesando) return;

  procesando = true;

  mostrarEstado(
    "M.E.C.A. está procesando..."
  );

  try {

    const respuesta =
      await fetch(
        WORKER_URL,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            message: texto
          })
        }
      );


    const datos =
      await respuesta.json();


    quitarEstado();


    if (!respuesta.ok) {

      console.error(
        "Error del Worker:",
        datos
      );

      agregarMensaje(
        "He recibido una respuesta de error del núcleo de IA. Revisa la conexión con el Worker."
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

      console.error(
        "Respuesta inesperada:",
        datos
      );

      agregarMensaje(
        "El núcleo respondió, pero no pude interpretar su respuesta."
      );
    }


  } catch (error) {

    quitarEstado();

    console.error(
      "Error comunicando con M.E.C.A.:",
      error
    );

    agregarMensaje(
      "No pude establecer comunicación con el núcleo de IA. Comprueba la conexión con el servidor M.E.C.A."
    );

  }


  procesando = false;
}


/* =========================
   PROCESAMIENTO DEL MENSAJE
   ========================= */

async function procesarMensaje() {

  if (!input) return;

  const texto =
    input.value.trim();

  if (!texto) return;


  agregarMensaje(
    texto,
    "usuario"
  );

  input.value = "";


  /*
     Primero comprobamos funciones
     locales. Esto permite que la
     bitácora y calculadora funcionen
     incluso sin Internet.
  */

  if (
    procesarBitacora(texto)
  ) {
    return;
  }


  if (
    procesarCalculadora(texto)
  ) {
    return;
  }


  /*
     Todo lo demás pasa a Gemini.
     Ya no dependemos de una lista
     rígida de frases.
  */

  await preguntarAMeca(texto);
}


/* =========================
   VOZ
   ========================= */

function hablar(texto) {

  if (!vozActiva) return;

  if (
    !("speechSynthesis" in window)
  ) {

    console.warn(
      "Speech Synthesis no disponible."
    );

    return;
  }


  window.speechSynthesis.cancel();


  const voz =
    new SpeechSynthesisUtterance(
      texto
    );


  voz.lang = "es-ES";

  /*
     Un tono ligeramente grave
     y una velocidad moderada.
  */

  voz.rate = 0.95;

  voz.pitch = 0.75;

  voz.volume = 1;


  window.speechSynthesis.speak(
    voz
  );
}


function alternarVoz() {

  vozActiva =
    !vozActiva;


  if (voiceButton) {

    voiceButton.textContent =
      vozActiva
        ? "🔊 VOZ: ON"
        : "🔇 VOZ: OFF";
  }


  if (!vozActiva) {

    window.speechSynthesis.cancel();

    agregarMensaje(
      "Lectura por voz desactivada."
    );

  } else {

    agregarMensaje(
      "Lectura por voz activada."
    );

    hablar(
      "Lectura por voz activada."
    );
  }
}


/* =========================
   EVENTOS
   ========================= */

if (sendButton) {

  sendButton.addEventListener(
    "click",
    procesarMensaje
  );

}


if (input) {

  input.addEventListener(
    "keydown",
    function(event) {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        procesarMensaje();
      }

    }
  );

}


if (voiceButton) {

  voiceButton.addEventListener(
    "click",
    alternarVoz
  );

}


/* =========================
   INICIALIZACIÓN
   ========================= */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    console.log(
      "M.E.C.A. iniciado correctamente."
    );

    console.log(
      "Núcleo remoto:",
      WORKER_URL
    );

  }
);
