require("./settings");
require("./lib/database");
require("./autopost"); // ✅ autopost activo

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  jidDecode,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const chalk = require("chalk");
const fs = require("fs");
const readline = require("readline");
const os = require("os");
const { Boom } = require("@hapi/boom");
const { exec } = require("child_process");
const { smsg } = require("./lib/message");
const mainHandler = require("./main");

// ========================
//   SISTEMA DE GRUPOS
// ========================
const gruposFile = "./data/grupos.json";
if (!fs.existsSync("./data")) fs.mkdirSync("./data");
if (!fs.existsSync(gruposFile)) fs.writeFileSync(gruposFile, "[]");

global.gruposAuto = JSON.parse(fs.readFileSync(gruposFile));

function guardarGrupos() {
  fs.writeFileSync(gruposFile, JSON.stringify(global.gruposAuto, null, 2));
}
// ========================

// ========================
//   UTILIDADES
// ========================
const question = (text) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => rl.question(text, resolve));
};

const log = {
  success: (msg) => console.log(chalk.bgGreen.black(" SUCCESS "), chalk.green(msg)),
  warn: (msg) => console.log(chalk.bgYellow.black(" WARN "), chalk.yellow(msg)),
  error: (msg) => console.log(chalk.bgRed.white(" ERROR "), chalk.red(msg)),
};
// ========================


// ========================
//   INICIO DEL BOT
// ========================
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(global.sessionName);
  const { version } = await fetchLatestBaileysVersion();

  const client = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: true,
    browser: ["Linux", "Chrome"],
    auth: state,
  });

  // 🔥 CLAVE PARA AUTPOST Y GRUPOS
  global.client = client;

  // ========================
  //   EMPAREJAMIENTO
  // ========================
  if (!client.authState.creds.registered) {
    const phoneNumber = await question("📱 Ingresa tu número (ej: 519XXXXXXXX): ");
    const code = await client.requestPairingCode(phoneNumber);
    console.log(chalk.green("Código de emparejamiento:"), code);
  }

  await global.loadDatabase();

  // ========================
  //   CONEXIÓN
  // ========================
  client.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      log.warn("Conexión cerrada, reconectando...");
      startBot();
    }

    if (connection === "open") {
      log.success("Conectado correctamente");

      // 🔍 ESCANEAR TODOS LOS GRUPOS
      const grupos = await client.groupFetchAllParticipating();
      let nuevos = 0;

      for (const jid in grupos) {
        if (!jid.endsWith("@g.us")) continue;

        if (!global.gruposAuto.find(g => g.jid === jid)) {
          global.gruposAuto.push({
            jid,
            nombre: grupos[jid]?.subject || "Grupo sin nombre",
            fecha: Date.now(),
          });
          nuevos++;
        }
      }

      guardarGrupos();
      console.log(chalk.green(`📦 Grupos detectados y guardados: ${nuevos}`));
    }
  });

  // ========================
  //   MENSAJES
  // ========================
  client.ev.on("messages.upsert", async ({ messages }) => {
    try {
      let m = messages[0];
      if (!m.message) return;

      m.message = m.message.ephemeralMessage?.message || m.message;
      if (m.key.remoteJid === "status@broadcast") return;

      m = smsg(client, m);
      await mainHandler(client, m);
    } catch (e) {
      console.log("Error handler:", e);
    }
  });

  client.ev.on("creds.update", saveCreds);
}

startBot();
