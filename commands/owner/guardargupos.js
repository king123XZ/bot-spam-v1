const fs = require("fs");

const DB_PATH = "./data/grupos.json";

if (!fs.existsSync("./data")) fs.mkdirSync("./data");
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "[]");

module.exports = {
  command: ["guardargupos", "scaneargrupos"],
  isOwner: true,

  run: async (client, m) => {
    // ⛔ asegurar que el bot esté listo
    if (!client.user) {
      return m.reply("⚠️ El bot aún no está listo, intenta en unos segundos.");
    }

    let gruposDB = JSON.parse(fs.readFileSync(DB_PATH));
    const existentes = new Set(gruposDB.map(g => g.jid));

    const grupos = await client.groupFetchAllParticipating();
    let nuevos = 0;

    for (const jid in grupos) {
      // 🔒 FILTRO CLAVE (EVITA EL ERROR)
      if (!jid || typeof jid !== "string") continue;
      if (!jid.endsWith("@g.us")) continue;

      if (existentes.has(jid)) continue;

      const nombre = grupos[jid]?.subject || "Grupo sin nombre";

      gruposDB.push({
        jid,
        nombre,
        enviado: false
      });

      nuevos++;
    }

    fs.writeFileSync(DB_PATH, JSON.stringify(gruposDB, null, 2));
    global.gruposAuto = gruposDB;

    return m.reply(
      `✅ *Escaneo terminado*\n\n` +
      `➕ Grupos nuevos: *${nuevos}*\n` +
      `📦 Total guardados: *${gruposDB.length}*`
    );
  }
};
