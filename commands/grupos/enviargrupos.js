module.exports = {
  command: ["enviaragrupos"],
  isOwner: true,

  run: async (client, m) => {
    const sender = m.sender || m.key.remoteJid;

    // ⏱️ función delay
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // INICIAR PROCESO
    if (!global._enviar[sender]) {
      global._enviar[sender] = { step: 1 };
      return m.reply(
        "📤 *Enviar a grupos activado*\n\n" +
        "Ahora envíame:\n" +
        "👉 Texto o\n👉 Imagen con texto\n\n" +
        "Se reenviará a todos los grupos."
      );
    }

    // PASO 1 → CAPTURAR MENSAJE
    if (global._enviar[sender].step === 1) {
      const imgMsg = m.message?.imageMessage;

      const text =
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        imgMsg?.caption ||
        "";

      if (!imgMsg && !text) {
        return m.reply("⚠️ Envíame texto o una imagen.");
      }

      let imageBuffer = null;

      // 🔥 DESCARGAR IMAGEN COMO BUFFER (CORRECTO)
      if (imgMsg) {
        imageBuffer = await client.downloadMediaMessage(m);
      }

      global._enviar[sender] = {
        step: 2,
        image: imageBuffer,
        text,
      };

      return m.reply(
        "✅ Mensaje recibido.\n" +
        "📡 Enviando a grupos con retraso de *10 segundos* por grupo..."
      );
    }

    // PASO 2 → ENVIAR A TODOS LOS GRUPOS
    if (global._enviar[sender].step === 2) {
      const { image, text } = global._enviar[sender];
      delete global._enviar[sender];
      delete global._enviar_warned?.[sender];

      const groups = Object.keys(
        await client.groupFetchAllParticipating()
      );

      let enviados = 0;

      for (const jid of groups) {
        try {
          if (image) {
            await client.sendMessage(jid, {
              image: image,   // ✅ BUFFER DIRECTO
              caption: text || "",
            });
          } else {
            await client.sendMessage(jid, { text });
          }

          enviados++;

          // ⏳ RETRASO DE 10 SEGUNDOS (ANTI-BAN)
          await delay(10_000);

        } catch (e) {
          console.log("❌ Error enviando:", jid, e.message);
        }
      }

      return m.reply(`📡 Enviado a *${enviados}* grupos con seguridad.`);
    }
  }
};
