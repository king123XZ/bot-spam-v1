const fs = require("fs");

const DB_PATH = "./data/grupos.json";

if (!fs.existsSync("./data")) fs.mkdirSync("./data");
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "[]");

module.exports = {
  command: ["guardargupos", "scaneargrupos"],
  isOwner: true,

  run: async (client, m) => {
    const gruposGuardados = JSON.parse(fs.readFileSync(DB_PATH));

    const existentes = new Set(gruposGuardados.map(g => g.jid));
    const todos = await client.groupFetchAllParticipating();

    let nuevos = 0;

    for (const jid in todos) {
      if (existentes.has(jid)) continue;

      gruposGuardados.push({
        jid,
        nombre: todos[jid].subject
      });

      nuevos++;
    }

    fs.writeFileSync(DB_PATH, JSON.stringify(gruposGuardados, null, 2));
    global.gruposAuto = gruposGuardados;

    m.reply(
      `✅ Escaneo completo\n\n` +
      `📦 Nuevos grupos guardados: *${nuevos}*\n` +
      `📊 Total grupos: *${gruposGuardados.length}*`
    );
  }
};
