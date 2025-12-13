module.exports = {
  command: ["listargrupos", "grupos"],
  isOwner: true,

  run: async (client, m) => {
    if (!global.gruposAuto || !global.gruposAuto.length) {
      return m.reply("⚠️ No hay grupos guardados.");
    }

    let texto = "📌 *Grupos guardados:*\n\n";
    let contador = 1;
    let actualizado = false;

    for (let i = 0; i < global.gruposAuto.length; i++) {
      let g = global.gruposAuto[i];

      // 🔧 SI ES STRING → CONVERTIR
      if (typeof g === "string") {
        try {
          const meta = await client.groupMetadata(g);
          g = {
            jid: g,
            nombre: meta.subject || "Grupo sin nombre",
            enviado: true
          };
          global.gruposAuto[i] = g;
          actualizado = true;
        } catch {
          g = {
            jid: g,
            nombre: "Grupo desconocido",
            enviado: true
          };
          global.gruposAuto[i] = g;
          actualizado = true;
        }
      }

      // 🔄 SI NO TIENE NOMBRE → BUSCARLO
      if (!g.nombre) {
        try {
          const meta = await client.groupMetadata(g.jid);
          g.nombre = meta.subject || "Grupo sin nombre";
          actualizado = true;
        } catch {
          g.nombre = "Grupo desconocido";
        }
      }

      texto += `${contador}. 🧩 ${g.nombre}\n`;
      texto += `   └─ ${g.jid}\n\n`;
      contador++;
    }

    // 💾 GUARDAR DB ARREGLADA
    if (actualizado) {
      const fs = require("fs");
      fs.writeFileSync(
        "./data/grupos.json",
        JSON.stringify(global.gruposAuto, null, 2)
      );
    }

    m.reply(texto);
  }
};
