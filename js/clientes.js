document.addEventListener("DOMContentLoaded", () => {
  loadClientes()
})

async function loadClientes() {
  const clientes = await window.getClientes()
  const grid = document.getElementById("clientesGrid")

  if (!clientes || clientes.length === 0) {
    grid.innerHTML = '<p class="empty-message">No hay clientes registrados. ¡Agrega el primero!</p>'
    return
  }

  const clientesHtml = await Promise.all(
    clientes.map(async (cliente) => {
      const mascotas = await window.getMascotasByCliente(cliente.id)

      return `
            <div class="client-card">
                <div class="client-header">
                    <div>
                        <h3 class="client-name">${cliente.nombre}</h3>
                        <p class="client-contact">📞 ${cliente.telefono}</p>
                    </div>
                </div>
                <div class="client-body">
                    <p class="pets-title">Mascotas (${mascotas.length})</p>
                    <div class="pets-list">
                        ${
                          mascotas.length > 0
                            ? mascotas
                                .map(
                                  (m) => `
                            <span class="pet-tag">${window.getSpecieIcon(m.especie)} ${m.nombre}</span>
                        `,
                                )
                                .join("")
                            : '<span style="color: var(--text-muted)">Sin mascotas registradas</span>'
                        }
                    </div>
                </div>
                <div class="client-footer">
                    <button class="btn-secondary btn-small" onclick="verCliente('${cliente.id}')">Ver</button>
                    <button class="btn-primary btn-small" onclick="openMascotaModal('${cliente.id}')">+ Mascota</button>
                    <button class="btn-warning btn-small" onclick="editCliente('${cliente.id}')">Editar</button>
                    <button class="btn-danger btn-small" onclick="eliminarCliente('${cliente.id}')">Eliminar</button>
                </div>
            </div>
        `
    }),
  )

  grid.innerHTML = clientesHtml.join("")
}

async function saveClienteForm(event) {
  event.preventDefault()

  const clienteId = document.getElementById("clienteId").value
  const data = {
    nombre: document.getElementById("clienteNombre").value,
    telefono: document.getElementById("clienteTelefono").value,
    email: document.getElementById("clienteEmail").value,
    direccion: document.getElementById("clienteDireccion").value,
  }

  if (clienteId) {
    await window.updateCliente(clienteId, data)
  } else {
    await window.addCliente(data)
  }

  window.closeModal("clienteModal") // Assuming closeModal is a function in another file
  document.getElementById("clienteForm").reset()
  document.getElementById("clienteId").value = ""
  await loadClientes()
}

function editCliente(id) {
  ;(async () => {
    const cliente = await window.getClienteById(id)
    if (!cliente) return

    document.getElementById("clienteId").value = cliente.id
    document.getElementById("clienteNombre").value = cliente.nombre
    document.getElementById("clienteTelefono").value = cliente.telefono
    document.getElementById("clienteEmail").value = cliente.email || ""
    document.getElementById("clienteDireccion").value = cliente.direccion || ""
    document.getElementById("clienteModalTitle").textContent = "Editar Cliente"

    window.openModal("clienteModal") // Assuming openModal is a function in another file
  })()
}

function eliminarCliente(id) {
  ;(async () => {
    const cliente = await window.getClienteById(id)
    if (!cliente) return

    if (confirm(`¿Está seguro de eliminar al cliente "${cliente.nombre}" y todas sus mascotas?`)) {
      await window.deleteCliente(id)
      await loadClientes()
    }
  })()
}

function verCliente(id) {
  ;(async () => {
    const cliente = await window.getClienteById(id)
    const mascotas = await window.getMascotasByCliente(id)

    if (!cliente) return

    const detailsHtml = `
        <div class="detail-section">
            <h3>Información del Cliente</h3>
            <div class="detail-row">
                <span class="detail-label">Nombre:</span>
                <span class="detail-value">${cliente.nombre}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Teléfono:</span>
                <span class="detail-value">${cliente.telefono}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${cliente.email || "No registrado"}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Dirección:</span>
                <span class="detail-value">${cliente.direccion || "No registrada"}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Registrado:</span>
                <span class="detail-value">${window.formatShortDate(cliente.fechaRegistro)}</span> // Assuming formatShortDate is a function in another file
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Mascotas (${mascotas.length})</h3>
            ${
              mascotas.length > 0
                ? mascotas
                    .map(
                      (m) => `
                <div class="pet-card">
                    <div class="pet-card-header">
                        <h4>${window.getSpecieIcon(m.especie)} ${m.nombre}</h4>
                        <div>
                            <button class="btn-warning btn-small" onclick="editMascota('${m.id}')">Editar</button>
                            <button class="btn-danger btn-small" onclick="eliminarMascota('${m.id}', '${id}')">Eliminar</button>
                        </div>
                    </div>
                    <div class="pet-card-info">
                        <span>Especie: ${capitalizeFirst(m.especie)}</span>
                        <span>Raza: ${m.raza || "N/A"}</span>
                        <span>Edad: ${m.edad ? m.edad + " años" : "N/A"}</span>
                        <span>Peso: ${m.peso ? m.peso + " kg" : "N/A"}</span>
                    </div>
                    ${m.notas ? `<p style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-muted)">📝 ${m.notas}</p>` : ""}
                </div>
            `,
                    )
                    .join("")
                : '<p class="empty-message">No hay mascotas registradas</p>'
            }
        </div>
    `

    document.getElementById("clienteDetails").innerHTML = detailsHtml
    window.openModal("verClienteModal") // Assuming openModal is a function in another file
  })()
}

