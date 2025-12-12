// server.js (convertido a sqlite3 + async/await)
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..")));

// SQLite DB
const dbPath = path.join(__dirname, "..", "database.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error al conectar a sqlite:", err.message);
  } else {
    console.log("Conectado a la base de datos sqlite.");
  }
});

// Helper Promisified wrappers for sqlite3
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Helper to parse rows (keeps same behavior)
function mapRow(row) {
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.data);
    return {
      ...parsed,
      id: row.id !== undefined && row.id !== null ? row.id.toString() : row.id,
    };
  } catch (e) {
    return { data: row.data, id: row.id };
  }
}

// Initialize DB: create tables and default horario (async IIFE)
(async function initDb() {
  try {
    await run(`CREATE TABLE IF NOT EXISTS clientes (id INTEGER PRIMARY KEY, data TEXT)`);
    await run(`CREATE TABLE IF NOT EXISTS mascotas (id INTEGER PRIMARY KEY, data TEXT)`);
    await run(`CREATE TABLE IF NOT EXISTS citas (id INTEGER PRIMARY KEY, data TEXT)`);
    await run(`CREATE TABLE IF NOT EXISTS festivos (id INTEGER PRIMARY KEY, data TEXT)`);
    await run(`CREATE TABLE IF NOT EXISTS horarios (id TEXT PRIMARY KEY, data TEXT)`);

    const existingHorarios = await get("SELECT data FROM horarios WHERE id = ?", ["config"]);
    if (!existingHorarios) {
      const defaultConfig = {
        duracionCita: 30,
        maxCitasDia: 20,
        dias: {
          lunes: { activo: true, inicio: "09:00", fin: "18:00" },
          martes: { activo: true, inicio: "09:00", fin: "18:00" },
          miercoles: { activo: true, inicio: "09:00", fin: "18:00" },
          jueves: { activo: true, inicio: "09:00", fin: "18:00" },
          viernes: { activo: true, inicio: "09:00", fin: "18:00" },
          sabado: { activo: true, inicio: "09:00", fin: "13:00" },
          domingo: { activo: false, inicio: "00:00", fin: "00:00" },
        },
      };
      await run("INSERT INTO horarios (id, data) VALUES (?, ?)", [
        "config",
        JSON.stringify(defaultConfig),
      ]);
    }
    console.log("Inicialización de tablas completada.");
  } catch (err) {
    console.error("Error inicializando la DB:", err);
  }
})();

// ===== API ROUTES =====

