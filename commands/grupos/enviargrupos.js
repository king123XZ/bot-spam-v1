module.exports = {
  command: ["enviaragrupos", "agroups"],
  description: "Enviar imagen/video/documento + texto a todos los grupos",
  isOwner: true,

  run: async (client, m, args) => {
    const sender = m.sender;

    if (!global._enviar) global._enviar = {};

    // Si NO hay media guardada, el usuario está iniciando el proceso
    if (!global._enviar[sender]) {
      global._enviar[sender] = { step: 1 };
      return m.reply("📤 *Paso 1:* Ahora envíame la imagen/video/documento que quieres enviar.");
    }

    const step = global._enviar[sender].step;

    // Paso 1: Recibir media
    if (step === 1) {
      const mediaObj = m.message.imageMessage ||
                       m.message.videoMessage ||
                       m.message.documentMessage;
      if (!mediaObj) return m.reply("❌ Debes enviar una imagen, video o documento.");

      const buffer = await client.downloadMediaMessage(m);

      global._enviar[sender].media = buffer;
      global._enviar[sender].mediaType = 
        m.message.imageMessage ? "image" :
        m.message.videoMessage ? "video" : "document";

      global._enviar[sender].step = 2;

      return m.reply("📤 *Paso 2:* Ahora envíame el *texto* que acompañará al mensaje.");
    }

    // Paso 2: Recibir texto
    if (step === 2) {
      if (!args || !args.length)
        return m.reply("❌ Necesito un texto para enviar junto a la media.");

      global._enviar[sender].text = args.join(" ");
      global._enviar[sender].step = 3;

      return m.reply(
        "📤 *Paso 3:* Escribe:\n\n" +
        "`/enviar` → para enviar a todos los grupos\n" +
        "`/cancelar` → para cancelar"
      );
    }

    // Paso 3: Esperar confirmación
    if (step === 3) {
      const cmd = args[0]?.toLowerCase();

      if (cmd === "cancelar") {
        delete global._enviar[sender];
        return m.reply("❌ Proceso cancelado.");
      }

      if (cmd !== "enviar") {
        return m.reply("❌ Escribe `/enviar` o `/cancelar`.");
      }

      // Enviar a todos los grupos
      const grupos = global.gruposAuto || [];
      const { media, mediaType, text } = global._enviar[sender];

      for (const grupo of grupos) {
        try {
          await client.sendMessage(grupo, {
            [mediaType]: media,
            caption: text
          });
        } catch (e) {
          console.log("Error enviando a", grupo, e);
        }
      }

      delete global._enviar[sender];

      return m.reply("✅ Mensaje enviado correctamente a todos los grupos.");
    }
  }
};
