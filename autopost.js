const fs = require("fs");

if (!fs.existsSync("./data")) fs.mkdirSync("./data");
if (!fs.existsSync("./data/grupos.json")) fs.writeFileSync("./data/grupos.json", "[]");

global.gruposAuto = JSON.parse(fs.readFileSync("./data/grupos.json"));

// Mensaje automático (cámbialo si quieres)
const mensajeAuto = `
🔥 *Mensaje Automático*  
Este es un mensaje enviado a todos los grupos detectados.
`;

// Intervalo en MILISEGUNDOS
// 300000 = 5 minutos
const intervalo = 300000;

setInterval(async () => {
  if (!global.client) return;

  for (let grupo of global.gruposAuto) {
    try {
      await global.client.sendMessage(grupo, { text: mensajeAuto });
      console.log("Mensaje enviado a:", grupo);
    } catch (e) {
      console.log("Error enviando a", grupo, e);
    }
  }
}, intervalo);

console.log("AutoPost iniciado correctamente.");
