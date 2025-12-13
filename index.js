require("./settings");
require("./lib/database");
require("./autopost"); // autopost activo

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  jidDecode,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const os = require("os");
const { Boom } = require("@hapi/boom");
const { exec } = require("child_process");
const { smsg } = require("./lib/message");
const mainHandler = require("./main");

// ========================
// SISTEMA DE GRUPOS
// ========================
const gruposFile = "./data/grupos.json";
if (!fs.existsSync("./data")) fs.mkdirSync("./data");
if (!fs.existsSync(gruposFile)) fs.writeFileSync(gruposFile, "[]");

global.gruposAuto = JSON.parse(fs.readFileSync(gruposFile));
function guardarGrupos() {
  fs.writeFileSync(gruposFile, JSON.stringify(global.gruposAuto, null, 2));
}

// ========================
// FUNCIONES AUX
// ========================
const question = (text) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => rl.question(text, resolve));
};

const log = {
  info: (msg) => console.log(chalk.bgBlue.white(`INFO`), chalk.white(msg)),
  success: (msg) => console.log(chalk.bgGreen.white(`SUCCESS`), chalk.greenBright(msg)),
  warn: (msg) => console.log(chalk.bgYellowBright.blueBright(`WARNING`), chalk.yellow(msg)),
  error: (msg) => console.log(chalk.bgRed.white(`ERROR`), chalk.redBright(msg))
};

// ========================
// INICIO BOT
// ========================
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(global.sessionName);
  const { version } = await fetchLatestBaileysVersion();

  const client = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Linux", "Chrome"],
    auth: state
  });

  // Fix smsg
  client.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      const decode = jidDecode(jid) || {};
      return decode.user && decode.server ? decode.user + "@" + decode.server : jid;
    }
    return jid;
  };

  // GLOBAL
  global.client = client;

  // Emparejamiento solo si no hay sesión
  if (!client.authState.creds.registered) {
    const phoneNumber = await question("📱 Ingresa tu número (ej: 521XXXXXXXXXX): ");
    try {
      const pairing = await client.requestPairingCode(phoneNumber, "1234YERX");
      log.success(`Código de emparejamiento: ${pairing} (expira en 15s)`);
    } catch (err) {
      log.error("Error al solicitar código de emparejamiento:", err);
      exec("rm -rf ./lurus_session/*");
      process.exit(1);
    }
  }

  await global.loadDatabase();
  log.info("Base de datos cargada correctamente.");

  // ========================
  // CONEXIÓN
  // ========================
  client.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output.statusCode;

      if ([DisconnectReason.connectionLost, DisconnectReason.connectionClosed, DisconnectReason.restartRequired, DisconnectReason.timedOut, DisconnectReason.badSession].includes(reason)) {
        log.warn("Reconectando...");
        startBot();
        return;
      }

      if ([DisconnectReason.loggedOut, DisconnectReason.forbidden, DisconnectReason.multideviceMismatch].includes(reason)) {
        log.error("Sesión cerrada. Elimina la carpeta de sesión y vuelve a escanear.");
        exec("rm -rf ./lurus_session/*");
        process.exit(1);
      }

      client.end(`Motivo desconocido: ${reason}`);
    }

    if (connection === "open") {
      log.success("Conectado correctamente!");

      // Escanear y guardar grupos automáticamente
      const grupos = await client.groupFetchAllParticipating();
      let nuevos = 0;

      for (const jid in grupos) {
        if (!jid.endsWith("@g.us")) continue;
        if (!global.gruposAuto.find(g => g.jid === jid)) {
          global.gruposAuto.push({
            jid,
            nombre: grupos[jid]?.subject || "Grupo sin nombre",
            fecha: Date.now()
          });
          nuevos++;
        }
      }

      guardarGrupos();
      log.success(`📦 Grupos detectados y guardados: ${nuevos}`);
    }
  });

  // ========================
  // MENSAJES
  // ========================
  client.ev.on("messages.upsert", async ({ messages }) => {
    try {
      let m = messages[0];
      if (!m.message) return;

      m.message = m.message.ephemeralMessage?.message || m.message;

      if (m.key.remoteJid === "status@broadcast") return;

      m = smsg(client, m);
      await mainHandler(client, m);
    } catch (err) {
      log.error("Error en handler:", err);
    }
  });

  client.ev.on("creds.update", saveCreds);
}

startBot();

