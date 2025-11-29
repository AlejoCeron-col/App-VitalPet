// ===== Historial Logic =====

document.addEventListener("DOMContentLoaded", () => {
  loadMascotasFilter()
  loadHistorial()
})

async function loadMascotasFilter() {
  const mascotasRaw = await window.getMascotas()
  const mascotas = Array.isArray(mascotasRaw) ? mascotasRaw : []
  const select = document.getElementById("mascotaFilter")

  const options = await Promise.all(
    mascotas.map(async (m) => {
      const cliente = await window.getClienteById(m.clienteId)
      return `<option value="${m.id}">${window.getSpecieIcon(m.especie)} ${m.nombre} (${cliente?.nombre || "N/A"})</option>`
    }),
  )

  select.innerHTML = '<option value="">Todas las mascotas</option>' + options.join("")
}

async function loadHistorial() {
  const citasRaw = await window.getCitas()
  const citas = Array.isArray(citasRaw) ? citasRaw.filter((c) => c.estado === "completada") : []
  await displayHistorial(citas)
}

async function displayHistorial(citas) {
  const timeline = document.getElementById("historialTimeline")

  if (!citas || citas.length === 0) {
    timeline.innerHTML = '<p class="empty-message">No hay visitas registradas en el historial</p>'
    return
  }

  // Sort by date descending
  citas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  // Group by date
  const grouped = {}
  citas.forEach((cita) => {
    if (!grouped[cita.fecha]) {
      grouped[cita.fecha] = []
    }
    grouped[cita.fecha].push(cita)
  })

  let html = ""

  for (const fecha in grouped) {
    html += `<div class="timeline-date-group">
            <p class="timeline-date">${window.formatDate(fecha)}</p>`

    const items = await Promise.all(
      grouped[fecha].map(async (cita) => {
        const mascota = await window.getMascotaById(cita.mascotaId)
        const cliente = mascota ? await window.getClienteById(mascota.clienteId) : null

        return `
                <div class="timeline-item" onclick="verVisita('${cita.id}')">
                    <div class="timeline-content">
                        <h4>${window.getSpecieIcon(mascota?.especie || "otro")} ${mascota?.nombre || "Mascota no encontrada"}</h4>
                        <p>${cita.motivo}</p>
                        <div class="timeline-meta">
                            <span>Usuario: ${cliente?.nombre || "N/A"}</span>
                            <span>Hora: ${cita.hora}</span>
                        </div>
                    </div>
                </div>
            `
      }),
    )

    html += items.join("")
    html += "</div>"
  }

  timeline.innerHTML = html
}

async function filterHistorial() {
  const mascotaId = document.getElementById("mascotaFilter").value
  const fechaDesde = document.getElementById("fechaDesde").value
  const fechaHasta = document.getElementById("fechaHasta").value

  const citasRaw = await window.getCitas()
  let citas = Array.isArray(citasRaw) ? citasRaw.filter((c) => c.estado === "completada") : []

  if (mascotaId) {
    citas = citas.filter((c) => c.mascotaId === mascotaId)
  }

  if (fechaDesde) {
    citas = citas.filter((c) => c.fecha >= fechaDesde)
  }

  if (fechaHasta) {
    citas = citas.filter((c) => c.fecha <= fechaHasta)
  }

  await displayHistorial(citas)
}

function clearHistorialFilters() {
  document.getElementById("mascotaFilter").value = ""
  document.getElementById("fechaDesde").value = ""
  document.getElementById("fechaHasta").value = ""
  loadHistorial()
}

async function verVisita(citaId) {
  const cita = await window.getCitaById(citaId)
  if (!cita) return

  const mascota = await window.getMascotaById(cita.mascotaId)
  const cliente = mascota ? await window.getClienteById(mascota.clienteId) : null

  const detailsHtml = `
        <div class="visita-header">
            <span class="visita-icon">${window.getSpecieIcon(mascota?.especie || "otro")}</span>
            <div class="visita-info">
                <h3>${mascota?.nombre || "Mascota no encontrada"}</h3>
                <p>${cliente?.nombre || "Cliente no encontrado"}</p>
            </div>
        </div>
        
        <div class="visita-section">
            <h4>Fecha y Hora</h4>
            <p>${window.formatDate(cita.fecha)} a las ${cita.hora}</p>
        </div>
        
        <div class="visita-section">
            <h4>Motivo de la Consulta</h4>
            <p>${cita.motivo}</p>
        </div>
        
        ${
          cita.motivoAplazamiento
            ? `
        <div class="visita-section">
            <h4>Nota de Aplazamiento</h4>
            <p>${cita.motivoAplazamiento}</p>
            <p style="font-size: 0.75rem; color: var(--text-muted);">
                Fecha original: ${window.formatShortDate(cita.fechaOriginal)} a las ${cita.horaOriginal}
            </p>
        </div>
        `
            : ""
        }
        
        <div class="visita-section">
            <h4>Informacion de la Mascota</h4>
            <p>
                <strong>Especie:</strong> ${capitalizeFirst(mascota?.especie || "N/A")}<br>
                <strong>Raza:</strong> ${mascota?.raza || "N/A"}<br>
                <strong>Edad:</strong> ${mascota?.edad ? mascota.edad + " anios" : "N/A"}<br>
                <strong>Peso:</strong> ${mascota?.peso ? mascota.peso + " kg" : "N/A"}
            </p>
        </div>
    `

  document.getElementById("visitaDetails").innerHTML = detailsHtml
  window.openModal("visitaModal")
}

function capitalizeFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

window.loadMascotasFilter = loadMascotasFilter
window.loadHistorial = loadHistorial
window.displayHistorial = displayHistorial
window.filterHistorial = filterHistorial
window.clearHistorialFilters = clearHistorialFilters
window.verVisita = verVisita
