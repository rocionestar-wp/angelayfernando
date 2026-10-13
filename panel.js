/* =========================================================
   PANEL PRIVADO — Ángela & Fernando
   Tres pestañas sobre Firestore en tiempo real:
     - Invitados   (solo lectura, viene del formulario RSVP)
     - Proveedores (tabla editable tipo Notion)
     - Mesas       (seating plan visual, arrastrar y soltar)
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Estado en memoria (se actualiza con cada snapshot) ---------- */
  let lastRsvps = [];   // [{id, nombre, apellidos, asistencia, acompanantes, alergias, mensaje, mesa, creado}]
  let lastVendors = [];
  let lastTables = [];  // [{id, nombre, capacidad, x, y}]

  /* ---------- Utilidades ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function seatsFor(r) { return 1 + (Number(r.acompanantes) || 0); }

  function toast(msg) {
    let el = $("#panelToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "panelToast";
      el.className = "panel-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("is-visible");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("is-visible"), 2200);
  }

  function formatFecha(ts) {
    if (!ts || !ts.toDate) return "—";
    return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }).format(ts.toDate());
  }

  /* ---------- Tabs ---------- */
  function initTabs() {
    $all(".panel-tabs__btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        $all(".panel-tabs__btn").forEach((b) => b.classList.remove("is-active"));
        $all(".panel-panel").forEach((p) => p.classList.remove("is-active"));
        btn.classList.add("is-active");
        $("#tab-" + btn.dataset.tab).classList.add("is-active");
      });
    });
  }

  /* =========================================================
     1) INVITADOS
     ========================================================= */
  function renderInvitados() {
    const body = $("#invitadosBody");
    if (!lastRsvps.length) {
      body.innerHTML = '<tr><td colspan="8" class="panel-empty">Todavía no hay confirmaciones.</td></tr>';
    } else {
      body.innerHTML = lastRsvps.map((r) => {
        const asiste = r.asistencia === "Sí";
        const mesa = r.mesa ? (lastTables.find((t) => t.id === r.mesa) || {}).nombre || "—" : "—";
        return (
          "<tr>" +
          "<td>" + escapeHtml(r.nombre) + "</td>" +
          "<td>" + escapeHtml(r.apellidos) + "</td>" +
          "<td><span class=\"panel-badge panel-badge--" + (asiste ? "si" : "no") + "\">" + escapeHtml(r.asistencia || "—") + "</span></td>" +
          "<td>" + (Number(r.acompanantes) || 0) + "</td>" +
          "<td>" + escapeHtml(r.alergias || "—") + "</td>" +
          "<td>" + escapeHtml(r.mensaje || "—") + "</td>" +
          "<td>" + escapeHtml(mesa) + "</td>" +
          "<td>" + formatFecha(r.creado) + "</td>" +
          "</tr>"
        );
      }).join("");
    }

    const confirmados = lastRsvps.filter((r) => r.asistencia === "Sí");
    const noAsisten = lastRsvps.filter((r) => r.asistencia === "No");
    $("#statConfirmados").textContent = confirmados.length;
    $("#statAsistentes").textContent = confirmados.reduce((acc, r) => acc + seatsFor(r), 0);
    $("#statNoAsisten").textContent = noAsisten.length;
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function listenInvitados() {
    if (!window.db) return;
    window.db.collection("rsvps").orderBy("creado", "desc").onSnapshot((snap) => {
      lastRsvps = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      renderInvitados();
      renderSeating();
    }, (err) => console.error("Error leyendo invitados:", err));
  }

  /* =========================================================
     2) PROVEEDORES — tabla editable tipo Notion
     ========================================================= */
  function renderProveedores() {
    const body = $("#proveedoresBody");
    if (!lastVendors.length) {
      body.innerHTML = '<tr><td colspan="6" class="panel-empty">Todavía no has añadido ningún proveedor.</td></tr>';
      return;
    }
    const tpl = $("#plantillaFilaProveedor");
    body.innerHTML = "";
    lastVendors.forEach((v) => {
      const row = tpl.content.firstElementChild.cloneNode(true);
      row.dataset.id = v.id;
      $all("[data-field]", row).forEach((field) => {
        const key = field.dataset.field;
        field.value = v[key] || (key === "estado" ? "En conversación" : "");
        if (field.tagName === "SELECT") field.dataset.value = field.value;

        field.addEventListener("change", () => {
          if (field.tagName === "SELECT") field.dataset.value = field.value;
          window.db.collection("vendors").doc(v.id).update({ [key]: field.value })
            .catch((err) => console.error("No se pudo guardar el proveedor:", err));
        });
      });
      $(".panel-row-delete", row).addEventListener("click", () => {
        if (confirm("¿Eliminar este proveedor?")) {
          window.db.collection("vendors").doc(v.id).delete()
            .catch((err) => console.error("No se pudo eliminar:", err));
        }
      });
      body.appendChild(row);
    });
  }

  function listenProveedores() {
    if (!window.db) return;
    window.db.collection("vendors").orderBy("orden", "asc").onSnapshot((snap) => {
      lastVendors = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      renderProveedores();
    }, (err) => console.error("Error leyendo proveedores:", err));
  }

  function initProveedoresToolbar() {
    $("#btnAddVendor").addEventListener("click", () => {
      if (!window.db) return toast("Firebase no está configurado todavía.");
      window.db.collection("vendors").add({
        categoria: "", nombre: "", estado: "En conversación", contacto: "", notas: "", orden: Date.now()
      }).catch((err) => console.error("No se pudo crear el proveedor:", err));
    });
  }

  /* =========================================================
     3) MESAS — seating plan visual (arrastrar y soltar)
     ========================================================= */
  function occupiedSeats(tableId, excludeGuestId) {
    return lastRsvps
      .filter((r) => r.mesa === tableId && r.id !== excludeGuestId)
      .reduce((acc, r) => acc + seatsFor(r), 0);
  }

  function guestChipHtml(r) {
    return (
      '<div class="guest-chip" data-guest-id="' + r.id + '">' +
      escapeHtml(r.nombre) + " " + escapeHtml(r.apellidos) +
      '<span class="guest-chip__seats">' + seatsFor(r) + (seatsFor(r) === 1 ? " persona" : " personas") + "</span>" +
      "</div>"
    );
  }

  function renderSeating() {
    const canvas = $("#seatingCanvas");
    const pool = $("#chipsSinAsignar");
    if (!canvas || !pool) return;

    const confirmados = lastRsvps.filter((r) => r.asistencia === "Sí");
    const sinAsignar = confirmados.filter((r) => !r.mesa || !lastTables.some((t) => t.id === r.mesa));

    pool.innerHTML = sinAsignar.length
      ? sinAsignar.map(guestChipHtml).join("")
      : '<p class="panel-empty panel-empty--small">Nadie pendiente</p>';

    canvas.innerHTML = lastTables.map((t) => {
      const asignados = confirmados.filter((r) => r.mesa === t.id);
      const ocupadas = asignados.reduce((acc, r) => acc + seatsFor(r), 0);
      const llena = ocupadas >= (Number(t.capacidad) || 0);
      return (
        '<div class="table-card' + (llena ? " is-full" : "") + '" data-table-id="' + t.id + '" style="left:' + (t.x || 5) + '%;top:' + (t.y || 5) + '%">' +
          '<div class="table-card__head">' +
            '<input class="table-card__name" data-table-field="nombre" value="' + escapeHtml(t.nombre) + '">' +
            '<input class="table-card__cap" type="number" min="1" max="24" data-table-field="capacidad" value="' + (t.capacidad || 8) + '">' +
            '<span class="table-card__count">' + ocupadas + "/" + (t.capacidad || 8) + "</span>" +
            '<button class="table-card__delete" type="button" title="Eliminar mesa">✕</button>' +
          "</div>" +
          '<div class="table-card__body">' + asignados.map(guestChipHtml).join("") + "</div>" +
        "</div>"
      );
    }).join("");

    wireTableCardEvents();
    wireGuestChipDragging();
  }

  function wireTableCardEvents() {
    $all(".table-card").forEach((card) => {
      const tableId = card.dataset.tableId;

      $all("[data-table-field]", card).forEach((field) => {
        field.addEventListener("change", () => {
          const key = field.dataset.tableField;
          const value = key === "capacidad" ? Math.max(1, Number(field.value) || 1) : field.value;
          window.db.collection("tables").doc(tableId).update({ [key]: value })
            .catch((err) => console.error("No se pudo actualizar la mesa:", err));
        });
      });

      $(".table-card__delete", card).addEventListener("click", async () => {
        if (!confirm("¿Eliminar esta mesa? Los invitados asignados volverán a \"Sin asignar\".")) return;
        try {
          const batch = window.db.batch();
          lastRsvps.filter((r) => r.mesa === tableId).forEach((r) => {
            batch.update(window.db.collection("rsvps").doc(r.id), { mesa: null });
          });
          batch.delete(window.db.collection("tables").doc(tableId));
          await batch.commit();
        } catch (err) {
          console.error("No se pudo eliminar la mesa:", err);
        }
      });

      // Arrastrar la mesa por su cabecera (fuera de los campos editables)
      const head = $(".table-card__head", card);
      head.addEventListener("pointerdown", (e) => {
        if (e.target.closest("input,button")) return;
        startTableDrag(e, card, tableId);
      });
    });
  }

  function startTableDrag(e, card, tableId) {
    const canvas = $("#seatingCanvas");
    const canvasRect = canvas.getBoundingClientRect();
    const startLeft = card.offsetLeft;
    const startTop = card.offsetTop;
    const startX = e.clientX;
    const startY = e.clientY;
    card.setPointerCapture(e.pointerId);

    function onMove(ev) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let left = startLeft + dx;
      let top = startTop + dy;
      left = Math.max(0, Math.min(left, canvasRect.width - card.offsetWidth));
      top = Math.max(0, Math.min(top, canvasRect.height - card.offsetHeight));
      card.style.left = left + "px";
      card.style.top = top + "px";
    }

    function onUp() {
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerup", onUp);
      const xPct = (card.offsetLeft / canvasRect.width) * 100;
      const yPct = (card.offsetTop / canvasRect.height) * 100;
      window.db.collection("tables").doc(tableId).update({ x: xPct, y: yPct })
        .catch((err) => console.error("No se pudo guardar la posición:", err));
    }

    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerup", onUp, { once: true });
  }

  function wireGuestChipDragging() {
    $all(".guest-chip").forEach((chip) => {
      chip.addEventListener("pointerdown", (e) => startGuestDrag(e, chip));
    });
  }

  function startGuestDrag(e, chip) {
    const guestId = chip.dataset.guestId;
    const sourceTable = chip.closest(".table-card");
    const sourceTableId = sourceTable ? sourceTable.dataset.tableId : null;

    const ghost = chip.cloneNode(true);
    ghost.classList.add("guest-chip--ghost");
    document.body.appendChild(ghost);
    moveGhost(ghost, e.clientX, e.clientY);
    chip.classList.add("is-dragging");

    function onMove(ev) {
      moveGhost(ghost, ev.clientX, ev.clientY);
      $all(".table-card").forEach((c) => c.classList.remove("is-dropready"));
      const under = document.elementFromPoint(ev.clientX, ev.clientY);
      const overTable = under && under.closest(".table-card");
      if (overTable) overTable.classList.add("is-dropready");
    }

    async function onUp(ev) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      ghost.remove();
      chip.classList.remove("is-dragging");
      $all(".table-card").forEach((c) => c.classList.remove("is-dropready"));

      const under = document.elementFromPoint(ev.clientX, ev.clientY);
      const dropTable = under && under.closest(".table-card");
      const dropPool = under && under.closest(".seating__pool");

      const guest = lastRsvps.find((r) => r.id === guestId);
      if (!guest) return;

      if (dropTable) {
        const tableId = dropTable.dataset.tableId;
        const table = lastTables.find((t) => t.id === tableId);
        if (!table) return;
        if (tableId === sourceTableId) return; // soltado en la misma mesa: no hacer nada
        const libres = (Number(table.capacidad) || 0) - occupiedSeats(tableId, guestId);
        if (seatsFor(guest) > libres) {
          toast("Mesa llena: no caben " + seatsFor(guest) + " persona(s) en \"" + table.nombre + "\".");
          return;
        }
        window.db.collection("rsvps").doc(guestId).update({ mesa: tableId })
          .catch((err) => console.error("No se pudo asignar la mesa:", err));
      } else if (dropPool || !under) {
        if (sourceTableId) {
          window.db.collection("rsvps").doc(guestId).update({ mesa: null })
            .catch((err) => console.error("No se pudo quitar de la mesa:", err));
        }
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function moveGhost(ghost, x, y) {
    ghost.style.left = (x - 90) + "px";
    ghost.style.top = (y - 20) + "px";
  }

  function listenMesas() {
    if (!window.db) return;
    window.db.collection("tables").orderBy("creado", "asc").onSnapshot((snap) => {
      lastTables = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      renderSeating();
    }, (err) => console.error("Error leyendo mesas:", err));
  }

  function initMesasToolbar() {
    $("#btnAddTable").addEventListener("click", () => {
      if (!window.db) return toast("Firebase no está configurado todavía.");
      const n = lastTables.length;
      window.db.collection("tables").add({
        nombre: "Mesa " + (n + 1),
        capacidad: 8,
        x: 6 + (n % 4) * 23,
        y: 6 + Math.floor(n / 4) * 30,
        creado: firebase.firestore.FieldValue.serverTimestamp()
      }).catch((err) => console.error("No se pudo crear la mesa:", err));
    });
  }

  /* =========================================================
     INIT
     ========================================================= */
  document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    initProveedoresToolbar();
    initMesasToolbar();

    if (!window.db) {
      $("#firebaseWarning").hidden = false;
      renderInvitados();
      renderProveedores();
      renderSeating();
      return;
    }

    listenInvitados();
    listenProveedores();
    listenMesas();
  });
})();
