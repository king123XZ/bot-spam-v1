// ===========================================
//  AUTO MENSAJES PARA GRUPOS (Baileys)
//  by YerTX2 & ChatGPT
// ===========================================

const fs = require("fs");

module.exports = async function autoMensajes(conn) {

  // Ruta donde guardamos los grupos
  const gruposPath = "./data/grupos.json";

  // Si no existe el archivo lo creamos vacío
  if (!fs.existsSync(gruposPath)) {
    fs.writeFileSync(gruposPath, JSON.stringify([]));
  }

  // Cargar grupos guardados
  let grupos = JSON.parse(fs.readFileSync(gruposPath));

  // Obtener todos los grupos donde está el bot
  let chats = Object.entries(conn.chats)
    .filter(([jid, chat]) => jid.endsWith("@g.us"))
    .map(([jid]) => jid);

  // Guardar grupos nuevos
  chats.forEach(g => {
    if (!grupos.includes(g)) {
      grupos.push(g);
    }
  });

  // Actualizar archivo
  fs.writeFileSync(gruposPath, JSON.stringify(grupos, null, 2));

  console.log("📌 Grupos detectados y guardados:");
  console.log(grupos);

  // Enviar mensaje automático cada 5 minutos (puedes cambiar el tiempo)
  setInterval(() => {
    grupos.forEach(id => {
      conn.sendMessage(id, { text: "🔥 Mensaje automático activo — DVyerBotV1" });
    });
  }, 5 * 60 * 1000); // 5 minutos

};
