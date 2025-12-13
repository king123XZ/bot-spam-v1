module.exports = {
  command: ["menu", "help", "ayuda", "panel"],

  run: async (client, m, { prefix }) => {

    const owners = [
      "51917391317@s.whatsapp.net",
      "51907376960@s.whatsapp.net"
    ];

    if (!owners.includes(m.sender)) {
      return m.reply("🚫 *Este comando solo puede usarlo el OWNER del bot.*");
    }

    // ============================
    // 🔘 BOTONES (LLAMAN COMANDOS)
    // ============================
    const buttons = [
      {
        buttonId: `${prefix}enviaragrupos`,
        buttonText: { displayText: "📤 Enviar a Grupos" },
        type: 1
      },
      {
        buttonId: `${prefix}listargrupos`,
        buttonText: { displayText: "📋 Listar Grupos" },
        type: 1
      }
    ];

    // ============================
    // 📌 MENÚ ÚNICO CON IMAGEN
    // ============================
    await client.sendMessage(m.chat, {
      image: { url: "https://i.ibb.co/XxdTkYNq/menu.png" },
      caption: `⧼ 𝐘𝐞𝐫𝐓𝐗 𝐁𝐎𝐓 ⧽

👤 Usuario: ${m.pushName}
🕶️ Acceso: OWNER
💻 Sistema: ONLINE
⚡ Versión: 1.00

📝 *NOTA IMPORTANTE*
────────────────
Cuando tu número se conecta al servidor, los grupos donde estés se escanean automáticamente y se guardan en la base de datos.

📋 Presiona *Listar Grupos* para verificar que se guardaron correctamente.

👨‍💻 Creador: *dvyer*

🧠 *Selecciona una opción del sistema:*`,
      footer: "YerTX Bot • Panel Hacker",
      buttons,
      headerType: 4
    });
  }
};
