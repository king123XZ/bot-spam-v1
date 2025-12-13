const fs = require("fs");
const DB_PATH = "./data/grupos.json";

global.gruposAuto = JSON.parse(fs.readFileSync(DB_PATH));

const mensajeAuto = `
🔥 *Mensaje Automático*
Este mensaje se envía SOLO UNA VEZ por grupo.
`;

const intervalo = 300000; // 5 minutos

setInterval(async () => {
  if (!global.client) return;
  if (!global.gruposAuto.length) return;

  for (const grupo of [...global.gruposAuto]) {
    try {
      await global.client.sendMessage(grupo.jid, { text: mensajeAuto });

      console.log("✅ Enviado a:", grupo.nombre);

      // eliminar grupo luego de enviar
      global.gruposAuto = global.gruposAuto.filter(g => g.jid !== grupo.jid);
      fs.writeFileSync(DB_PATH, JSON.stringify(global.gruposAuto, null, 2));

      // delay anti-ban
      await new Promise(r => setTimeout(r, 4000));

    } catch (e) {
      console.log("❌ Error:", grupo.nombre, e.message);
    }
  }
}, intervalo);

console.log("✅ AutoPost activo (modo seguro)");
