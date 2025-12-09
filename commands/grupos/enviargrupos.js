module.exports = {
  command: ["enviaragrupos", "agroups"],
  description: "Enviar imagen/video/documento + texto a todos los grupos",
  isOwner: true,

  run: async (client, m, args) => {
    const sender = m.sender;

    if (!global._enviar) global._enviar = {};

    // Si el proceso NO inició
    if (!global._enviar[sender]) {
      global._enviar[sender] = { step: 1 };
      return m.reply("📤 *Paso 1:* Envíame AHORA una imagen/video/documento (SIN TEXTO).");
    }

    const data = global._enviar[sender];
    const step = data.step;

    // ---------------------------
    // 🔥 PASO 1 → Recibir media
    // ---------------------------
    if (step === 1) {
      const msgType = m.mtype;

      // Tipos válidos
      const validMedia = ["imageMessage", "videoMessage", "documentMessage"];

      if (!validMedia.includes(msgType))
        return m.reply("❌ Debes enviar imagen, video o archivo SIN texto.");

      // Descargar media
      const buffer = await client.downloadMediaMessage(m);

      // Guardar
      data.media = buffer;
      data.mediaType =
        msgType === "imageMessage" ? "image" :
        msgType === "videoMessage" ? "video" : "document";

      data.step = 2;

      return m.reply("📤 *Paso 2:* Envíame ahora el *TEXTO* que llevará el mensaje.");
    }

    // ---------------------------
    // 🔥 PASO 2 → Recibir texto
    // ---------------------------
    if (step === 2) {
      if (!args.length)
        return m.reply("❌ Debes enviar un texto.");

      data.text = args.join(" ");
      data.step = 3;

      return m.reply(
        "📤 *Paso 3:* Escribe:\n\n" +
        "`/enviar` → para enviar a todos los grupos\n" +
        "`/cancelar` → para cancelar"
      );
    }

    // ---------------------------
    // 🔥 PASO 3 → Confirmar envío
    // ---------------------------
    if (step === 3) {
      const option = args[0]?.toLowerCase();

      if (option === "cancelar") {
        delete global._enviar[sender];
        return m.reply("❌ Envío cancelado.");
      }

      if (option !== "enviar")
        return m.reply("❌ Escribe `/enviar` o `/cancelar`.");

      const grupos = global.gruposAuto || [];

      for (const grupo of grupos) {
        try {
          await client.sendMessage(grupo, {
            [data.mediaType]: data.media,
            caption: data.text
          });
        } catch (e) {
          console.log("Error enviando a:", grupo, e);
        }
      }

      delete global._enviar[sender];

      return m.reply("✅ Mensaje enviado a todos los grupos correctamente.");
    }
  }
};

