require("./settings");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const chalk = require("chalk");
const gradient = require("gradient-string");

const seeCommands = require("./lib/system/commandLoader");
const initDB = require("./lib/system/initDB");
const antilink = require("./commands/antilink");
const { resolveLidToRealJid } = require("./lib/utils");

// 🔥 CARGA DE COMANDOS
seeCommands();

// 🟦 BASE PARA MULTIPASO (enviaragrupos)
if (!global._enviar) global._enviar = {};
if (!global._warned) global._warned = {}; // ⭐ Nueva protección anti-spam

module.exports = async (client, m) => {
  const sender = m.sender || m.key.participant || m.key.remoteJid;

  // ======================================================================
  // 🔥 SISTEMA MULTIPASO — SI EL USUARIO YA INICIÓ enviaragrupos
  // ======================================================================

  if (
    global._enviar[sender] && 
    !m.message?.buttonsResponseMessage &&
    !m.message?.templateButtonReplyMessage &&
    !m.body?.startsWith(".")
  ) {

    // ⭐ Si envía una imagen → ejecutar multipaso sin errores ni spam
    if (m.message?.imageMessage) {
      global._warned[sender] = false;
      const cmd = global.comandos.get("enviaragrupos");
      if (cmd) {
        try {
          return await cmd.run(client, m, [], {});
        } catch (err) {
          console.log("Error multipaso enviaragrupos:", err);
        }
      }
      return;
    }

    // ⭐ Anti-spam: solo se envía una vez si NO envía imagen
    if (!global._warned[sender]) {
      global._warned[sender] = true;
      return m.reply("⚠️ Debes enviar una *imagen* para continuar.");
    }

    return;
  }

  // ======================================================================
  //                     🔥 DETECTAR MENSAJE NORMAL
  // ======================================================================

  let body = "";

  if (m.message) {
    if (m.message.conversation) body = m.message.conversation;
    else if (m.message.extendedTextMessage?.text)
      body = m.message.extendedTextMessage.text;
    else if (m.message.imageMessage?.caption)
      body = m.message.imageMessage.caption;
    else if (m.message.videoMessage?.caption)
      body = m.message.videoMessage.caption;
    else if (m.message.buttonsResponseMessage?.selectedButtonId)
      body = m.message.buttonsResponseMessage.selectedButtonId;
    else if (m.message.listResponseMessage?.singleSelectReply?.selectedRowId)
      body = m.message.listResponseMessage.singleSelectReply.selectedRowId;
    else if (m.message.templateButtonReplyMessage?.selectedId)
      body = m.message.templateButtonReplyMessage.selectedId;
  }

  // Base de datos y antilink
  initDB(m);
  antilink(client, m);

  // Prefijos
  const prefa = ['.', '!', '#', '/'];
  const prefix = prefa.find((p) => body.startsWith(p));
  if (!prefix) return;

  // Datos básicos
  const from = m.key.remoteJid;
  const args = body.trim().split(/ +/).slice(1);
  const text = args.join(" ");
  const botJid = client.user.id.split(":")[0] + "@s.whatsapp.net";

  const command = body
    .slice(prefix.length)
    .trim()
    .split(/\s+/)[0]
    .toLowerCase();

  const pushname = m.pushName || "Sin nombre";
  const realSender = m.isGroup
    ? m.key.participant || m.participant
    : m.key.remoteJid;

  // ======================================================================
  //                            🔥 DATOS DEL GRUPO
  // ======================================================================

  let groupMetadata, groupAdmins, resolvedAdmins = [], groupName = "";

  if (m.isGroup) {
    groupMetadata = await client.groupMetadata(m.chat).catch(_ => null);
    groupName = groupMetadata?.subject || "";
    groupAdmins =
      groupMetadata?.participants.filter(
        (p) => p.admin === "admin" || p.admin === "superadmin"
      ) || [];

    resolvedAdmins = await Promise.all(
      groupAdmins.map((adm) =>
        resolveLidToRealJid(adm.jid, client, m.chat).then((realJid) => ({
          ...adm,
          jid: realJid,
        }))
      )
    );
  }

  const isBotAdmins = m.isGroup
    ? resolvedAdmins.some((p) => p.jid === botJid)
    : false;

  const isAdmins = m.isGroup
    ? resolvedAdmins.some((p) => p.jid === realSender)
    : false;

  // ======================================================================
  //                        🔥 REGISTRO EN CONSOLA
  // ======================================================================

  const h = chalk.bold.blue("************************************");
  const v = chalk.bold.white("*");

  const date = chalk.bold.yellow(
    `\n${v} Fecha: ${chalk.whiteBright(moment().format("DD/MM/YY HH:mm:ss"))}`
  );
  const userPrint = chalk.bold.blueBright(
    `\n${v} Usuario: ${chalk.whiteBright(pushname)}`
  );
  const senderPrint = chalk.bold.magentaBright(
    `\n${v} Remitente: ${gradient("deepskyblue", "darkorchid")(realSender)}`
  );
  const groupPrint = m.isGroup
    ? chalk.bold.cyanBright(
        `\n${v} Grupo: ${chalk.greenBright(groupName)}\n${v} ID: ${gradient(
          "violet",
          "midnightblue"
        )(from)}\n`
      )
    : chalk.bold.greenBright(`\n${v} Chat privado\n`);

  console.log(`\n${h}${date}${userPrint}${senderPrint}${groupPrint}${h}`);

  // ======================================================================
  //                       🔥 EJECUTAR COMANDO NORMAL
  // ======================================================================

  if (global.comandos.has(command)) {
    const cmd = global.comandos.get(command);

    // Permisos
    if (
      cmd.isOwner &&
      !global.owner.map((num) => num + "@s.whatsapp.net").includes(realSender)
    ) return m.reply("⚠️ Solo el owner puede usar este comando.");

    if (cmd.isReg && !db.data.users[realSender]?.registered)
      return m.reply("⚠️ Debes registrarte.");

    if (cmd.isGroup && !m.isGroup)
      return m.reply("⚠️ Este comando solo funciona en grupos.");

    if (cmd.isAdmin && !isAdmins)
      return m.reply("⚠️ Necesitas ser admin.");

    if (cmd.isBotAdmin && !isBotAdmins)
      return m.reply("⚠️ Necesito admin para ejecutar esto.");

    if (cmd.isPrivate && m.isGroup)
      return m.reply("⚠️ Este comando solo funciona en privado.");

    // Ejecutar comando
    try {
      await cmd.run(client, m, args, { text });
    } catch (error) {
      console.error(chalk.red(`Error ejecutando comando ${command}:`), error);
      await client.sendMessage(
        m.chat,
        { text: "❌ Ocurrió un error ejecutando el comando." },
        { quoted: m }
      );
    }
  }
};

// Auto recarga
const mainFile = require.resolve(__filename);
fs.watchFile(mainFile, () => {
  fs.unwatchFile(mainFile);
  console.log(
    chalk.yellowBright(
      `\nSe actualizó ${path.basename(__filename)}, recargando...`
    )
  );
  delete require.cache[mainFile];
  require(mainFile);
});

// Mini Lurus © 2025 - Creado por Zam | GataNina-Li | DevAlexJs | El
