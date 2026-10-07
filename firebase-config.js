/* =========================================================
   CONFIGURACIÓN DE FIREBASE
   =========================================================
   Rellena esto con los datos de TU proyecto de Firebase.
   Instrucciones completas paso a paso en INSTRUCCIONES-FIREBASE.md

   Resumen rápido:
   1. Ve a https://console.firebase.google.com y crea un proyecto (gratis).
   2. Dentro del proyecto: "Compilación" → "Firestore Database" → "Crear base
      de datos" (elige modo producción, región "eur3 (europe-west)").
   3. En el icono de engranaje (⚙️) → "Configuración del proyecto" → baja
      hasta "Tus apps" → pulsa el icono "</>" para añadir una app web.
      Dale un nombre (p. ej. "boda") y NO marques Firebase Hosting.
   4. Firebase te mostrará un objeto firebaseConfig: copia esos valores
      aquí abajo, sustituyendo los de ejemplo.
   5. Ve a Firestore Database → pestaña "Reglas" y pega las reglas que
      encontrarás en INSTRUCCIONES-FIREBASE.md.
   ========================================================= */
window.firebaseConfig = {
  apiKey: "PEGA_AQUI_TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxxxxxxxxxxxxxx"
};
