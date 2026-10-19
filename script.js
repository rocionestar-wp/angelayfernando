/* =========================================================
   ÁNGELA & FERNANDO — WEDDING WEBSITE
   Configuración editable + lógica del sitio
   ========================================================= */

/* ---------------------------------------------------------
   1) CONFIGURACIÓN — edita aquí todos los datos de la boda
   --------------------------------------------------------- */
const weddingConfig = {
  couple: "Ángela & Fernando",

  // Fecha y hora de la ceremonia (usada por el countdown). +02:00 = horario de verano en España
  date: "2027-06-26T12:30:00+02:00",
  dateDisplay: "26 de junio de 2027",   // texto mostrado en el hero y en "El gran día"
  dateShortDisplay: "26.06.2027",       // texto mostrado en el cierre

  ceremony: {
    time: "12:30 h",
    place: "Concatedral de Santa María la Redonda<br>C/ Portales, 14 · Logroño",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Concatedral+de+Santa+Mar%C3%ADa+la+Redonda+Logro%C3%B1o"
  },

  celebration: {
    time: "Tras la ceremonia",
    place: "Restaurante La Merced<br>Logroño",
    mapsUrl: "https://share.google/T8Ie7v0Nqpp0D10Lp"
  },

  // Número de cuenta para regalos. Mientras esté vacío se muestra un aviso
  // ("Muy pronto compartiremos aquí los datos"). Cuando Fernando cree la cuenta, pégala aquí.
  giftAccount: "ES28 2100 0913 1413 0015 0661",

  // Hotel. Añade uno por línea: { name, note, url }
  hotels: [
    { name: "Hotel FG Logroño", note: "", url: "https://share.google/LVoEfp8v5qFuwoKPG" }
  ]
};

/* ---------------------------------------------------------
   2) INYECCIÓN DE DATOS DE CONFIGURACIÓN EN EL HTML
   --------------------------------------------------------- */
function applyConfig() {
  const heroDate = document.getElementById("heroDate");
  if (heroDate) heroDate.textContent = weddingConfig.dateDisplay;

  const weddingDate = document.getElementById("weddingDate");
  if (weddingDate) weddingDate.textContent = weddingConfig.dateDisplay;

  const closingDate = document.getElementById("closingDate");
  if (closingDate) closingDate.textContent = weddingConfig.dateShortDisplay;

  const ceremonyTime = document.getElementById("ceremonyTime");
  if (ceremonyTime) ceremonyTime.textContent = weddingConfig.ceremony.time;
  const ceremonyPlace = document.getElementById("ceremonyPlace");
  if (ceremonyPlace) ceremonyPlace.innerHTML = weddingConfig.ceremony.place;
  const ceremonyMapBtn = document.getElementById("ceremonyMapBtn");
  if (ceremonyMapBtn) ceremonyMapBtn.href = weddingConfig.ceremony.mapsUrl;

  const celebrationTime = document.getElementById("celebrationTime");
  if (celebrationTime) celebrationTime.textContent = weddingConfig.celebration.time;
  const celebrationPlace = document.getElementById("celebrationPlace");
  if (celebrationPlace) celebrationPlace.innerHTML = weddingConfig.celebration.place;
  const celebrationMapBtn = document.getElementById("celebrationMapBtn");
  if (celebrationMapBtn) celebrationMapBtn.href = weddingConfig.celebration.mapsUrl;

  const hotelsList = document.getElementById("hotelsList");
  if (hotelsList) {
    if (weddingConfig.hotels.length) {
      hotelsList.innerHTML = weddingConfig.hotels.map((h) =>
        `<li class="hotel"><p class="hotel__name">${h.url ? `<a href="${h.url}" target="_blank" rel="noopener">${h.name}</a>` : h.name}</p>${h.note ? `<p class="hotel__note">${h.note}</p>` : ""}</li>`
      ).join("");
    } else {
      hotelsList.innerHTML = "";
    }
  }

  const giftAccount = document.querySelector('[data-config="giftAccount"]');
  if (giftAccount) {
    if (weddingConfig.giftAccount) {
      giftAccount.textContent = weddingConfig.giftAccount;
    } else {
      giftAccount.textContent = "Muy pronto compartiremos aquí los datos.";
      giftAccount.classList.add("is-pending");
    }
  }
}

/* ---------------------------------------------------------
   3) NAVEGACIÓN — header al hacer scroll + menú móvil
   --------------------------------------------------------- */
function initNav() {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  const overlay = document.getElementById("navOverlay");

  function setOpen(open) {
    links.classList.toggle("is-open", open);
    overlay.classList.toggle("is-open", open);
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  }

  toggle.addEventListener("click", () => setOpen(!links.classList.contains("is-open")));
  overlay.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  links.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
}

/* ---------------------------------------------------------
   4) COUNTDOWN
   --------------------------------------------------------- */
function initCountdown() {
  const target = new Date(weddingConfig.date).getTime();
  const els = {
    days: document.getElementById("cdDays"),
    hours: document.getElementById("cdHours"),
    minutes: document.getElementById("cdMinutes")
  };
  if (!els.days) return;

  function pad(n, len) { return String(n).padStart(len, "0"); }

  function tick() {
    const diff = Math.max(0, target - Date.now());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    els.days.textContent = pad(days, 3);
    els.hours.textContent = pad(hours, 2);
    els.minutes.textContent = pad(minutes, 2);
  }

  tick();
  setInterval(tick, 15000); // sin segundos: basta con refrescar cada pocos segundos
}

