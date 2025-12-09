const fetch = require('node-fetch');

module.exports = {
  command: ["tiktok", "tt"],
  description: "Descarga videos de TikTok usando tu API",
  category: "downloader",
  use: "https://www.tiktok.com/",
  run: async (client, m, args) => {
    if (!args[0]) {
      return m.reply(
        "Ingresa el *enlace* de un video de *TikTok*\n\n`Ejemplo`\n!tiktok https://www.tiktok.com/@user/video/123"
      );
    }

    await m.reply("⏳ Procesando tu video...");

    try {
      let videoUrl = args[0];

      // Resolver enlaces cortos de TikTok (vm.tiktok.com)
      if (videoUrl.includes("vm.tiktok.com")) {
        const resRedirect = await fetch(videoUrl, { redirect: "follow" });
        videoUrl = resRedirect.url;
      }

      const apiKey = "M8EQKBf7LhgH"; // Tu API Key
      const apiEndpoint = `https://api-sky.ultraplus.click/api/download/tiktok.js?url=${encodeURIComponent(videoUrl)}`;

      const res = await fetch(apiEndpoint, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "User-Agent": "Mozilla/5.0"
        }
      });

      if (!res.ok) {
        return m.reply(`❌ Error al conectar con la API. Código: ${res.status}`);
      }

      const json = await res.json();

      // Aquí accedemos al objeto correcto que contiene los datos del video
      const videoData = json.data;

      if (!videoData || !videoData.video) {
        console.log("Respuesta completa de la API:", json);
        return m.reply("❌ No se pudo obtener el video. Verifica el enlace.");
      }

      const downloadUrl = videoData.video;
      const caption = `TikTok Downloader\n\nTítulo: ${videoData.title || "Desconocido"}\nAutor: ${videoData.author?.name || "Desconocido"}`;

      await client.sendMessage(
        m.chat,
        {
          video: { url: downloadUrl },
          caption,
          mimetype: "video/mp4",
          fileName: "tiktok.mp4"
        },
        { quoted: m }
      );

    } catch (e) {
      console.error("Error en TikTok:", e);
      m.reply("❌ Ocurrió un error al procesar el video de TikTok");
    }
  },
};


