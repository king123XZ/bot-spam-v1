const axios = require('axios');

const API_KEY = 'M8EQKBf7LhgH';
const API_SEARCH = 'https://api-sky.ultraplus.click/api/utilidades/ytsearch.js';
const API_DOWNLOAD = 'https://api-sky.ultraplus.click/api/download/yt.js';

// Servidor alterno
const API_BACKUP = 'https://api-ultra.yersonapis.workers.dev/ytvideo';

module.exports = {
  command: ["ytdoc"],
  description: "Descargar un video de YouTube en documento 360p",

  // ✅ CATEGORÍA DEFINIDA
  category: "downloader",

  run: async (client, m, args) => {
    const chatId = m?.chat || m?.key?.remoteJid;
    if (!chatId) return;

    if (!args[0]) {
      return client.sendMessage(chatId, { text: "⚠️ Ingresa el nombre del video." }, { quoted: m });
    }

    const query = args.join(" ");

    try {
      // Buscar video
      const search = await axios.get(API_SEARCH, {
        params: { q: query },
        headers: { Authorization: `Bearer ${API_KEY}` }
      });

      const result = search.data?.Result?.[0];
      if (!result) {
        return client.sendMessage(chatId, { text: "❌ No se encontró el video." });
      }

      const videoUrl = result.url;
      const titulo = result.titulo || "video";

      await client.sendMessage(chatId, {
        text: `⬇️ *Descargando en 360p:* ${titulo}`
      }, { quoted: m });

      let res;

      // Intento principal (360p)
      try {
        const apiRes = await axios.get(API_DOWNLOAD, {
          params: { 
            url: videoUrl, 
            format: "video",
            quality: "360"
          },
          headers: { Authorization: `Bearer ${API_KEY}` },
          timeout: 15000
        });

        if (!apiRes.data?.data?.video) throw new Error("Video inválido (servidor principal)");

        res = await axios.get(apiRes.data.data.video, {
          responseType: "arraybuffer"
        });

      } catch (err) {
        console.log("⚠ Servidor principal falló → usando backup");

        const backup = await axios.get(API_BACKUP, {
          params: { 
            url: videoUrl,
            quality: "360"
          },
          responseType: "arraybuffer"
        });

        res = backup;
      }

      // Enviar como documento MP4
      await client.sendMessage(
        chatId,
        {
          document: res.data,
          mimetype: "video/mp4",
          fileName: `${titulo} (360p).mp4`,
          caption: `📄🎬 *${titulo} (360p)*`
        },
        { quoted: m }
      );

    } catch (err) {
      console.log("❌ Error final:", err);

      await client.sendMessage(
        chatId,
        { text: "❌ No se pudo descargar el video. Prueba con otro título o URL." },
        { quoted: m }
      );
    }
  }
};