// ----- Clientes -----
app.get("/api/clientes", async (req, res) => {
  try {
    const rows = await all("SELECT id, data FROM clientes");
    res.json(rows.map(mapRow));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/clientes/:id", async (req, res) => {
  try {
    const row = await get("SELECT id, data FROM clientes WHERE id = ?", [req.params.id]);
    const cliente = mapRow(row);
    if (cliente) res.json(cliente);
    else res.status(404).json({ error: "Cliente no encontrado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/clientes", async (req, res) => {
  try {
    const cliente = { ...req.body, fechaRegistro: new Date().toISOString() };
    const info = await run("INSERT INTO clientes (data) VALUES (?)", [JSON.stringify(cliente)]);
    res.json({ ...cliente, id: info.id.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/clientes/:id", async (req, res) => {
  try {
    const { id, _id, ...data } = req.body;
    const updatedData = JSON.stringify(data);
    await run("UPDATE clientes SET data = ? WHERE id = ?", [updatedData, req.params.id]);
    const row = await get("SELECT id, data FROM clientes WHERE id = ?", [req.params.id]);
    res.json(mapRow(row));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/clientes/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await run("DELETE FROM clientes WHERE id = ?", [id]);

    // Delete associated mascotas where mascota.data.clienteId === id
    const mascotas = await all("SELECT id, data FROM mascotas");
    for (const m of mascotas) {
      try {
        const parsed = JSON.parse(m.data);
        if (parsed && parsed.clienteId && parsed.clienteId.toString() === id.toString()) {
          await run("DELETE FROM mascotas WHERE id = ?", [m.id]);
        }
      } catch (e) {
        // ignore parse errors
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----- Mascotas -----
app.get("/api/mascotas", async (req, res) => {
  try {
    const rows = await all("SELECT id, data FROM mascotas");
    res.json(rows.map(mapRow));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/mascotas/:id", async (req, res) => {
  try {
    const row = await get("SELECT id, data FROM mascotas WHERE id = ?", [req.params.id]);
    const mascota = mapRow(row);
    if (mascota) res.json(mascota);
    else res.status(404).json({ error: "Mascota no encontrada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/mascotas/cliente/:clienteId", async (req, res) => {
  try {
    const rows = await all("SELECT id, data FROM mascotas");
    const filtered = rows
      .map(mapRow)
      .filter((m) => m && m.clienteId && m.clienteId.toString() === req.params.clienteId.toString());
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/mascotas", async (req, res) => {
  try {
    const mascota = { ...req.body, fechaRegistro: new Date().toISOString() };
    const info = await run("INSERT INTO mascotas (data) VALUES (?)", [JSON.stringify(mascota)]);
    res.json({ ...mascota, id: info.id.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/mascotas/:id", async (req, res) => {
  try {
    const { id, _id, ...data } = req.body;
    await run("UPDATE mascotas SET data = ? WHERE id = ?", [JSON.stringify(data), req.params.id]);
    const row = await get("SELECT id, data FROM mascotas WHERE id = ?", [req.params.id]);
    res.json(mapRow(row));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/mascotas/:id", async (req, res) => {
  try {
    await run("DELETE FROM mascotas WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----- Citas -----
app.get("/api/citas", async (req, res) => {
  try {
    const rows = await all("SELECT id, data FROM citas");
    res.json(rows.map(mapRow));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/citas/:id", async (req, res) => {
  try {
    const row = await get("SELECT id, data FROM citas WHERE id = ?", [req.params.id]);
    const cita = mapRow(row);
    if (cita) res.json(cita);
    else res.status(404).json({ error: "Cita no encontrada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/citas/fecha/:fecha", async (req, res) => {
  try {
    const rows = await all("SELECT id, data FROM citas");
    const filtered = rows.map(mapRow).filter((c) => c && c.fecha === req.params.fecha);
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/citas/mascota/:mascotaId", async (req, res) => {
  try {
    const rows = await all("SELECT id, data FROM citas");
    const filtered = rows
      .map(mapRow)
      .filter((c) => c && c.mascotaId && c.mascotaId.toString() === req.params.mascotaId.toString());
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/citas", async (req, res) => {
  try {
    const cita = { ...req.body, fechaCreacion: new Date().toISOString(), estado: "pendiente" };
    const info = await run("INSERT INTO citas (data) VALUES (?)", [JSON.stringify(cita)]);
    res.json({ ...cita, id: info.id.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/citas/:id", async (req, res) => {
  try {
    const { id, _id, ...data } = req.body;
    await run("UPDATE citas SET data = ? WHERE id = ?", [JSON.stringify(data), req.params.id]);
    const row = await get("SELECT id, data FROM citas WHERE id = ?", [req.params.id]);
    res.json(mapRow(row));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/citas/:id", async (req, res) => {
  try {
    await run("DELETE FROM citas WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----- Horarios -----
app.get("/api/horarios", async (req, res) => {
  try {
    const row = await get("SELECT data FROM horarios WHERE id = ?", ["config"]);
    res.json(row ? JSON.parse(row.data) : {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/horarios", async (req, res) => {
  try {
    const { _id, ...data } = req.body;
    const json = JSON.stringify(data);
    await run("INSERT OR REPLACE INTO horarios (id, data) VALUES (?, ?)", ["config", json]);
    const row = await get("SELECT data FROM horarios WHERE id = ?", ["config"]);
    res.json(row ? JSON.parse(row.data) : {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----- Festivos -----
app.get("/api/festivos", async (req, res) => {
  try {
    const rows = await all("SELECT id, data FROM festivos");
    res.json(rows.map(mapRow));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/festivos", async (req, res) => {
  try {
    const data = req.body;
    const info = await run("INSERT INTO festivos (data) VALUES (?)", [JSON.stringify(data)]);
    res.json({ ...data, id: info.id.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/festivos/:id", async (req, res) => {
  try {
    await run("DELETE FROM festivos WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve HTML files
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "..", "index.html")));
app.get("/citas", (req, res) => res.sendFile(path.join(__dirname, "..", "citas.html")));
app.get("/clientes", (req, res) => res.sendFile(path.join(__dirname, "..", "clientes.html")));
app.get("/historial", (req, res) => res.sendFile(path.join(__dirname, "..", "historial.html")));
app.get("/horarios", (req, res) => res.sendFile(path.join(__dirname, "..", "horarios.html")));

// Start server
app.listen(PORT, () => {
  console.log(`Servidor VitalPet corriendo en http://localhost:${PORT}`);
});
