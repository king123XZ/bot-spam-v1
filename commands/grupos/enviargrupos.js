module.exports = {
  command: ["enviaragrupos", "agroups"],
  description: "Enviar imagen/video/documento + texto a todos los grupos",
  isOwner: true,

  run: async (client, m, args) => {
    const sender = m.sender;

    if (!global._enviar) global._enviar = {};

    // Si NO hay proceso iniciando
    if (!global._enviar[sender]) {
      global._enviar[sender] = { step: 1 };
      return m.reply("📤 *Paso 1:* Envíame AHORA una imagen/video/documento (sin texto).");
    }

    const data = global._enviar[sender];
    const step = data.step;

    // ---------------------------
    // PASO 1 → Recibir media
    // ---------------------------
    if (step === 1) {
      const msgType = m.mtype;

      const allowedTypes = ["imageMessage", "videoMessage", "documentMessage"];
      if (!allowedTypes.includes(msgType))
        return m.reply("❌ Debes enviar una imagen, video o archivo.");

      const buffer = await client.downloadMediaMessage(m);

      data.media = buffer;
      data.mediaType =
        msgType === "imageMessage" ? "image" :
        msgType === "videoMessage" ? "video" : "document";

      data.step = 2;

      return m.reply("📤 *Paso 2:* Envíame el TEXTO que acompañará al envío.");
    }

    // ---------------------------
    // PASO 2 → Recibir texto
    // ---------------------------
    if (step === 2) {
      if (!args.length)
        return m.reply("❌ Debes enviar un texto.");

      data.text = args.join(" ");
      data.step = 3;

      return m.reply("📤 *Paso 3:* Escribe `/enviar` para confirmar o `/cancelar`.");
    }

    // ---------------------------
    // PASO 3 → Confirmación
    // ---------------------------
    if (step === 3) {
      const command = args[0]?.toLowerCase();

      if (command === "cancelar") {
        delete global._enviar[sender];
        return m.reply("❌ Envío cancelado.");
      }

      if (command !== "enviar")
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

      return m.reply("✅ Enviado correctamente a todos los grupos.");
    }
  }
};

