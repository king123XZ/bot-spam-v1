const axios = require('axios');
const yts = require('yt-search');

module.exports = {
  command: ["ytaudio"],
  description: "Descarga solo el audio de YouTube usando tu API, mejorando búsqueda",
  category: "downloader",
  use: "https://www.youtube.com/",

  run: async (client, m, args) => {

    // ==================================
    // 🔒 PERMISOS (OWNERS + ADMINS)
    // ==================================

    const owners = [
      "51917391317@s.whatsapp.net",
      "51907376960@s.whatsapp.net"
    ];

    const isOwner = owners.includes(m.sender);

    const groupMetadata = m.isGroup ? await client.groupMetadata(m.chat) : {};
    const admins = m.isGroup ? groupMetadata.participants.filter(p => p.admin) : [];
    const isAdmin = admins.some(p => p.id === m.sender);

    if (!isOwner && !isAdmin) {
      return m.reply("🚫 *Solo el OWNER o los ADMINS del grupo pueden usar este comando.*");
    }

    // ==================================
    // 📌 CÓDIGO ORIGINAL
    // ==================================

    if (!args[0]) return m.reply("Ingresa el enlace o nombre de un video de YouTube.");

    await m.reply("⏳ Procesando audio...");

    try {
      let videoUrl = args[0];
      const apiKey = "M8EQKBf7LhgH";

      // Si no es link, buscar por nombre
      if (!videoUrl.startsWith("http")) {
        const { videos } = await yts(videoUrl);
        if (!videos.length) return m.reply("❌ No se encontraron resultados.");
        videoUrl = videos[0].url;
      }

      // Petición a la API
      const res = await axios.get("https://api-sky.ultraplus.click/api/download/yt.js", {
        params: { url: videoUrl, format: "audio" },
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-API-Key": apiKey
        }
      });

      const data = res.data.data;
      if (!data || !data.audio) return m.reply("❌ No se pudo obtener el audio.");

      const caption = `🎵 YouTube Audio\nTítulo: ${data.title}\nDuración: ${data.duration || "Desconocida"}s`;

      await client.sendMessage(
        m.chat,
        {
          audio: { url: data.audio },
          mimetype: "audio/mpeg",
          fileName: `${data.title || "youtube"}.mp3`,
          caption,
          contextInfo: {
            externalAdReply: {
              mediaUrl: videoUrl,
              mediaType: 2,
              description: data.title,
              title: data.title,
              thumbnailUrl: data.thumbnail
            }
          }
        },
        { quoted: m }
      );

    } catch (e) {
      if (e.response) {
        const code = e.response.status;
        if (code === 401) return m.reply("❌ Key inválida o no enviada.");
        if (code === 402) return m.reply("❌ No tienes solicitudes restantes.");
        if (code === 429) return m.reply("❌ Límite de solicitudes alcanzado. Intenta más tarde.");
        if (code === 500) return m.reply("❌ Error interno de la API.");
      }
      console.error("Error al descargar audio de YouTube:", e);
      m.reply("❌ Ocurrió un error al procesar el audio de YouTube.");
    }
  },
};