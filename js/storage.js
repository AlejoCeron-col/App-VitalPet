// ===== Storage Functions =====
// This module handles all API operations with MongoDB backend

const API_BASE = "http://localhost:3000/api"

// ===== Clientes =====
async function getClientes() {
  try {
    const response = await fetch(`${API_BASE}/clientes`)
    return await response.json()
  } catch (error) {
    console.error("Error obteniendo clientes:", error)
    return []
  }
}

async function addCliente(cliente) {
  try {
    const response = await fetch(`${API_BASE}/clientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cliente),
    })
    return await response.json()
  } catch (error) {
    console.error("Error agregando cliente:", error)
    return null
  }
}

async function updateCliente(id, data) {
  try {
    const response = await fetch(`${API_BASE}/clientes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return await response.json()
  } catch (error) {
    console.error("Error actualizando cliente:", error)
    return null
  }
}
async function deleteCliente(id) {
  try {
    await fetch(`${API_BASE}/clientes/${id}`, { method: "DELETE" })
    return true
  } catch (error) {
    console.error("Error eliminando cliente:", error)
    return false
  }
}

async function getClienteById(id) {
  try {
    const response = await fetch(`${API_BASE}/clientes/${id}`)
    return await response.json()
  } catch (error) {
    console.error("Error obteniendo cliente:", error)
    return null
  }
}

// ===== Mascotas =====
async function getMascotas() {
  try {
    const response = await fetch(`${API_BASE}/mascotas`)
    return await response.json()
  } catch (error) {
    console.error("Error obteniendo mascotas:", error)
    return []
  }
}

async function addMascota(mascota) {
  try {
    const response = await fetch(`${API_BASE}/mascotas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mascota),
    })
    return await response.json()
  } catch (error) {
    console.error("Error agregando mascota:", error)
    return null
  }
}

async function updateMascota(id, data) {
  try {
    const response = await fetch(`${API_BASE}/mascotas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return await response.json()
  } catch (error) {
    console.error("Error actualizando mascota:", error)
    return null
  }
}

async function deleteMascota(id) {
  try {
    await fetch(`${API_BASE}/mascotas/${id}`, { method: "DELETE" })
    return true
  } catch (error) {
    console.error("Error eliminando mascota:", error)
    return false
  }
}

async function getMascotaById(id) {
  try {
    const response = await fetch(`${API_BASE}/mascotas/${id}`)
    return await response.json()
  } catch (error) {
    console.error("Error obteniendo mascota:", error)
    return null
  }
}

async function getMascotasByCliente(clienteId) {
  try {
    const response = await fetch(`${API_BASE}/mascotas/cliente/${clienteId}`)
    return await response.json()
  } catch (error) {
    console.error("Error obteniendo mascotas del cliente:", error)
    return []
  }
}

// ===== Citas =====
async function getCitas() {
  try {
    const response = await fetch(`${API_BASE}/citas`)
    return await response.json()
  } catch (error) {
    console.error("Error obteniendo citas:", error)
    return []
  }
}

async function addCita(cita) {
  try {
    const response = await fetch(`${API_BASE}/citas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cita),
    })
    return await response.json()
  } catch (error) {
    console.error("Error agregando cita:", error)
    return null
  }
}

async function updateCita(id, data) {
  try {
    const response = await fetch(`${API_BASE}/citas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return await response.json()
  } catch (error) {
    console.error("Error actualizando cita:", error)
    return null
  }
}

async function deleteCita(id) {
  try {
    await fetch(`${API_BASE}/citas/${id}`, { method: "DELETE" })
    return true
  } catch (error) {
    console.error("Error eliminando cita:", error)
    return false
  }
}

async function getCitaById(id) {
  try {
    const response = await fetch(`${API_BASE}/citas/${id}`)
    return await response.json()
  } catch (error) {
    console.error("Error obteniendo cita:", error)
    return null
  }
}

async function getCitasByFecha(fecha) {
  try {
    const response = await fetch(`${API_BASE}/citas/fecha/${fecha}`)
    return await response.json()
  } catch (error) {
    console.error("Error obteniendo citas por fecha:", error)
    return []
  }
}

async function getCitasByMascota(mascotaId) {
  try {
    const response = await fetch(`${API_BASE}/citas/mascota/${mascotaId}`)
    return await response.json()
  } catch (error) {
    console.error("Error obteniendo citas de mascota:", error)
    return []
  }
}

// ===== Horarios =====
async function getHorarios() {
  try {
    const response = await fetch(`${API_BASE}/horarios`)
    return await response.json()
  } catch (error) {
    console.error("Error obteniendo horarios:", error)
    return {}
  }
}

async function saveHorariosData(horarios) {
  try {
    const response = await fetch(`${API_BASE}/horarios`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(horarios),
    })
    return await response.json()
  } catch (error) {
    console.error("Error guardando horarios:", error)
    return null
  }
}

// ===== Festivos =====
async function getFestivos() {
  try {
    const response = await fetch(`${API_BASE}/festivos`)
    return await response.json()
  } catch (error) {
    console.error("Error obteniendo festivos:", error)
    return []
  }
}

async function addFestivo(festivo) {
  try {
    const response = await fetch(`${API_BASE}/festivos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(festivo),
    })
    return await response.json()
  } catch (error) {
    console.error("Error agregando festivo:", error)
    return null
  }
}

async function deleteFestivo(id) {
  try {
    await fetch(`${API_BASE}/festivos/${id}`, { method: "DELETE" })
    return true
  } catch (error) {
    console.error("Error eliminando festivo:", error)
    return false
  }
}

// ===== Utility Functions =====
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function formatDate(dateString) {
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  return new Date(dateString).toLocaleDateString("es-ES", options)
}

function formatShortDate(dateString) {
  return new Date(dateString).toLocaleDateString("es-ES")
}

function getSpecieIcon(especie) {
  const icons = {
    perro: "🐕",
    gato: "🐱",
    ave: "🐦",
    roedor: "🐹",
    reptil: "🦎",
    otro: "🐾",
  }
  return icons[especie] || "🐾"
}

// Modal functions
function openModal(modalId) {
  document.getElementById(modalId).classList.add("active")
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("active")
}

// Expose all functions to window object for HTML onclick handlers
window.getClientes = getClientes
window.addCliente = addCliente
window.updateCliente = updateCliente
window.deleteCliente = deleteCliente
window.getClienteById = getClienteById

window.getMascotas = getMascotas
window.addMascota = addMascota
window.updateMascota = updateMascota
window.deleteMascota = deleteMascota
window.getMascotaById = getMascotaById
window.getMascotasByCliente = getMascotasByCliente

window.getCitas = getCitas
window.addCita = addCita
window.updateCita = updateCita
window.deleteCita = deleteCita
window.getCitaById = getCitaById
window.getCitasByFecha = getCitasByFecha
window.getCitasByMascota = getCitasByMascota

window.getHorarios = getHorarios
window.saveHorariosData = saveHorariosData

window.getFestivos = getFestivos
window.addFestivo = addFestivo
window.deleteFestivo = deleteFestivo

window.formatDate = formatDate
window.formatShortDate = formatShortDate
window.getSpecieIcon = getSpecieIcon

window.openModal = openModal
window.closeModal = closeModal
window.generateId = generateId
