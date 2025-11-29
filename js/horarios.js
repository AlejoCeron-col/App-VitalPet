// ===== Horarios Management Logic =====

const currentWeekStart = getMonday(new Date())

document.addEventListener("DOMContentLoaded", () => {
  loadHorariosConfig()
  loadHolidays()
  updateWeekView()
})

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

async function loadHorariosConfig() {
  const horarios = (await window.getHorarios()) || {}

  // Load general config
  document.getElementById("duracionCita").value = horarios.duracionCita || 30
  document.getElementById("maxCitasDia").value = horarios.maxCitasDia || 20

  // Load schedule grid
  const dias = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]
  const diasLabels = {
    lunes: "Lunes",
    martes: "Martes",
    miercoles: "Miercoles",
    jueves: "Jueves",
    viernes: "Viernes",
    sabado: "Sabado",
    domingo: "Domingo",
  }

  const grid = document.getElementById("scheduleGrid")
  grid.innerHTML = dias
    .map((dia) => {
      const config = horarios.dias?.[dia] || { activo: false, inicio: "09:00", fin: "18:00" }

      return `
            <div class="schedule-row">
                <label>${diasLabels[dia]}</label>
                <input type="time" id="${dia}Inicio" value="${config.inicio}" ${!config.activo ? "disabled" : ""}>
                <input type="time" id="${dia}Fin" value="${config.fin}" ${!config.activo ? "disabled" : ""}>
                <input type="checkbox" id="${dia}Activo" ${config.activo ? "checked" : ""} 
                    onchange="toggleDia('${dia}')">
            </div>
        `
    })
    .join("")
}


function toggleDia(dia) {
  const activo = document.getElementById(`${dia}Activo`).checked
  document.getElementById(`${dia}Inicio`).disabled = !activo
  document.getElementById(`${dia}Fin`).disabled = !activo
}

async function saveHorarios() {
  const dias = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]

  const horarios = {
    duracionCita: Number.parseInt(document.getElementById("duracionCita").value),
    maxCitasDia: Number.parseInt(document.getElementById("maxCitasDia").value),
    dias: {},
  }

  dias.forEach((dia) => {
    horarios.dias[dia] = {
      activo: document.getElementById(`${dia}Activo`).checked,
      inicio: document.getElementById(`${dia}Inicio`).value,
      fin: document.getElementById(`${dia}Fin`).value,
    }
  })

  await window.saveHorariosData(horarios)
  alert("Horarios guardados correctamente")
  await updateWeekView()
}
async function loadHolidays() {
  const festivosRaw = await window.getFestivos()
  const festivos = Array.isArray(festivosRaw) ? festivosRaw : []
  const list = document.getElementById("holidaysList")

  if (festivos.length === 0) {
    list.innerHTML = '<p class="empty-message">No hay dias festivos configurados</p>'
    return
  }

  // Sort by date
  festivos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

  list.innerHTML = festivos
    .map(
      (f) => `
        <div class="holiday-item">
            <div class="holiday-info">
                <span>${window.formatShortDate(f.fecha)}</span>
                <span>${f.motivo || "Sin motivo especificado"}</span>
            </div>
            <button class="btn-danger btn-small" onclick="removeHoliday('${f.id}')">Eliminar</button>
        </div>
    `,
    )
    .join("")
}

async function addHoliday() {
  const fecha = document.getElementById("holidayDate").value
  const motivo = document.getElementById("holidayReason").value

  if (!fecha) {
    alert("Selecciona una fecha")
    return
  }

  await window.addFestivo({ fecha, motivo })
  document.getElementById("holidayDate").value = ""
  document.getElementById("holidayReason").value = ""
  await loadHolidays()
  await updateWeekView()
}

async function removeHoliday(id) {
  if (confirm("Eliminar este dia festivo?")) {
    await window.deleteFestivo(id)
    await loadHolidays()
    await updateWeekView()
  }
}

async function updateWeekView() {
  const horarios = (await window.getHorarios()) || { dias: {} }
  const festivosRaw = await window.getFestivos()
  const festivos = Array.isArray(festivosRaw) ? festivosRaw.map((f) => f.fecha) : []
  const citasRaw = await window.getCitas()
  const citas = Array.isArray(citasRaw) ? citasRaw : []
  const diasSemana = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]
  const diasLabels = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]

  // Update week label
  const weekEnd = new Date(currentWeekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  document.getElementById("weekLabel").textContent =
    `${window.formatShortDate(currentWeekStart.toISOString())} - ${window.formatShortDate(weekEnd.toISOString())}`

  const grid = document.getElementById("weekGrid")
  let html = ""

  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split("T")[0]
    const dayIndex = date.getDay()
    const diaKey = diasSemana[dayIndex]
    const diaConfig = horarios.dias?.[diaKey]

    const isHoliday = festivos.includes(dateStr)
    const isActive = diaConfig?.activo && !isHoliday

    html += `
            <div class="day-column ${isHoliday ? "holiday" : ""}">
                <div class="day-header">
                    <span class="day-name">${diasLabels[dayIndex]}</span>
                    <span class="day-date">${date.getDate()}</span>
                </div>
                <div class="day-slots">
        `

    if (isHoliday) {
      html += '<div class="time-slot occupied">Festivo</div>'
    } else if (!isActive) {
      html += '<div class="time-slot occupied">Cerrado</div>'
    } else {
      // Generate time slots
      const slots = generateTimeSlots(diaConfig.inicio, diaConfig.fin, horarios.duracionCita)
      const citasDelDia = citas.filter((c) => c.fecha === dateStr && c.estado !== "cancelada")
      const horasOcupadas = citasDelDia.map((c) => c.hora)

      slots.forEach((slot) => {
        const isOccupied = horasOcupadas.includes(slot)
        html += `<div class="time-slot ${isOccupied ? "occupied" : "available"}">${slot}</div>`
      })
    }

    html += `
                </div>
            </div>
        `
  }

  grid.innerHTML = html
}

function generateTimeSlots(inicio, fin, duracion) {
  const slots = []
  const [inicioH, inicioM] = inicio.split(":").map(Number)
  const [finH, finM] = fin.split(":").map(Number)

  let currentH = inicioH
  let currentM = inicioM

  while (currentH < finH || (currentH === finH && currentM < finM)) {
    slots.push(`${currentH.toString().padStart(2, "0")}:${currentM.toString().padStart(2, "0")}`)

    currentM += duracion
    if (currentM >= 60) {
      currentH += Math.floor(currentM / 60)
      currentM = currentM % 60
    }
  }

  return slots
}

function previousWeek() {
  currentWeekStart.setDate(currentWeekStart.getDate() - 7)
  updateWeekView()
}

function nextWeek() {
  currentWeekStart.setDate(currentWeekStart.getDate() + 7)
  updateWeekView()
}

window.loadHorariosConfig = loadHorariosConfig
window.toggleDia = toggleDia
window.saveHorarios = saveHorarios
window.loadHolidays = loadHolidays
window.addHoliday = addHoliday
window.removeHoliday = removeHoliday
window.updateWeekView = updateWeekView
window.previousWeek = previousWeek
window.nextWeek = nextWeek
