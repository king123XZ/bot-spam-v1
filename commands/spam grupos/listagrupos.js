const fs = require("fs");
const path = "./groups.json";

module.exports = {
    command: ["listagrupos"],
    description: "Muestra todos los grupos guardados donde está el bot",
    run: async (client, m) => {
        // Verificar si el remitente es el propietario
        if(!global.owner.includes(m.key.participant?.replace("@s.whatsapp.net","")) && 
           !global.owner.includes(m.key.remoteJid?.replace("@s.whatsapp.net",""))){
            return m.reply("❌ Solo el propietario puede usar este comando.");
        }

        if(!fs.existsSync(path)) return m.reply("❌ No hay grupos guardados.");

        const gruposGuardados = JSON.parse(fs.readFileSync(path));
        if(gruposGuardados.length === 0) return m.reply("❌ No hay grupos guardados.");

        const listaGrupos = gruposGuardados.map((g,i) => `${i+1}. ${g.name}`).join("\n");
        m.reply(`📋 Lista de grupos guardados (${gruposGuardados.length}):\n\n${listaGrupos}`);
    }
};
