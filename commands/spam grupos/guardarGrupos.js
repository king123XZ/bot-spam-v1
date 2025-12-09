const fs = require("fs");
const path = "./groups.json";

// Inicializar JSON si no existe
if(!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify([]));

module.exports = {
    command: ["guardar"], // comando interno automático
    run: async (client, m) => {
        if(!m.isGroup) return; // solo grupos

        let gruposGuardados = JSON.parse(fs.readFileSync(path));
        const grupoId = m.key.remoteJid;

        // Evitar duplicados
        if(!gruposGuardados.find(g => g.id === grupoId)){
            let nombre = grupoId;
            try{
                const metadata = await client.groupMetadata(grupoId);
                nombre = metadata.subject || grupoId;
            }catch{}

            gruposGuardados.push({ id: grupoId, name: nombre });
            fs.writeFileSync(path, JSON.stringify(gruposGuardados, null, 2));

            // Notificar solo a los propietarios
            for(const owner of global.owner){
                await client.sendMessage(`${owner}@c.us`, { text: `✅ Nuevo grupo registrado: ${nombre}` });
            }
        }
    }
};
