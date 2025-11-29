// ===== Dashboard Logic =====

document.addEventListener("DOMContentLoaded", () => {
  loadDashboardData()
  updateCurrentDate()
})

function updateCurrentDate() {
  const dateEl = document.getElementById("currentDate")
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  dateEl.textContent = new Date().toLocaleDateString("es-ES", options)
}

async function loadDashboardData() {
  const clientesRaw = await window.getClientes()
  const mascotasRaw = await window.getMascotas()
  const citasRaw = await window.getCitas()

  const clientes = Array.isArray(clientesRaw) ? clientesRaw : []
  const mascotas = Array.isArray(mascotasRaw) ? mascotasRaw : []
  const citas = Array.isArray(citasRaw) ? citasRaw : []
  const today = new Date().toISOString().split("T")[0]

  // Update stats
  const citasHoy = citas.filter((c) => c.fecha === today && c.estado !== "cancelada")
  const citasPendientes = citas.filter((c) => c.estado === "pendiente")

  document.getElementById("citasHoy").textContent = citasHoy.length
  document.getElementById("totalClientes").textContent = clientes.length
  document.getElementById("totalMascotas").textContent = mascotas.length
  document.getElementById("citasPendientes").textContent = citasPendientes.length

  // Load today's appointments
  await loadTodayAppointments(citasHoy)
}

async function loadTodayAppointments(citas) {
  const container = document.getElementById("citasHoyList")

  if (!citas || citas.length === 0) {
    container.innerHTML = '<p class="empty-message">No hay citas programadas para hoy</p>'
    return
  }

  // Sort by time
  citas.sort((a, b) => a.hora.localeCompare(b.hora))

  const items = await Promise.all(
    citas.map(async (cita) => {
      const mascota = await window.getMascotaById(cita.mascotaId)
      const cliente = mascota ? await window.getClienteById(mascota.clienteId) : null

      return `
            <div class="appointment-item">
                <div class="appointment-info">
                    <h4>${window.getSpecieIcon(mascota?.especie || "otro")} ${mascota?.nombre || "Mascota no encontrada"}</h4>
                    <p>${cliente?.nombre || "Cliente no encontrado"} - ${cita.motivo}</p>
                </div>
                <div class="appointment-time">
                    <span class="time">${cita.hora}</span>
                    <span class="status status-${cita.estado}">${capitalizeFirst(cita.estado)}</span>
                </div>
            </div>
        `
    }),
  )

  container.innerHTML = items.join("")
}

function capitalizeFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

// Placeholder functions for undeclared variables
// Use the storage functions exposed on `window` directly (no wrappers)
