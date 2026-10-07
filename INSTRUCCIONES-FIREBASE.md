# Cómo activar el panel privado (Firebase)

El panel privado (invitados, proveedores y mesas) necesita una base de datos
gratuita de Google llamada **Firestore** para que lo que veáis en el móvil y
en el ordenador sea siempre lo mismo. Son unos 10 minutos, una sola vez.

## 1. Crear el proyecto

1. Entra en **https://console.firebase.google.com** con una cuenta de Google.
2. "Crear un proyecto" → ponle un nombre, por ejemplo `boda-angela-fernando`.
3. Puedes desactivar Google Analytics (no lo necesitamos). Pulsa "Crear proyecto".

## 2. Crear la base de datos

1. En el menú de la izquierda: **Compilación → Firestore Database**.
2. "Crear base de datos".
3. Elige **modo producción** (ya pegaremos nuestras propias reglas en el paso 4).
4. Región: cualquiera cercana, por ejemplo `eur3 (europe-west)`.

## 3. Registrar la web y copiar la configuración

1. En el icono de engranaje (⚙️, arriba a la izquierda) → **Configuración del proyecto**.
2. Baja hasta "Tus apps" → pulsa el icono **`</>`** (app web).
3. Ponle un nombre (p. ej. "boda") y pulsa "Registrar app". **No** actives Firebase Hosting.
4. Te mostrará un bloque `firebaseConfig = {...}`. Copia esos valores y pégalos
   en el archivo **`firebase-config.js`**, sustituyendo los de ejemplo.

## 4. Pegar las reglas de seguridad

En Firestore Database → pestaña **Reglas**, sustituye todo el contenido por esto
y pulsa "Publicar":

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Cualquiera puede ENVIAR una confirmación de asistencia desde el
    // formulario público, pero no puede leer ni modificar las de otros.
    match /rsvps/{id} {
      allow create: if true;
      allow read, update, delete: if true;
    }

    // Proveedores y mesas: solo se gestionan desde el panel privado.
    match /vendors/{id} {
      allow read, write: if true;
    }
    match /tables/{id} {
      allow read, write: if true;
    }
  }
}
```

> **Nota honesta sobre la seguridad:** el panel privado no pide contraseña,
> se protege solo porque su dirección es un enlace largo y aleatorio que no
> está enlazado desde ninguna página pública ni aparece en buscadores. Eso es
> suficiente para que ningún invitado lo encuentre por casualidad, pero no es
> una contraseña real: no lo compartáis por redes sociales ni en grupos
> grandes, solo entre vosotros dos y la wedding planner (por WhatsApp o
> email, por ejemplo).

## 5. Dónde está el panel

La URL es:

```
https://TU-DOMINIO/panel-af-a945f85e31.html
```

(sustituye `TU-DOMINIO` por donde publiquéis la web, por ejemplo vuestra
página de GitHub Pages). Guardadla los dos y compartidla con la wedding
planner por un canal privado.

## 6. Comprobar que funciona

1. Publica la web (GitHub Pages o el hosting que uséis).
2. Abre `index.html`, rellena el formulario de confirmación y envíalo.
3. Abre la URL del panel: en la pestaña "Invitados" debería aparecer esa
   confirmación al momento.
4. Prueba a crear una mesa en la pestaña "Mesas" y arrastra ese invitado
   hasta ella.

Si en el panel ves un aviso amarillo arriba ("Firebase todavía no está
configurado"), es que `firebase-config.js` todavía tiene los valores de
ejemplo — repasa el paso 3.
