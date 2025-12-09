require("./settings");
require("./lib/database");

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
const path = require("path");
const readline = require("readline");
const os = require("os");
const qrcode = require("qrcode-terminal");
const parsePhoneNumber = require("awesome-phonenumber");
const { smsg } = require("./lib/message");
const { Boom } = require("@hapi/boom");
const { exec } = require("child_process");

const mainHandler = require("./main");


// ========================
//   SISTEMA DE GRUPOS
// ========================
const gruposFile = "./data/grupos.json";
if (!fs.existsSync(gruposFile)) {
  fs.writeFileSync(gruposFile, JSON.stringify([]));
}

global.gruposAuto = JSON.parse(fs.readFileSync(gruposFile));

function guardarGrupos() {
  fs.writeFileSync(gruposFile, JSON.stringify(global.gruposAuto, null, 2));
}
// ========================


const print = (label, value) =>
  console.log(
    `${chalk.green.bold("║")} ${chalk.cyan.bold(label.padEnd(16))}${chalk.magenta.bold(":")} ${value}`
  );

const question = (text) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => rl.question(text, resolve));
};

const usePairingCode = true;

const log = {
  info: (msg) => console.log(chalk.bgBlue.white.bold(`INFO`), chalk.white(msg)),
  success: (msg) => console.log(chalk.bgGreen.white.bold(`SUCCESS`), chalk.greenBright(msg)),
  warn: (msg) => console.log(chalk.bgYellowBright.blueBright.bold(`WARNING`), chalk.yellow(msg)),
  warning: (msg) => console.log(chalk.bgYellowBright.red.bold(`WARNING`), chalk.yellow(msg)),
  error: (msg) => console.log(chalk.bgRed.white.bold(`ERROR`), chalk.redBright(msg)),
};

const userInfoSyt = () => {
  try {
    return os.userInfo().username;
  } catch {
    return process.env.USER || process.env.USERNAME || "desconocido";
  }
};


console.log(
  chalk.yellow.bold(
    `╔═════[${`${chalk.yellowBright(userInfoSyt())}${chalk.white.bold("@")}${chalk.yellowBright(os.hostname())}`}]═════`
  )
);
print("OS", `${os.platform()} ${os.release()} ${os.arch()}`);
print("Actividad", `${Math.floor(os.uptime() / 3600)} h ${Math.floor((os.uptime() % 3600) / 60)} m`);
print("Shell", process.env.SHELL || process.env.COMSPEC || "desconocido");
print("CPU", os.cpus()[0]?.model.trim() || "unknown");
print("Memoria", `${(os.freemem() / 1024 / 1024).toFixed(0)} MiB / ${(os.totalmem() / 1024 / 1024).toFixed(0)} MiB`);
print("Script version", `v${require("./package.json").version}`);
print("Node.js", process.version);
print("Baileys", `WhiskeySockets/baileys`);
print("Fecha & Tiempo", new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City", hour12: false }));
console.log(chalk.yellow.bold("╚" + "═".repeat(30)));


async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(global.sessionName);
  const { version } = await fetchLatestBaileysVersion();

  const client = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Linux", "Opera"],
    auth: state,
  });

  if (!client.authState.creds.registered) {
    const phoneNumber = await question(
      log.warn("Ingrese su número de WhatsApp\n") +
      log.info("Ejemplo: 5212345678900\n")
    );

    try {
      log.info("Solicitando código de emparejamiento...");
      const pairing = await client.requestPairingCode(phoneNumber, "1234MINI");
      log.success(`Código de emparejamiento: ${chalk.cyanBright(pairing)} (expira en 15s)`);
    } catch (err) {
      log.error("Error al solicitar el código de emparejamiento:", err);
      exec("rm -rf ./lurus_session/*");
      process.exit(1);
    }
  }


  await global.loadDatabase();
  console.log(chalk.yellow("Base de datos cargada correctamente."));

  client.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output.statusCode;

      if ([
        DisconnectReason.connectionLost,
        DisconnectReason.connectionClosed,
        DisconnectReason.restartRequired,
        DisconnectReason.timedOut,
        DisconnectReason.badSession,
      ].includes(reason)) {
        log.warning("Reconectando...");
        startBot();
        return;
      }

      if ([
        DisconnectReason.loggedOut,
        DisconnectReason.forbidden,
        DisconnectReason.multideviceMismatch,
      ].includes(reason)) {
        log.error("Eliminar sesión y volver a escanear");
        exec("rm -rf ./lurus_session/*");
        process.exit(1);
      }

      client.end(`Motivo desconocido: ${reason}`);
    }

    if (connection === "open") log.success("Su conexión fue exitosa");
  });


  // ================================
  //    DETECTAR GRUPOS AUTOMÁTICO
  // ================================
  client.ev.on("group-participants.update", async (data) => {
    if (!data.id) return;

    if (!global.gruposAuto.includes(data.id)) {
      global.gruposAuto.push(data.id);
      guardarGrupos();
      console.log(chalk.green(`Nuevo grupo detectado y guardado: ${data.id}`));
    }
  });
  // ================================


  client.ev.on("messages.upsert", async ({ messages }) => {
    try {
      let m = messages[0];
      if (!m.message) return;

      m.message =
        m.message.ephemeralMessage?.message || m.message;

      if (m.key.remoteJid === "status@broadcast") return;

      m = smsg(client, m);

      await mainHandler(client, m);

    } catch (err) {
      console.log("Error en handler:", err);
    }
  });


  client.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      const decode = jidDecode(jid) || {};
      return decode.user && decode.server ? decode.user + "@" + decode.server : jid;
    }
    return jid;
  };

  client.ev.on("creds.update", saveCreds);
}

startBot();

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.yellowBright(`Se actualizó ${__filename}`));
  delete require.cache[file];
  require(file);
});