function openMascotaModal(clienteId) {
  document.getElementById("mascotaId").value = ""
  document.getElementById("mascotaClienteId").value = clienteId
  document.getElementById("mascotaModalTitle").textContent = "Nueva Mascota"
  document.getElementById("mascotaForm").reset()
  window.openModal("mascotaModal") // Assuming openModal is a function in another file
}

async function saveMascotaForm(event) {
  event.preventDefault()

  const mascotaId = document.getElementById("mascotaId").value
  const data = {
    clienteId: document.getElementById("mascotaClienteId").value,
    nombre: document.getElementById("mascotaNombre").value,
    especie: document.getElementById("mascotaEspecie").value,
    raza: document.getElementById("mascotaRaza").value,
    edad: document.getElementById("mascotaEdad").value,
    peso: document.getElementById("mascotaPeso").value,
    notas: document.getElementById("mascotaNotas").value,
  }

  if (mascotaId) {
    await window.updateMascota(mascotaId, data)
  } else {
    await window.addMascota(data)
  }

  window.closeModal("mascotaModal") // Assuming closeModal is a function in another file
  document.getElementById("mascotaForm").reset()
  await loadClientes()

  // Refresh client details if open
  if (document.getElementById("verClienteModal").classList.contains("active")) {
    verCliente(data.clienteId)
  }
}

function editMascota(id) {
  ;(async () => {
    const mascota = await window.getMascotaById(id)
    if (!mascota) return

    document.getElementById("mascotaId").value = mascota.id
    document.getElementById("mascotaClienteId").value = mascota.clienteId
    document.getElementById("mascotaNombre").value = mascota.nombre
    document.getElementById("mascotaEspecie").value = mascota.especie
    document.getElementById("mascotaRaza").value = mascota.raza || ""
    document.getElementById("mascotaEdad").value = mascota.edad || ""
    document.getElementById("mascotaPeso").value = mascota.peso || ""
    document.getElementById("mascotaNotas").value = mascota.notas || ""
    document.getElementById("mascotaModalTitle").textContent = "Editar Mascota"

    window.openModal("mascotaModal") // Assuming openModal is a function in another file
  })()
}

function eliminarMascota(mascotaId, clienteId) {
  ;(async () => {
    const mascota = await window.getMascotaById(mascotaId)
    if (!mascota) return

    if (confirm(`¿Está seguro de eliminar a "${mascota.nombre}"?`)) {
      await window.deleteMascota(mascotaId)
      await loadClientes()
      verCliente(clienteId)
    }
  })()
}

function searchClientes() {
  ;(async () => {
    const query = document.getElementById("searchCliente").value.toLowerCase()
    const clientes = await window.getClientes()

    const filtered = (clientes || []).filter(
      (c) =>
        c.nombre.toLowerCase().includes(query) ||
        c.telefono.includes(query) ||
        (c.email && c.email.toLowerCase().includes(query)),
    )

    const grid = document.getElementById("clientesGrid")

    if (filtered.length === 0) {
      grid.innerHTML = '<p class="empty-message">No se encontraron clientes con ese criterio de búsqueda</p>'
      return
    }

    const clientesHtml = await Promise.all(
      filtered.map(async (cliente) => {
        const mascotas = await window.getMascotasByCliente(cliente.id)

        return `
            <div class="client-card">
                <div class="client-header">
                    <div>
                        <h3 class="client-name">${cliente.nombre}</h3>
                        <p class="client-contact">📞 ${cliente.telefono}</p>
                    </div>
                </div>
                <div class="client-body">
                    <p class="pets-title">Mascotas (${mascotas.length})</p>
                    <div class="pets-list">
                        ${
                          mascotas.length > 0
                            ? mascotas
                                .map(
                                  (m) => `
                            <span class="pet-tag">${window.getSpecieIcon(m.especie)} ${m.nombre}</span>
                        `,
                                )
                                .join("")
                            : '<span style="color: var(--text-muted)">Sin mascotas registradas</span>'
                        }
                    </div>
                </div>
                <div class="client-footer">
                    <button class="btn-secondary btn-small" onclick="verCliente('${cliente.id}')">Ver</button>
                    <button class="btn-primary btn-small" onclick="openMascotaModal('${cliente.id}')">+ Mascota</button>
                    <button class="btn-warning btn-small" onclick="editCliente('${cliente.id}')">Editar</button>
                    <button class="btn-danger btn-small" onclick="eliminarCliente('${cliente.id}')">Eliminar</button>
                </div>
            </div>
        `
      }),
    )

    grid.innerHTML = clientesHtml.join("")
  })()
}

function capitalizeFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

window.loadClientes = loadClientes
window.saveClienteForm = saveClienteForm
window.editCliente = editCliente
window.eliminarCliente = eliminarCliente
window.verCliente = verCliente
window.openMascotaModal = openMascotaModal
window.saveMascotaForm = saveMascotaForm
window.editMascota = editMascota
window.eliminarMascota = eliminarMascota
window.searchClientes = searchClientes
