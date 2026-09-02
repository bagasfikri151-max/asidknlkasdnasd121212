// Diagnostik kirim pesan Telegram ke satu telegramId.
// Pakai: node test-send.js <telegramId>
// Tujuan: cek apakah pesan bisa sampai ke user (mis. user belum /start bot,
// id salah, atau token bermasalah). Menampilkan respons ASLI dari Telegram API.

require("./editdisini.js");
const axios = require("axios");

const telegramId = process.argv[2];

if (!telegramId) {
  console.error("❌ Kurang argumen.\n   Pakai: node test-send.js <telegramId>");
  process.exit(1);
}

if (!global.tokenbot) {
  console.error("❌ global.tokenbot tidak ditemukan (cek editdisini.js).");
  process.exit(1);
}

const text = [
  "🧪 <b>TEST KONEKSI BOT</b>",
  "",
  `🆔 Target: <code>${telegramId}</code>`,
  `⏰ ${new Date().toLocaleString("id-ID")}`,
  "",
  "Kalau pesan ini masuk, berarti bot bisa kirim ke user ini ✅",
].join("\n");

(async () => {
  console.log(`➡️  Mengirim test ke telegramId: ${telegramId} ...`);
  try {
    const res = await axios.post(
      `https://api.telegram.org/bot${global.tokenbot}/sendMessage`,
      { chat_id: telegramId, text, parse_mode: "HTML" },
      { timeout: 15000 }
    );
    console.log("✅ SUKSES — pesan terkirim.");
    console.log("   message_id:", res.data?.result?.message_id);
  } catch (err) {
    const data = err.response?.data;
    console.error("❌ GAGAL kirim ke Telegram.");
    if (data) {
      console.error("   error_code   :", data.error_code);
      console.error("   description  :", data.description);
      if (data.error_code === 403) {
        console.error("   👉 Artinya: user BELUM pernah /start bot ini, atau memblokir bot.");
        console.error("      Solusi: minta user buka bot & tekan START dulu.");
      } else if (data.error_code === 400 && /chat not found/i.test(data.description || "")) {
        console.error("   👉 Artinya: telegramId salah / bukan chat_id yang valid.");
      }
    } else {
      console.error("   ", err.message);
    }
    process.exit(2);
  }
})();
