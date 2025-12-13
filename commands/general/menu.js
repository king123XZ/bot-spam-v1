module.exports = {
  command: ["menu", "help", "ayuda", "panel"],

  run: async (client, m, { prefix }) => {

    // ============================
    // 🔒 PERMISOS (OWNERS + ADMINS)
    // ============================

    const owners = [
      "51917391317@s.whatsapp.net",
      "51907376960@s.whatsapp.net"
    ];

    const isOwner = owners.includes(m.sender);

    const groupMetadata = m.isGroup
      ? await client.groupMetadata(m.chat)
      : { participants: [] };

    const admins = m.isGroup
      ? groupMetadata.participants.filter(p => p.admin)
      : [];

    const isAdmin = admins.some(p => p.id === m.sender);

    if (!isOwner && !isAdmin) {
      return m.reply("🚫 *Este comando solo puede usarlo el OWNER o los ADMINS del grupo.*");
    }

    // ============================
    // 📌 TEXTO DINÁMICO OWNER
    // ============================

    const ownerMenu = isOwner
      ? `
👑 *MENÚ OWNER*
────────────────
📤 ${prefix}enviar
📋 ${prefix}grupos
`
      : "";

    // ============================
    // 📌 MENÚ PRINCIPAL
    // ============================

    await client.sendMessage(m.chat, {
      image: { url: "https://i.ibb.co/XxdTkYNq/menu.png" },
      caption: `⧼ 𝐘𝐞𝐫𝐓𝐗 𝐁𝐎𝐓 - 𝐌𝐄𝐍𝐔 𝐇𝐀𝐂𝐊𝐄𝐑 ⧽

👤 Usuario: ${m.pushName}
🕶️ Acceso: ${isOwner ? "OWNER" : "ADMIN"}
💻 Sistema: ONLINE
⚡ Versión: 2.0

📂 *MENÚS DISPONIBLES*
────────────────
📥 ${prefix}descargas
🛠 ${prefix}utilidades
🤖 ${prefix}infobot
${ownerMenu}`
    });

    // ============================
    // 🔘 BOTONES
    // ============================

    const buttons = [
      {
        buttonId: `${prefix}descargas`,
        buttonText: { displayText: "📥 Descargas" },
        type: 1
      },
      {
        buttonId: `${prefix}utilidades`,
        buttonText: { displayText: "🛠 Utilidades" },
        type: 1
      },
      {
        buttonId: `${prefix}infobot`,
        buttonText: { displayText: "🤖 InfoBot" },
        type: 1
      }
    ];

    // ➕ BOTONES SOLO OWNER
    if (isOwner) {
      buttons.push(
        {
          buttonId: `${prefix}enviar`,
          buttonText: { displayText: "📤 Enviar a Grupos" },
          type: 1
        },
        {
          buttonId: `${prefix}grupos`,
          buttonText: { displayText: "📋 Listar Grupos" },
          type: 1
        }
      );
    }

    await client.sendMessage(m.chat, {
      text: "🧠 *Selecciona una opción del sistema:*",
      footer: "YerTX Bot • Panel Hacker",
      buttons,
      headerType: 1
    });
  }
};
