# VitalPet — Sistema de Gestión Veterinaria

Resumen: aplicación para gestionar clientes, mascotas y citas en una clínica veterinaria. Frontend estático (HTML/CSS/JS) y backend ligero en Node/Express con persistencia en SQLite.

---

## Tecnologías

- Backend: `Node.js`, `Express`, `cors`.
- Base de datos: `SQLite` mediante el paquete `sqlite3`.
- Frontend: HTML estático, `styles.css` y JavaScript (vanilla) dentro de la carpeta `js/` que consume la API REST con `fetch`.

Scripts útiles en `server/`:
- `migrate_from_json.js` — migra datos desde tablas antiguas que guardaban JSON en `data` hacia tablas normalizadas.
- `drop_old_tables.js` — elimina tablas antiguas (destructivo).

---
## Requisitos

- Node.js (v18 o superior)
- SQlite3
---

## Estructura del proyecto

```
index.html
citas.html
clientes.html
historial.html
horarios.html
styles.css
js/        # scripts del frontend (storage.js, citas.js, clientes.js, dashboard.js, historial.js, horarios.js)
server/    # backend (server.js, package.json, database.db)
```

---

## Esquema de la base de datos (normalizado)

Tablas principales:

- `clientes_norm`
   - `id` INTEGER PRIMARY KEY
   - `nombre` TEXT
   - `telefono` TEXT
   - `email` TEXT
   - `direccion` TEXT
   - `fechaRegistro` TEXT (ISO)

- `mascotas_norm`
   - `id` INTEGER PRIMARY KEY
   - `clienteId` INTEGER  (relación con `clientes_norm.id`)
   - `nombre` TEXT
   - `especie` TEXT
   - `raza` TEXT
   - `edad` INTEGER
   - `peso` REAL
   - `notas` TEXT
   - `fechaRegistro` TEXT

- `citas_norm`
   - `id` INTEGER PRIMARY KEY
   - `clienteId` INTEGER
   - `mascotaId` INTEGER
   - `fecha` TEXT (YYYY-MM-DD)
   - `hora` TEXT (HH:MM)
   - `motivo` TEXT
   - `estado` TEXT (`pendiente`, `completada`, `cancelada`, `aplazada`)
   - `fechaCreacion`, `fechaCompletada`, `fechaCancelada` TEXT (ISO)
   - `motivoAplazamiento`, `fechaOriginal`, `horaOriginal` TEXT (opcionales)

- `festivos_norm`
   - `id` INTEGER PRIMARY KEY
   - `fecha` TEXT
   - `descripcion` TEXT

Horarios normalizados:

- `horarios_norm` (config general)
   - `id` TEXT PRIMARY KEY (valor: `config`)
   - `duracionCita` INTEGER
   - `maxCitasDia` INTEGER

- `horarios_dias` (filas por día)
   - `id` INTEGER PRIMARY KEY
   - `horarioId` TEXT (FK a `horarios_norm.id`)
   - `dia` TEXT (`lunes`, `martes`, ...)
   - `activo` INTEGER (0/1)
   - `inicio`, `fin` TEXT (HH:MM)

---

## API REST (endpoints principales)

Clientes

- `GET /api/clientes` — listar clientes
- `GET /api/clientes/:id` — obtener cliente
- `POST /api/clientes` — crear cliente
- `PUT /api/clientes/:id` — actualizar cliente
- `DELETE /api/clientes/:id` — eliminar cliente (y sus mascotas)

Mascotas

- `GET /api/mascotas` — listar mascotas
- `GET /api/mascotas/:id` — obtener mascota
- `GET /api/mascotas/cliente/:clienteId` — mascotas de un cliente
- `POST /api/mascotas` — crear mascota
- `PUT /api/mascotas/:id` — actualizar
- `DELETE /api/mascotas/:id` — eliminar

Citas

- `GET /api/citas` — listar citas
- `GET /api/citas/:id` — obtener cita
- `GET /api/citas/fecha/:fecha` — citas por fecha
- `GET /api/citas/mascota/:mascotaId` — citas por mascota
- `POST /api/citas` — crear cita
- `PUT /api/citas/:id` — actualizar cita
- `DELETE /api/citas/:id` — eliminar cita

Horarios

- `GET /api/horarios` — obtener configuración de horarios
- `PUT /api/horarios` — actualizar configuración (reemplaza `dias`)

Festivos

- `GET /api/festivos` — listar festivos
- `POST /api/festivos` — crear festivo
- `DELETE /api/festivos/:id` — eliminar festivo

---

## Instalación y ejecución

Requisitos: `Node.js` y `npm`.

1. Abrir consola y posicionarse en la carpeta del servidor:

```powershell
cd 'C:\Users\AudaCeron\Desktop\veterinary-appointment-app (7)\server'
npm install
```

2. Iniciar el servidor:

```powershell
npm start
# el servidor por defecto corre en http://localhost:3000
```

3. Abrir la interfaz en el navegador:

- `http://localhost:3000/` — dashboard
- `http://localhost:3000/clientes` — clientes
- `http://localhost:3000/citas` — citas

---