module.exports = {
  command: ["listargrupos", "grupos"],
  description: "Lista todos los grupos guardados.",
  isOwner: true,

  run: async (client, m) => {
    if (!global.gruposAuto.length)
      return m.reply("⚠️ No hay grupos guardados todavía.");

    let texto = "📌 *Grupos guardados:*\n\n";
    global.gruposAuto.forEach((g, i) => {
      texto += `${i + 1} ➤ ${g}\n`;
    });

    m.reply(texto);
  }
};
