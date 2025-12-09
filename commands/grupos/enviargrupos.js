const fs = require("fs");

module.exports = {
  command: ["enviargrupos", "sendgrupos"],
  description: "Envía el mensaje automático a todos los grupos guardados.",
  isOwner: true,

  run: async (client, m) => {
    const file = "./data/automensaje.json";

    if (!fs.existsSync(file))
      return m.reply("⚠️ No hay mensaje configurado. Usa /setmensaje primero.");

    const { mensaje } = JSON.parse(fs.readFileSync(file));

    if (!mensaje)
      return m.reply("⚠️ El mensaje está vacío. Configúralo con /setmensaje.");

    if (!global.gruposAuto.length)
      return m.reply("⚠️ No hay grupos guardados.");

    m.reply("⏳ Enviando mensajes a los grupos...");

    let enviados = 0;

    for (const grupo of global.gruposAuto) {
      try {
        await client.sendMessage(grupo, { text: mensaje });
        enviados++;
      } catch (err) {
        console.log("Error enviando a " + grupo, err);
      }
    }

    m.reply(`✅ Mensaje enviado a *${enviados} grupos*.`);
  }
};
