const fs = require("fs");

module.exports = {
  command: ["setmensaje", "configmsg"],
  description: "Define el mensaje automático para enviar a los grupos.",
  isOwner: true,

  run: async (client, m, args, { text }) => {
    if (!text) return m.reply("❗ Escribe el mensaje que enviaré a los grupos.");

    const file = "./data/automensaje.json";
    fs.writeFileSync(file, JSON.stringify({ mensaje: text }));

    m.reply("✅ Mensaje automático configurado:\n\n" + text);
  }
};
