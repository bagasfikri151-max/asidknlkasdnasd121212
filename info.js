
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const { spawnSync } = require('child_process');

const log = (...args) => console.error("[info.js]", ...args);

const IP_ARG = process.argv[2] || null;
const UA_ARG = process.argv[3] || null;

const DEFAULT_UA =
'Mozilla/5.0 (Linux; Android 13; Infinix X6525) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36';

const UA = (UA_ARG || DEFAULT_UA).trim();

/* ======================= */
async function getPublicIp() {
  try {
    log("Getting public IP...");
    const { data } = await axios.get('https://api.ipify.org?format=json');
    return data.ip;
  } catch (e) {
    log("getPublicIp error:", e.message);
    return null;
  }
}

async function getIpInfo(ip) {
  try {
    log("Getting IP info...");
    const { data } = await axios.get(`https://ipwho.is/${ip}`);
    return data;
  } catch (e) {
    log("getIpInfo error:", e.message);
    return null;
  }
}

function detectChromePath() {
  const paths = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      log("Chrome found:", p);
      return p;
    }
  }

  log("Chrome not found, using bundled");
  return null;
}

/* ======================= */
async function scrapeDeviceFields(userAgent) {

  log("Launching puppeteer...");

  const launchOpts = {
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  };

  const chromePath = detectChromePath();
  if (chromePath) launchOpts.executablePath = chromePath;

  const browser = await puppeteer.launch(launchOpts);

  try {
    const page = await browser.newPage();

    await page.setUserAgent(userAgent);

    const url =
      `https://51degrees.com/developers/user-agent-tester?headers=${encodeURIComponent(userAgent)}`;

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    await page.waitForSelector("table", { timeout: 15000 });

    const result = await page.evaluate(() => {
      const out = {};
      document.querySelectorAll("table tbody tr").forEach(tr => {
        const tds = tr.querySelectorAll("td");
        if (tds.length === 2) {
          out[tds[0].innerText.trim()] = tds[1].innerText.trim();
        }
      });
      return out;
    });

    return result;

  } finally {
    await browser.close();
  }
}

/* ======================= */
(async () => {
  try {
    const ip = IP_ARG || await getPublicIp();

    const ipinfo = await getIpInfo(ip);

    const device = await scrapeDeviceFields(UA);

    // ⚠️ stdout ONLY JSON
    process.stdout.write(
      JSON.stringify({ device, ipinfo })
    );

  } catch (err) {
    log("Fatal error:", err.message);

    process.stdout.write(
      JSON.stringify({
        error: true,
        message: err.message
      })
    );

    process.exit(1);
  }
})();