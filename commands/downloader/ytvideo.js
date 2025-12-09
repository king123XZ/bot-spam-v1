const axios = require('axios');

const API_KEY = 'M8EQKBf7LhgH';
const API_SEARCH = 'https://api-sky.ultraplus.click/api/utilidades/ytsearch.js';
const API_DOWNLOAD = 'https://api-sky.ultraplus.click/api/download/yt.js';

// Servidor alterno
const API_BACKUP = 'https://api-ultra.yersonapis.workers.dev/ytvideo';

module.exports = {
  command: ["ytvideo"],
  description: "Descargar un video de YouTube",
  category: "downloader",

  run: async (client, m, args) => {
    const chatId = m?.chat || m?.key?.remoteJid;
    if (!chatId) return;

    if (!args[0]) {
      return client.sendMessage(chatId, { text: "⚠️ Ingresa el nombre del video." }, { quoted: m });
    }

    const query = args.join(" ");

    try {
      // 1️⃣ Buscar video
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

      // Notificación (sin mostrar link y sin "buscando")
      await client.sendMessage(chatId, {
        text: `⬇️ *Descargando:* ${titulo}`
      }, { quoted: m });

      let res;

      // 2️⃣ Intento principal
      try {
        const apiRes = await axios.get(API_DOWNLOAD, {
          params: { url: videoUrl, format: "video" },
          headers: { Authorization: `Bearer ${API_KEY}` },
          timeout: 15000
        });

        // Estructura esperada:
        // data.video = enlace del video

        if (!apiRes.data?.data?.video) throw new Error("Video inválido (servidor principal)");

        // Descargar archivo del enlace directo
        res = await axios.get(apiRes.data.data.video, {
          responseType: "arraybuffer"
        });

      } catch (err) {
        console.log("⚠ Servidor principal falló → usando backup");

        // 3️⃣ Servidor alterno
        const backup = await axios.get(API_BACKUP, {
          params: { url: videoUrl },
          responseType: "arraybuffer"
        });

        res = backup;
      }

      // 4️⃣ Enviar archivo mp4
      await client.sendMessage(
        chatId,
        {
          video: res.data,
          mimetype: "video/mp4",
          fileName: `${titulo}.mp4`,
          caption: `🎬 *${titulo}*`
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

