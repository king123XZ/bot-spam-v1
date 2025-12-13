const fs = require("fs")

const delay = ms => new Promise(r => setTimeout(r, ms))

// 🔐 CONTADOR DIARIO
const LIMIT_DIARIO = 100
if (!global.enviosDiarios) global.enviosDiarios = {}

function hoy() {
  return new Date().toISOString().split("T")[0]
}

function variarTexto(texto) {
  const invisible = Math.random().toString(36).substring(2, 6)
  return `${texto}\n\n‎${invisible}`
}

module.exports = {
  name: "enviaragrupos",
  command: ["enviaragrupos"],
  isOwner: true,

  run: async (client, m) => {
    try {
      const sender = m.sender
      const ownerJids = global.owner.map(v => v + "@s.whatsapp.net")

      // 👤 SOLO OWNER
      if (!ownerJids.includes(sender)) {
        return m.reply("⛔ Solo el OWNER puede usar este comando.")
      }

      // 🔐 CONTADOR
      if (!global.enviosDiarios[sender]) {
        global.enviosDiarios[sender] = { fecha: hoy(), total: 0 }
      }

      if (global.enviosDiarios[sender].fecha !== hoy()) {
        global.enviosDiarios[sender] = { fecha: hoy(), total: 0 }
      }

      if (global.enviosDiarios[sender].total >= LIMIT_DIARIO) {
        return m.reply("🚫 Límite diario alcanzado (100 envíos).")
      }

      // 📌 Guardar mensaje citado
      if (m.quoted) {
        global._enviar[sender] = { message: m.quoted }
        return m.reply("✅ Mensaje guardado.\nAhora escribe *.enviaragrupos*")
      }

      const data = global._enviar[sender]
      if (!data) {
        return m.reply("⚠️ Responde a un mensaje o imagen primero.")
      }

      const groups = Object.entries(await client.groupFetchAllParticipating())
        .map(v => v[1].id)

      m.reply(`🚀 Envío ULTRA SEGURO\n📦 Grupos: ${groups.length}`)

      // 🛡 CONFIG SEGURA
      const BLOQUE = 15
      const DELAY_MIN = 25000
      const DELAY_MAX = 35000
      let errores = 0

      for (let i = 0; i < groups.length; i++) {
        if (global.enviosDiarios[sender].total >= LIMIT_DIARIO) break

        try {
          const gid = groups[i]

          await client.sendPresenceUpdate("composing", gid)
          await delay(3000)

          if (data.message.message?.imageMessage) {
            const buffer = await data.message.download()
            await client.sendMessage(gid, {
              image: buffer,
              caption: variarTexto(
                data.message.message.imageMessage.caption || ""
              )
            })
          } else if (data.message.message?.videoMessage) {
            const buffer = await data.message.download()
            await client.sendMessage(gid, {
              video: buffer,
              caption: variarTexto(
                data.message.message.videoMessage.caption || ""
              )
            })
          } else {
            await client.sendMessage(gid, {
              text: variarTexto(
                data.message.message.conversation ||
                data.message.message.extendedTextMessage?.text ||
                ""
              )
            })
          }

          global.enviosDiarios[sender].total++
          errores = 0

          const espera = Math.floor(
            Math.random() * (DELAY_MAX - DELAY_MIN) + DELAY_MIN
          )
          await delay(espera)

          // 📦 pausa por bloques
          if (i > 0 && i % BLOQUE === 0) {
            m.reply(`⏸️ Pausa de seguridad (${i} envíos)`)
            await delay(10 * 60 * 1000)
          }

        } catch (err) {
          errores++
          console.log("⚠️ Error WhatsApp:", err)

          // 🧯 AUTO-PAUSA
          if (errores >= 3) {
            m.reply("⛔ WhatsApp está lento. Envío detenido por seguridad.")
            break
          }

          await delay(5 * 60 * 1000)
        }
      }

      delete global._enviar[sender]
      m.reply("✅ Proceso finalizado con seguridad.")

    } catch (e) {
      console.log(e)
      m.reply("❌ Error crítico.")
    }
  }
}


