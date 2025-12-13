module.exports = {
  command: ["menu", "help", "ayuda", "panel"],

  run: async (client, m, { prefix }) => {

    // ============================
    // 🔒 PERMISOS (SOLO OWNER)
    // ============================

    const owners = [
      "51917391317@s.whatsapp.net",
      "51907376960@s.whatsapp.net"
    ];

    const isOwner = owners.includes(m.sender);

    if (!isOwner) {
      return m.reply("🚫 *Este comando solo puede usarlo el OWNER del bot.*");
    }

    // ============================
    // 📌 MENÚ PRINCIPAL
    // ============================

    await client.sendMessage(m.chat, {
      image: { url: "https://i.ibb.co/XxdTkYNq/menu.png" },
      caption: `⧼ 𝐘𝐞𝐫𝐓𝐗 𝐁𝐎𝐓 - 𝐌𝐄𝐍𝐔 𝐇𝐀𝐂𝐊𝐄𝐑 ⧽

👤 Usuario: ${m.pushName}
🕶️ Acceso: OWNER
💻 Sistema: ONLINE
⚡ Versión: 2.0

📝 *NOTA IMPORTANTE*
────────────────
Cuando tu número se conecta al servidor, los grupos donde estés se escanean automáticamente y se guardan en la base de datos.

📋 Usa el comando *${prefix}grupos* para verificar que se guardaron correctamente.

👨‍💻 Creador: *dvyer*
`
    });

    // ============================
    // 🔘 BOTONES (SOLO LOS NECESARIOS)
    // ============================

    const buttons = [
      {
        buttonId: `${prefix}enviaragrupos`,
        buttonText: { displayText: "📤 Enviar a Grupos" },
        type: 1
      },
      {
        buttonId: `${prefix}grupos`,
        buttonText: { displayText: "📋 Listar Grupos" },
        type: 1
      },
      {
        buttonId: "https://wa.me/51907376960",
        buttonText: { displayText: "👨‍💻 Contactar Creador" },
        type: 1
      }
    ];

    await client.sendMessage(m.chat, {
      text: "🧠 *Selecciona una opción del sistema:*",
      footer: "YerTX Bot • Panel Hacker",
      buttons,
      headerType: 1
    });
  }
};
