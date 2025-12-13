module.exports = {
  command: ["listargrupos", "grupos"],
  isOwner: true,

  run: async (client, m) => {
    if (!global.gruposAuto.length)
      return m.reply("⚠️ No hay grupos guardados.");

    let texto = "📌 *Grupos guardados:*\n\n";

    global.gruposAuto.forEach((g, i) => {
      texto += `${i + 1}. 🧩 ${g.nombre}\n`;
      texto += `   └─ ${g.jid}\n\n`;
    });

    m.reply(texto);
  }
};
