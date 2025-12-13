module.exports = {
  command: ["enviaragrupos"],
  isOwner: true,

  run: async (client, m) => {
    const sender = m.sender || m.key.remoteJid;
    const delay = ms => new Promise(res => setTimeout(res, ms));

    const body =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      m.message?.imageMessage?.caption ||
      "";

    const isCommand = /^[.!/#/]/.test(body);

    // ==============================
    // 1️⃣ INICIAR PROCESO
    // ==============================
    if (isCommand && body.includes("enviaragrupos") && !global._enviar[sender]) {
      global._enviar[sender] = { waiting: true };

      return m.reply(
        "📤 *Modo enviar a grupos activado*\n\n" +
        "Ahora envíame:\n" +
        "👉 Un texto\n" +
        "👉 O una imagen con texto\n\n" +
        "❌ No envíes comandos."
      );
    }

    // ==============================
    // 2️⃣ ESPERAR MENSAJE REAL
    // ==============================
    if (!global._enviar[sender]?.waiting) return;

    // ❌ ignorar comandos
    if (isCommand) return;

    const imgMsg = m.message?.imageMessage;
    const text = body?.trim();

    if (!imgMsg && !text) {
      return m.reply("⚠️ Envía texto o una imagen.");
    }

    let imageBuffer = null;
    if (imgMsg) {
      imageBuffer = await client.downloadMediaMessage(m);
    }

    // 🔒 cerrar sesión ANTES de enviar
    delete global._enviar[sender];
    delete global._enviar_warned?.[sender];

    const groups = Object.keys(
      await client.groupFetchAllParticipating()
    );

    let enviados = 0;

    await m.reply(
      `📡 Enviando a *${groups.length}* grupos\n` +
      `⏱ Retraso: 10 segundos por grupo`
    );

    // ==============================
    // 3️⃣ ENVÍO CONTROLADO
    // ==============================
    for (const jid of groups) {
      try {
        if (imageBuffer) {
          await client.sendMessage(jid, {
            image: imageBuffer,
            caption: text || ""
          });
        } else {
          await client.sendMessage(jid, { text });
        }

        enviados++;
        await delay(10_000); // 🛡️ anti-ban

      } catch (e) {
        console.log("❌ Error enviando a", jid, e.message);
      }
    }

    return m.reply(`✅ Enviado correctamente a *${enviados}* grupos.`);
  }
};
