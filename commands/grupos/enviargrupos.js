module.exports = {
  command: ["enviaragrupos"],
  description: "Envía un mensaje o imagen a todos los grupos",
  isOwner: true,

  run: async (client, m) => {
    const sender = m.sender || m.key.remoteJid;

    // Si NO hay proceso iniciado aún
    if (!global._enviar[sender]) {
      global._enviar[sender] = { step: 1 };
      return m.reply(
        "📤 *Modo enviar a grupos activado*\n\n" +
        "Ahora envíame:\n" +
        "👉 Texto o\n👉 Imagen con texto\n\n" +
        "Y lo reenviaré a todos los grupos."
      );
    }

    // SI YA ESTÁ EN EL PASO 1 → Recibir imagen o texto
    if (global._enviar[sender].step === 1) {

      // Detectar IMAGEN
      const img = m.message?.imageMessage;

      // Detectar TEXTO
      const text =
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        img?.caption ||
        "";

      if (!img && !text) {
        return m.reply("⚠️ Envíame una imagen o texto.");
      }

      // Guardamos el mensaje ORIGINAL
      global._enviar[sender] = {
        step: 2,
        image: img || null,
        text: text || null,
      };

      return m.reply(
        "✅ *Perfecto!*\n\n" +
        "Ahora se va a enviar a todos los grupos…"
      );
    }

    // PASO 2 — Enviar a todos los grupos
    if (global._enviar[sender].step === 2) {
      const { image, text } = global._enviar[sender];

      delete global._enviar[sender];
      delete global._enviar_warned?.[sender];

      const chats = await client.groupFetchAllParticipating();
      const groups = Object.keys(chats);

      let enviados = 0;

      for (let id of groups) {
        try {
          if (image) {
            await client.sendMessage(
              id,
              {
                image: { url: await client.downloadMediaMessage(m) },
                caption: text || "",
              }
            );
          } else {
            await client.sendMessage(id, { text });
          }

          enviados++;
        } catch (e) {
          console.log("Error enviando:", id, e);
        }
      }

      return m.reply(`📡 Mensaje enviado a *${enviados}* grupos.`);
    }
  }
};

