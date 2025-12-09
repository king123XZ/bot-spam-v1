const fs = require("fs");

let estadoEnvio = {};

module.exports = {
    command: ["enviaragrupos"],
    description: "Envía media + texto a todos los grupos con confirmación",
    run: async (client, m) => {

        const sender = (m.key.participant || m.key.remoteJid).replace("@s.whatsapp.net","");
        if(!global.owner.includes(sender)) 
            return m.reply("❌ Solo el owner puede usar este comando.");

        if(!estadoEnvio[sender]) {
            estadoEnvio[sender] = {
                paso: 0,
                mediaBuffer: null,
                mediaType: null,
                caption: ""
            };
        }

        const estado = estadoEnvio[sender];

        // --------------------------
        // PASO 0 → RECIBIR MEDIA
        // --------------------------
        if (estado.paso === 0) {

            const tipos = ["imageMessage","videoMessage","documentMessage"];
            let encontrado = false;

            for (let tipo of tipos) {
                if (m.message[tipo]) {
                    estado.mediaType = tipo.replace("Message","").toLowerCase();
                    
                    try {
                        // Aquí NO usamos m.message directamente → evitamos empty media key
                        const buffer = await client.downloadMediaMessage(m);
                        estado.mediaBuffer = buffer;
                        estado.caption = m.message[tipo].caption || "";
                        encontrado = true;
                    } catch (err) {
                        console.log("Error descargando media:", err);
                        return m.reply("❌ No pude descargar la media, vuelve a enviarla.");
                    }
                }
            }

            if (!encontrado)
                return m.reply("📸 Envíame una imagen, video o documento.\nLuego escribe el comando:\n\n/enviaragrupos");

            estado.paso = 1;
            return m.reply("✅ Media recibida.\nAhora envía el texto que acompañará la imagen o video.");
        }

        // --------------------------
        // PASO 1 → RECIBIR TEXTO
        // --------------------------
        if (estado.paso === 1) {

            if (!m.text)
                return m.reply("✏️ Envíame el texto que acompañará la media.");

            estado.caption = m.text;
            estado.paso = 2;

            // Vista previa
            const previewJid = sender + "@s.whatsapp.net";

            if (estado.mediaType === "image")
                await client.sendMessage(previewJid, { image: estado.mediaBuffer, caption: estado.caption });
            else if (estado.mediaType === "video")
                await client.sendMessage(previewJid, { video: estado.mediaBuffer, caption: estado.caption });
            else
                await client.sendMessage(previewJid, { document: estado.mediaBuffer, mimetype: "application/octet-stream", caption: estado.caption });

            return m.reply(
                "📄 *Vista previa enviada a tu chat privado*\n\n" +
                "✔ Si se ve bien, escribe: /enviar\n" +
                "❌ Para cancelar: /cancelar"
            );
        }

        // --------------------------
        // PASO 2 → CONFIRMAR ENVÍO
        // --------------------------
        if (estado.paso === 2) {

            if (m.text === "/cancelar") {
                estadoEnvio[sender] = null;
                return m.reply("❌ Envío cancelado.");
            }

            if (m.text !== "/enviar")
                return m.reply("⚠️ Escribe /enviar para enviar o /cancelar para cancelar.");

            // Obtener TODOS los grupos automáticamente
            const grupos = await client.groupFetchAllParticipating();
            const ids = Object.values(grupos).map(g => g.id);

            if (ids.length === 0)
                return m.reply("❌ No estoy en ningún grupo.");

            m.reply(`📢 Enviando mensaje a *${ids.length} grupos*...\n⏳ Esto tardará un poco.`);

            // Enviar con retraso anti-baneo
            for (const groupId of ids) {
                try {
                    if (estado.mediaType === "image")
                        await client.sendMessage(groupId, { image: estado.mediaBuffer, caption: estado.caption });
                    else if (estado.mediaType === "video")
                        await client.sendMessage(groupId, { video: estado.mediaBuffer, caption: estado.caption });
                    else
                        await client.sendMessage(groupId, { document: estado.mediaBuffer, caption: estado.caption });

                    await new Promise(r => setTimeout(r, 9000)); // 9 segundos anti-baneo
                } catch (err) {
                    console.log(`Error enviando a ${groupId}:`, err);
                }
            }

            estadoEnvio[sender] = null;
            return m.reply("✅ *Mensaje enviado a todos los grupos correctamente.*");
        }
    }
};

