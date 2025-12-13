module.exports = {
  command: ["enviaragrupos"],
  isOwner: true,

  run: async (client, m) => {
    const sender = m.sender;

    // inicializar memoria global
    global._enviar = global._enviar || {};

    const delay = ms => new Promise(res => setTimeout(res, ms));

    // ============================
    // PASO 1: ACTIVAR MODO ENVÍO
    // ============================
    if (!global._enviar[sender]) {
      global._enviar[sender] = { step: 1 };

      return m.reply(
        "📤 *Modo enviar a grupos activado*\n\n" +
        "Ahora envíame:\n" +
        "👉 Un texto\n" +
        "👉 O una imagen con texto\n\n" +
        "⛔ No envíes comandos."
      );
    }

    // ============================
    // PASO 2: CAPTURAR MENSAJE
    // ============================
    if (global._enviar[sender].step === 1) {
      const imgMsg = m.message?.imageMessage;

      const text =
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        imgMsg?.caption ||
        "";

      if (!imgMsg && !text) {
        return m.reply("⚠️ Envía texto o una imagen con texto.");
      }

      let imageBuffer = null;

      if (imgMsg) {
        imageBuffer = await client.downloadMediaMessage(m);
      }

      global._enviar[sender] = {
        step: 2,
        text,
        image: imageBuffer
      };

      // ============================
      // PASO 3: ENVIAR A GRUPOS
      // ============================
      const groups = Object.keys(
        await client.groupFetchAllParticipating()
      );

      let enviados = 0;

      await m.reply(
        `📡 Enviando a *${groups.length}* grupos\n` +
        `⏱ Retraso: 10 segundos por grupo`
      );

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
          await delay(10_000); // 🛡️ ANTI-BAN
        } catch (e) {
          console.log("❌ Error enviando a", jid, e.message);
        }
      }

      delete global._enviar[sender];

      return m.reply(
        `✅ Enviado correctamente a *${enviados}* grupos.`
      );
    }
  }
};