/* ---------------------------------------------------------
   6) SCROLL REVEAL — fade-in sutil al entrar en viewport
   --------------------------------------------------------- */
let revealObserver;

function observeReveal(nodeList) {
  if (!revealObserver) return;
  nodeList.forEach((el) => revealObserver.observe(el));
}

function initReveal() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReduced) {
    document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-visible"));
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          setTimeout(() => el.classList.add("is-visible"), i * 60);
          revealObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );

  observeReveal(document.querySelectorAll("[data-reveal]"));
}

/* ---------------------------------------------------------
   7) RSVP — cada confirmación hace dos cosas en paralelo:
      a) llega por email a angela.ruizdepalacios@gmail.com vía
         FormSubmit (formsubmit.co)
      b) se guarda en Firestore, para que aparezca al instante
         en la pestaña "Invitados" del panel privado

      ACTIVACIÓN DEL EMAIL (solo la primera vez):
      1. Publica la web en un hosting (no funciona abriendo el archivo en local).
      2. Envía un formulario de prueba desde la web.
      3. FormSubmit mandará un email de activación a Ángela: hay que pulsar el enlace de confirmación.
      4. A partir de ahí, cada confirmación llegará a su bandeja de entrada.

      FIRESTORE: si firebase-config.js no está relleno todavía, este paso
      simplemente se omite sin romper el envío del email (ver firebase-init.js).
   --------------------------------------------------------- */
function guardarEnFirestore(datos) {
  if (!window.db) return; // Firebase no configurado todavía: no pasa nada

  window.db.collection("rsvps").add({
    nombre: datos.nombre || "",
    apellidos: datos.apellidos || "",
    asistencia: datos.asistencia || "",
    acompanantes: Number(datos.acompanantes) || 0,
    acompanantesNombres: datos.acompanantesNombres || [],
    mesaAcomp: (datos.acompanantesNombres || []).map(() => null), // mesa de cada acompañante (la rellena el panel)
    autobus: datos.autobus || "",
    hotel: datos.hotel || "",
    alergias: datos.alergias || "",
    mensaje: datos.mensaje || "",
    mesa: null, // lo rellena el panel privado al hacer el seating plan
    creado: firebase.firestore.FieldValue.serverTimestamp()
  }).catch((err) => console.error("No se pudo guardar en Firestore:", err));
}

function initRsvp() {
  const form = document.getElementById("rsvpForm");
  const status = document.getElementById("rsvpStatus");
  if (!form) return;

  const attending = document.getElementById("attendingFields");
  const companions = document.getElementById("companions");
  const countField = document.getElementById("companionsCount");
  const addBtn = document.getElementById("addCompanion");

  // Acompañantes, bus, hotel y alergias solo salen si responde "Sí"
  // (se sincroniza también al cargar la página y al volver atrás, por si el navegador
  //  recuerda la respuesta marcada sin avisar al script)
  function syncAttending() {
    const checked = form.querySelector('input[name="asistencia"]:checked');
    const yes = !!checked && checked.value === "Sí";
    attending.hidden = !yes;
    attending.querySelectorAll("input, textarea, button, select").forEach((el) => { el.disabled = !yes; });
  }
  form.querySelectorAll('input[name="asistencia"]').forEach((r) => {
    r.addEventListener("change", syncAttending);
    r.addEventListener("click", syncAttending);
  });
  window.addEventListener("pageshow", syncAttending);
  syncAttending();

  function renumber() {
    const rows = companions.querySelectorAll(".companion");
    rows.forEach((row, i) => {
      const input = row.querySelector("input");
      input.name = "acompanante_" + (i + 1);
      input.setAttribute("aria-label", "Nombre y apellidos del acompañante " + (i + 1));
    });
    countField.value = rows.length;
    addBtn.hidden = rows.length >= 10;
  }

  addBtn.addEventListener("click", () => {
    const row = document.createElement("div");
    row.className = "companion";
    row.innerHTML = '<input type="text" required placeholder="Nombre y apellidos del acompañante" autocomplete="off">' +
      '<button type="button" class="companion__remove" aria-label="Quitar acompañante">✕</button>';
    row.querySelector("button").addEventListener("click", () => { row.remove(); renumber(); });
    companions.appendChild(row);
    renumber();
    row.querySelector("input").focus();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Enviando...";

    const nombres = Array.from(companions.querySelectorAll("input")).map((i) => i.value.trim()).filter(Boolean);
    const body = new FormData(form);
    body.set("acompanantes_nombres", nombres.join(" · "));

    const datos = Object.fromEntries(new FormData(form));
    datos.acompanantesNombres = nombres;
    datos.acompanantes = nombres.length;
    guardarEnFirestore(datos);

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: body,
        headers: { Accept: "application/json" }
      });

      if (response.ok) {
        status.textContent = "¡Gracias! Hemos recibido tu confirmación.";
        form.reset();
        companions.innerHTML = "";
        renumber();
        syncAttending();
      } else {
        status.textContent = "Ha ocurrido un error. Inténtalo de nuevo en unos minutos.";
      }
    } catch (err) {
      status.textContent = "Ha ocurrido un error de conexión. Inténtalo de nuevo.";
    }
  });
}

/* ---------------------------------------------------------
   INIT
   --------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  applyConfig();
  initNav();
  initReveal();
  initCountdown();
  initRsvp();
});
