const fs = require("fs");

const DB_PATH = "./data/grupos.json";
const DELAY = 8000; // ⏳ 8 segundos (ANTI-BAN SEGURO)

// ====== preparar DB ======
if (!fs.existsSync("./data")) fs.mkdirSync("./data");
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "[]");

global.gruposAuto = JSON.parse(fs.readFileSync(DB_PATH));

const mensajeAuto = `
🔥 *Mensaje Automático*
Este mensaje se envía solo una vez.
`;

const delay = ms => new Promise(r => setTimeout(r, ms));

// ====== PROCESO PRINCIPAL ======
async function autoGuardarYEnviar() {
  if (!global.client?.user) return;

  console.log("🔍 Escaneando grupos...");

  const grupos = await global.client.groupFetchAllParticipating();
  const existentes = new Set(global.gruposAuto.map(g => g.jid));

  const pendientes = [];

  for (const jid in grupos) {
    if (!jid.endsWith("@g.us")) continue;
    if (existentes.has(jid)) continue;

    pendientes.push({
      jid,
      nombre: grupos[jid]?.subject || "Grupo sin nombre",
      enviado: false
    });
  }

  if (!pendientes.length) {
    console.log("✅ No hay grupos nuevos.");
    return;
  }

  const tiempoTotal = Math.ceil((pendientes.length * DELAY) / 1000);

  console.log(`📦 Grupos nuevos: ${pendientes.length}`);
  console.log(`⏳ Tiempo estimado: ${tiempoTotal} segundos`);

  let enviados = 0;

  for (const grupo of pendientes) {
    try {
      await global.client.sendMessage(grupo.jid, { text: mensajeAuto });

      grupo.enviado = true;
      global.gruposAuto.push(grupo);

      fs.writeFileSync(DB_PATH, JSON.stringify(global.gruposAuto, null, 2));

      enviados++;
      console.log(
        `✅ [${enviados}/${pendientes.length}] Enviado → ${grupo.nombre}`
      );

      await delay(DELAY);
    } catch (e) {
      console.log("❌ Error en", grupo.jid, e.message);
    }
  }

  console.log("🎉 Proceso terminado.");
}

// ====== ejecutar SOLO UNA VEZ al iniciar ======
setTimeout(autoGuardarYEnviar, 20_000);

module.exports = {};

