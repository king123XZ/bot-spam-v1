const fs = require("fs");

const DB_PATH = "./data/grupos.json";

if (!fs.existsSync("./data")) fs.mkdirSync("./data");
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "[]");

global.gruposAuto = JSON.parse(fs.readFileSync(DB_PATH));

const mensajeAuto = `
🔥 *Mensaje Automático*
Este es un mensaje enviado a todos los grupos detectados.
`;

const intervalo = 300000; // 5 minutos

setInterval(async () => {
  if (!global.client) return;
  if (!global.gruposAuto.length) return;

  console.log("📤 Iniciando envío automático...");

  const pendientes = [...global.gruposAuto];

  for (const grupo of pendientes) {
    try {
      await global.client.sendMessage(grupo, { text: mensajeAuto });
      console.log("✅ Mensaje enviado a:", grupo);

      // 🔥 ELIMINAR GRUPO DESPUÉS DE ENVIAR
      global.gruposAuto = global.gruposAuto.filter(g => g !== grupo);
      fs.writeFileSync(DB_PATH, JSON.stringify(global.gruposAuto, null, 2));

      // ⏳ pequeño delay para evitar spam
      await new Promise(res => setTimeout(res, 3000));

    } catch (e) {
      console.log("❌ Error enviando a", grupo, e.message);
    }
  }
}, intervalo);

console.log("✅ AutoPost iniciado correctamente");
