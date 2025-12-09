const fetch = require('node-fetch');

module.exports = {
  command: ["spotify"],
  description: "Descarga canciones de Spotify",
  category: "downloader",
  run: async (client, m, args) => {
    const chatId = m.key.remoteJid;
    const text = args.join(" ");
    const pref = global.prefixes?.[0] || ".";

    if (!text) {
      return client.sendMessage(chatId, {
        text: `⚠️ Uso incorrecto del comando.\n📌 Ejemplo: ${pref}spotify https://open.spotify.com/track/3NDEO1QeVlxskfRHHGm7KS`
      }, { quoted: m });
    }

    if (!/^https?:\/\/(www\.)?open\.spotify\.com\/track\//.test(text)) {
      return client.sendMessage(chatId, {
        text: `⚠️ Enlace no válido.\nAsegúrate de ingresar un URL de Spotify válido.`
      }, { quoted: m });
    }

    await client.sendMessage(chatId, { react: { text: '⏳', key: m.key } });

    try {
      const apiUrl = `https://api.neoxr.eu/api/spotify?url=${encodeURIComponent(text)}&apikey=zMqDtV`;
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`API error: ${response.statusText}`);

      const data = await response.json();
      if (!data.status || !data.data || !data.data.url) throw new Error("No se pudo obtener el enlace de descarga.");

      const song = data.data;

      await client.sendMessage(chatId, {
        image: { url: song.thumbnail },
        caption:
          `🎵 Título: ${song.title}\n` +
          `👤 Artista: ${song.artist.name}\n` +
          `⏱️ Duración: ${song.duration}\n` +
          `🔗 Enlace: ${song.url}\n\n────────────\n🎧 devyer`,
        mimetype: 'image/jpeg'
      }, { quoted: m });

      const audioRes = await fetch(song.url);
      if (!audioRes.ok) throw new Error("No se pudo descargar el audio.");

      const audioBuffer = await audioRes.buffer();
      await client.sendMessage(chatId, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        fileName: `${song.title}.mp3`
      }, { quoted: m });

      await client.sendMessage(chatId, { react: { text: '✅', key: m.key } });

    } catch (err) {
      console.error("❌ Error en .spotify:", err);
      await client.sendMessage(chatId, { text: `❌ Error al procesar Spotify:\n_${err.message}_` }, { quoted: m });
      await client.sendMessage(chatId, { react: { text: '❌', key: m.key } });
    }
  }
};
