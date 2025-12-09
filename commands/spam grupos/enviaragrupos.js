const fs = require("fs");
const pathGrupos = "./groups.json";

let estadoEnvio = {}; // Guardamos temporalmente la media y texto

module.exports = {
    command: ["enviaragrupos"],
    description: "Enviar media + texto a todos los grupos con vista previa y confirmación",
    run: async (client, m) => {
        const sender = (m.key.participant || m.key.remoteJid).replace("@s.whatsapp.net","");
        if(!global.owner.includes(sender)) return m.reply("❌ Solo el propietario puede usar este comando.");

        if(!fs.existsSync(pathGrupos)) return m.reply("❌ No hay grupos guardados.");
        const gruposGuardados = JSON.parse(fs.readFileSync(pathGrupos)).filter(g => g.id.endsWith("@g.us"));
        if(gruposGuardados.length === 0) return m.reply("❌ No hay grupos guardados.");

        // Estado temporal para este usuario
        if(!estadoEnvio[sender]){
            estadoEnvio[sender] = {
                paso: 0,
                media: null,
                mediaType: null,
                caption: ""
            };
        }

        const estado = estadoEnvio[sender];

        // Paso 0: pedir media
        if(estado.paso === 0){
            const tiposMedia = ["imageMessage","videoMessage","documentMessage"];
            let mediaEncontrada = false;

            for (let tipo of tiposMedia){
                if(m.message[tipo]){
                    estado.mediaType = tipo.replace("Message","").toLowerCase();
                    estado.caption = m.message[tipo].caption || "";
                    try {
                        estado.media = await client.downloadMediaMessage({ message: m.message });
                        mediaEncontrada = true;
                        break;
                    } catch(err){
                        console.log("⚠️ Error descargando media:", err.message);
                        m.reply("❌ No se pudo descargar la media. Intenta de nuevo.");
                        return;
                    }
                }
            }

            if(!mediaEncontrada){
                return m.reply("❌ Por favor envía primero la imagen, video o documento que quieres enviar.");
            }

            estado.paso = 1;
            return m.reply("✅ Media recibida. Ahora envía el texto que acompañará la media.");
        }

        // Paso 1: recibir texto
        if(estado.paso === 1){
            estado.caption = m.text || m.message?.conversation || estado.caption;
            estado.paso = 2;

            // Mostrar vista previa
            let tipo = estado.mediaType;
            let buffer = estado.media;
            let previewMsg = `📄 Vista previa:\nTipo: ${tipo}\nTexto: ${estado.caption}\n\nEscribe /enviar para enviar a todos los grupos o /cancelar para cancelar.`;

            if(tipo === "image") await client.sendMessage(sender+"@s.whatsapp.net",{image:buffer,caption:estado.caption});
            else if(tipo === "video") await client.sendMessage(sender+"@s.whatsapp.net",{video:buffer,caption:estado.caption});
            else if(tipo === "document") await client.sendMessage(sender+"@s.whatsapp.net",{document:buffer,caption:estado.caption});
            else await client.sendMessage(sender+"@s.whatsapp.net",{text:previewMsg});

            await m.reply(previewMsg);
            return;
        }

        // Paso 2: confirmar envío
        if(estado.paso === 2){
            if(m.text === "/enviar"){
                // Filtrar grupos privados y excluidos
                const gruposExcluidos = [
                    "51917391317@s.whatsapp.net",
                    "120363401477412280@g.us"
                ];
                const gruposAEnviar = [];
                const gruposPrivados = [];

                for(const grupo of gruposGuardados){
                    const grupoId = grupo.id;
                    if(gruposExcluidos.includes(grupoId)) continue;

                    try{
                        const metadata = await client.groupMetadata(grupoId);
                        const soyAdmin = metadata.participants.find(p => p.id === sender)?.admin || false;

                        if(metadata.restrict && !soyAdmin){
                            gruposPrivados.push(metadata.subject);
                        } else {
                            gruposAEnviar.push(grupoId);
                        }
                    } catch(err){
                        console.log(`Error metadata ${grupoId}: ${err.message}`);
                    }
                }

                if(gruposPrivados.length>0){
                    await m.reply(`⚠️ No se enviará mensaje a estos grupos (solo admins pueden escribir):\n- ${gruposPrivados.join("\n- ")}`);
                }

                const retraso = 10000;
                for(const grupoId of gruposAEnviar){
                    try{
                        if(estado.media && estado.mediaType){
                            switch(estado.mediaType){
                                case "image": await client.sendMessage(grupoId,{image:estado.media,caption:estado.caption}); break;
                                case "video": await client.sendMessage(grupoId,{video:estado.media,caption:estado.caption}); break;
                                case "document": await client.sendMessage(grupoId,{document:estado.media,caption:estado.caption}); break;
                            }
                        } else {
                            await client.sendMessage(grupoId,{text:estado.caption});
                        }
                        await new Promise(r=>setTimeout(r,retraso));
                    } catch(err){
                        console.log(`Error enviando a ${grupoId}: ${err.message}`);
                    }
                }

                await m.reply("✅ Mensaje enviado a todos los grupos.");
                estadoEnvio[sender] = null; // limpiar estado
                return;

            } else if(m.text === "/cancelar"){
                estadoEnvio[sender] = null;
                return m.reply("❌ Envío cancelado.");
            } else {
                return m.reply("⚠️ Escribe /enviar para enviar o /cancelar para cancelar.");
            }
        }
    }
};
