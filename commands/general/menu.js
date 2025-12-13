const axios = require("axios");

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

    const buttons = [
      {
        buttonId: `${prefix}.enviaragrupos`,
        buttonText: { displayText: "📤 Enviar a Grupos" },
        type: 1
      },
      {
        buttonId: `${prefix}.grupos`,
        buttonText: { displayText: "📋 Listar Grupos" },
        type: 1
      },
      {
        buttonId: "https://wa.me/51907376960",
        buttonText: { displayText: "👨‍💻 Contactar Creador" },
        type: 1
      }
    ];

    // 🔥 DESCARGAR IMAGEN COMO BUFFER
    const imageUrl = "https://i.ibb.co/XxdTkYNq/menu.png";
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const imageBuffer = Buffer.from(response.data, "binary");

    // 🔥 MENSAJE ÚNICO CON IMAGEN + TEXTO + BOTONES
    await client.sendMessage(m.chat, {
      image: imageBuffer,
      caption: `⧼ 𝐘𝐞𝐫𝐓𝐗 𝐁𝐎𝐓 ⧽

👤 Usuario: ${m.pushName}
🕶️ Acceso: OWNER
💻 Sistema: ONLINE
⚡ Versión: 1.00

📝 *NOTA IMPORTANTE*
────────────────
Cuando tu número se conecta al servidor, los grupos donde estés se escanean automáticamente y se guardan en la base de datos.

📋 Presione el botón *Listar Grupos* para verificar que se guardaron correctamente.

👨‍💻 Creador: *dvyer*

🧠 *Selecciona una opción del sistema:*`,
      footer: "YerTX Bot • Panel Hacker",
      buttons,
      headerType: 1
    });
  }
};
