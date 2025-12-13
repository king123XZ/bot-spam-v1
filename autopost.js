const fs = require("fs");

const DB_PATH = "./data/grupos.json";
const DELAY = 8000;

// ===== preparar DB =====
if (!fs.existsSync("./data")) fs.mkdirSync("./data");
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "[]");

global.gruposAuto = JSON.parse(fs.readFileSync(DB_PATH));

const mensajeAuto = `
🔥 *Mensaje Automático*
Este mensaje se envía solo una vez.
`;

const delay = ms => new Promise(r => setTimeout(r, ms));

// ===== proceso =====
async function autoGuardarYEnviar() {
  if (!global.client || !global.client.user) {
    console.log("⏳ Cliente aún no listo, reintentando...");
    return;
  }

  console.log("🔍 Escaneando grupos...");

  const grupos = await global.client.groupFetchAllParticipating();
  const existentes = new Set(global.gruposAuto.map(g => g.jid));

  const pendientes = Object.values(grupos)
    .filter(g => g.id.endsWith("@g.us"))
    .filter(g => !existentes.has(g.id))
    .map(g => ({
      jid: g.id,
      nombre: g.subject || "Grupo sin nombre",
      enviado: false
    }));

  if (!pendientes.length) {
    console.log("✅ No hay grupos nuevos.");
    return;
  }

  console.log(`📦 Grupos nuevos: ${pendientes.length}`);
  console.log(`⏳ Tiempo estimado: ${Math.ceil(pendientes.length * DELAY / 1000)}s`);

  for (let i = 0; i < pendientes.length; i++) {
    const grupo = pendientes[i];

    try {
      await global.client.sendMessage(grupo.jid, { text: mensajeAuto });

      grupo.enviado = true;
      global.gruposAuto.push(grupo);

      fs.writeFileSync(DB_PATH, JSON.stringify(global.gruposAuto, null, 2));

      console.log(`✅ [${i + 1}/${pendientes.length}] ${grupo.nombre}`);
      await delay(DELAY);

    } catch (e) {
      console.log("❌ Error:", grupo.jid, e.message);
    }
  }

  console.log("🎉 Proceso finalizado.");
}

// ===== esperar a que el bot esté listo =====
setTimeout(autoGuardarYEnviar, 60_000);

module.exports = {};

