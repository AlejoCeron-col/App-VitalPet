// ===== Citas Management Logic =====

document.addEventListener("DOMContentLoaded", () => {
  loadCitas()
  loadClientesSelect()
  loadHorasDisponibles()

  // Update available hours when date changes
  const citaFechaInput = document.getElementById("citaFecha")
  const nuevaFechaInput = document.getElementById("nuevaFecha")
  if (citaFechaInput) citaFechaInput.addEventListener("change", () => loadHorasDisponibles("citaHora"))
  if (nuevaFechaInput) nuevaFechaInput.addEventListener("change", () => loadHorasDisponibles("nuevaHora"))

  // Set min date to today
  const today = new Date().toISOString().split("T")[0]
  document.getElementById("citaFecha").setAttribute("min", today)
  document.getElementById("nuevaFecha").setAttribute("min", today)
})

async function loadCitas() {
  const citasRaw = await window.getCitas()
  const citas = Array.isArray(citasRaw) ? citasRaw : []
  const tbody = document.getElementById("citasTableBody")

  if (!citas || citas.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">No hay citas registradas</td>
            </tr>
        `
    return
  }

  // Sort by date and time
  citas.sort((a, b) => {
    if (a.fecha === b.fecha) {
      return a.hora.localeCompare(b.hora)
    }
    return b.fecha.localeCompare(a.fecha)
  })

  const citasHtml = await Promise.all(
    citas.map(async (cita) => {
      const mascota = await window.getMascotaById(cita.mascotaId)
      const cliente = mascota ? await window.getClienteById(mascota.clienteId) : null

      return `
            <tr>
                <td>${window.formatShortDate(cita.fecha)}</td>
                <td>${cita.hora}</td>
                <td>${cliente?.nombre || "N/A"}</td>
                <td>${window.getSpecieIcon(mascota?.especie || "otro")} ${mascota?.nombre || "N/A"}</td>
                <td>${cita.motivo.substring(0, 30)}${cita.motivo.length > 30 ? "..." : ""}</td>
                <td><span class="status status-${cita.estado}">${capitalizeFirst(cita.estado)}</span></td>
                <td class="actions">
                    ${
                      cita.estado === "pendiente"
                        ? `
                        <button class="btn-success btn-small" onclick="completarCita('${cita.id}')">Completar</button>
                        <button class="btn-warning btn-small" onclick="openAplazarModal('${cita.id}')">Aplazar</button>
                        <button class="btn-danger btn-small" onclick="cancelarCita('${cita.id}')">Cancelar</button>
                    `
                        : ""
                    }
                </td>
            </tr>
        `
    }),
  )

  tbody.innerHTML = citasHtml.join("")
}

async function loadClientesSelect() {
  const clientesRaw = await window.getClientes()
  const clientes = Array.isArray(clientesRaw) ? clientesRaw : []
  const select = document.getElementById("clienteSelect")

  select.innerHTML =
    '<option value="">Seleccionar cliente...</option>' +
    clientes.map((c) => `<option value="${c.id}">${c.nombre}</option>`).join("")
}

async function loadMascotasCliente() {
  const clienteId = document.getElementById("clienteSelect").value
  const select = document.getElementById("mascotaSelect")

  if (!clienteId) {
    select.innerHTML = '<option value="">Seleccionar mascota...</option>'
    return
  }

  const mascotasRaw = await window.getMascotasByCliente(clienteId)
  const mascotas = Array.isArray(mascotasRaw) ? mascotasRaw : []
  select.innerHTML =
    '<option value="">Seleccionar mascota...</option>' +
    mascotas.map((m) => `<option value="${m.id}">${window.getSpecieIcon(m.especie)} ${m.nombre}</option>`).join("")
}

async function loadHorasDisponibles(selectId = "citaHora") {
  const horarios = (await window.getHorarios()) || {}
  const select = document.getElementById(selectId)
  const duracion = horarios.duracionCita || 30

  const horas = []

  // Generate time slots based on default schedule
  for (let h = 9; h < 18; h++) {
    for (let m = 0; m < 60; m += duracion) {
      const hora = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
      horas.push(hora)
    }
  }
  // Determine which date input corresponds to this select
  const dateInputId = selectId === "citaHora" ? "citaFecha" : "nuevaFecha"
  const fecha = document.getElementById(dateInputId)?.value

  if (!fecha) {
    select.innerHTML = '<option value="">Selecciona fecha primero</option>'
    select.disabled = true
    return
  }

  select.disabled = false

  // Get occupied hours for that date
  const citasRaw = await window.getCitas()
  const citas = Array.isArray(citasRaw) ? citasRaw : []

  // Exclude current cita if editing/aplazando
  const currentCitaId = (selectId === "nuevaHora" ? document.getElementById("aplazarCitaId") : document.getElementById("citaId"))?.value

  const horasOcupadas = (citas || [])
    .filter((c) => c.fecha === fecha && c.estado !== "cancelada" && c.id !== currentCitaId)
    .map((c) => c.hora)

  const disponibles = horas.filter((h) => !horasOcupadas.includes(h))

  if (disponibles.length === 0) {
    select.innerHTML = '<option value="">No hay horas disponibles para esta fecha</option>'
    return
  }

  select.innerHTML = '<option value="">Seleccionar hora...</option>' + disponibles.map((h) => `<option value="${h}">${h}</option>`).join("")
}

async function saveCita(event) {
  event.preventDefault()

  const citaId = document.getElementById("citaId").value
  const data = {
    clienteId: document.getElementById("clienteSelect").value,
    mascotaId: document.getElementById("mascotaSelect").value,
    fecha: document.getElementById("citaFecha").value,
    hora: document.getElementById("citaHora").value,
    motivo: document.getElementById("citaMotivo").value,
  }

  if (citaId) {
    // Check conflict excluding current cita
    const existing = await window.getCitas()
    const conflict = (existing || []).find((c) => c.id !== citaId && c.fecha === data.fecha && c.hora === data.hora && c.estado !== 'cancelada')
    if (conflict) {
      alert('Ya existe otra cita en la misma fecha y hora. Elige otra hora.')
      return
    }

    await window.updateCita(citaId, data)
  } else {
    // Check conflict when creating
    const existing = await window.getCitas()
    const conflict = (existing || []).find((c) => c.fecha === data.fecha && c.hora === data.hora && c.estado !== 'cancelada')
    if (conflict) {
      alert('Ya existe otra cita en la misma fecha y hora. Elige otra hora.')
      return
    }

    await window.addCita(data)
  }

  window.closeModal("citaModal")
  document.getElementById("citaForm").reset()
  await loadCitas()
}

function openAplazarModal(citaId) {
  document.getElementById("aplazarCitaId").value = citaId
  loadHorasDisponibles("nuevaHora")
  window.openModal("aplazarModal")
}

async function aplazarCita(event) {
  event.preventDefault()

  const citaId = document.getElementById("aplazarCitaId").value
  const nuevaFecha = document.getElementById("nuevaFecha").value
  const nuevaHora = document.getElementById("nuevaHora").value
  const motivo = document.getElementById("motivoAplazamiento").value

  const cita = await window.getCitaById(citaId)
  if (cita) {
    // Before aplazar, check for conflicts
    const existing = await window.getCitas()
    const conflict = (existing || []).find((c) => c.id !== citaId && c.fecha === nuevaFecha && c.hora === nuevaHora && c.estado !== 'cancelada')
    if (conflict) {
      alert('No se puede aplazar: ya existe otra cita en la misma fecha y hora.')
      return
    }

    await window.updateCita(citaId, {
      fecha: nuevaFecha,
      hora: nuevaHora,
      estado: "aplazada",
      motivoAplazamiento: motivo,
      fechaOriginal: cita.fecha,
      horaOriginal: cita.hora,
    })
  }

  window.closeModal("aplazarModal")
  document.getElementById("aplazarForm").reset()
  await loadCitas()
}

async function completarCita(citaId) {
  if (confirm("Marcar esta cita como completada?")) {
    await window.updateCita(citaId, { estado: "completada", fechaCompletada: new Date().toISOString() })
    await loadCitas()
  }
}

async function cancelarCita(citaId) {
  if (confirm("Esta seguro de cancelar esta cita?")) {
    await window.updateCita(citaId, { estado: "cancelada", fechaCancelada: new Date().toISOString() })
    await loadCitas()
  }
}

async function filterCitas() {
  const fecha = document.getElementById("filterDate").value
  const estado = document.getElementById("filterStatus").value

  let citasRaw = await window.getCitas()
  let citas = Array.isArray(citasRaw) ? citasRaw : []

  if (fecha) {
    citas = citas.filter((c) => c.fecha === fecha)
  }

  if (estado) {
    citas = citas.filter((c) => c.estado === estado)
  }

  const tbody = document.getElementById("citasTableBody")

  if (citas.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">No se encontraron citas con los filtros aplicados</td>
            </tr>
        `
    return
  }

  citas.sort((a, b) => {
    if (a.fecha === b.fecha) {
      return a.hora.localeCompare(b.hora)
    }
    return b.fecha.localeCompare(a.fecha)
  })

  const citasHtml = await Promise.all(
    citas.map(async (cita) => {
      const mascota = await window.getMascotaById(cita.mascotaId)
      const cliente = mascota ? await window.getClienteById(mascota.clienteId) : null

      return `
            <tr>
                <td>${window.formatShortDate(cita.fecha)}</td>
                <td>${cita.hora}</td>
                <td>${cliente?.nombre || "N/A"}</td>
                <td>${window.getSpecieIcon(mascota?.especie || "otro")} ${mascota?.nombre || "N/A"}</td>
                <td>${cita.motivo.substring(0, 30)}${cita.motivo.length > 30 ? "..." : ""}</td>
                <td><span class="status status-${cita.estado}">${capitalizeFirst(cita.estado)}</span></td>
                <td class="actions">
                    ${
                      cita.estado === "pendiente"
                        ? `
                        <button class="btn-success btn-small" onclick="completarCita('${cita.id}')">Completar</button>
                        <button class="btn-warning btn-small" onclick="openAplazarModal('${cita.id}')">Aplazar</button>
                        <button class="btn-danger btn-small" onclick="cancelarCita('${cita.id}')">Cancelar</button>
                    `
                        : ""
                    }
                </td>
            </tr>
        `
    }),
  )

  tbody.innerHTML = citasHtml.join("")
}

