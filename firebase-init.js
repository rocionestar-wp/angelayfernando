/* =========================================================
   Inicializa Firebase una sola vez y lo deja disponible como
   window.db para script.js (RSVP) y panel.js (panel privado).
   Si firebase-config.js todavía tiene los valores de ejemplo,
   window.db queda como null y cada módulo se comporta con
   normalidad pero sin guardar/leer nada en la nube.
   ========================================================= */
(function () {
  const cfg = window.firebaseConfig;
  const sinConfigurar = !cfg || cfg.apiKey === "PEGA_AQUI_TU_API_KEY";

  if (sinConfigurar) {
    console.warn(
      "Firebase no está configurado todavía: rellena firebase-config.js " +
      "(ver INSTRUCCIONES-FIREBASE.md) para activar el panel privado y el " +
      "guardado automático de invitados."
    );
    window.db = null;
    return;
  }

  try {
    firebase.initializeApp(cfg);
    window.db = firebase.firestore();
  } catch (err) {
    console.error("No se pudo inicializar Firebase:", err);
    window.db = null;
  }
})();