async function clearFilters() {
  document.getElementById("filterDate").value = ""
  document.getElementById("filterStatus").value = ""
  await loadCitas()
}

function capitalizeFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function openCitaModal() {
  document.getElementById("citaId").value = ""
  document.getElementById("citaModalTitle").textContent = "Nueva Cita"
  document.getElementById("citaForm").reset()
  window.openModal("citaModal")
}

window.loadCitas = loadCitas
window.loadClientesSelect = loadClientesSelect
window.loadMascotasCliente = loadMascotasCliente
window.loadHorasDisponibles = loadHorasDisponibles
window.saveCita = saveCita
window.openAplazarModal = openAplazarModal
window.aplazarCita = aplazarCita
window.completarCita = completarCita
window.cancelarCita = cancelarCita
window.filterCitas = filterCitas
window.clearFilters = clearFilters
window.openCitaModal = openCitaModal

// Delete all citas except those in 'pendiente' state
async function clearNonPendingCitas() {
  if (!confirm('¿Eliminar todas las citas que no estén en pendiente? Esta acción no se puede deshacer.')) return

  const citasRaw = await window.getCitas()
  const citas = Array.isArray(citasRaw) ? citasRaw : []

  const toDelete = citas.filter((c) => c.estado !== 'pendiente')
  if (toDelete.length === 0) {
    alert('No hay citas para eliminar.')
    return
  }

  // Delete sequentially to avoid overwhelming backend
  for (const cita of toDelete) {
    try {
      await window.deleteCita(cita.id)
    } catch (err) {
      console.error('Error eliminando cita:', cita.id, err)
    }
  }

  await loadCitas()
  alert(`Se eliminaron ${toDelete.length} citas.`)
}
