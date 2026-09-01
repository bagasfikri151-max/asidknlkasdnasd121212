const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const idpel = process.argv[2];
if (!idpel) {
    console.error(JSON.stringify({ code: 400, error: 'ID pelanggan tidak diberikan.' }));
    process.exit(1);
}


const profileDir = path.resolve('./my-browser-profile');
const singletonLockPath = path.join(profileDir, 'SingletonLock');
if (fs.existsSync(singletonLockPath)) {
  try {
    fs.unlinkSync(singletonLockPath);
  } catch (err) {
    console.error(JSON.stringify({ code: 500, error: 'Gagal menghapus SingletonLock: ' + err.message }));
    process.exit(1);
  }
}

(async () => {


  const browser = await puppeteer.launch({
  headless: true,
  userDataDir: './my-browser-profile',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--enable-features=NetworkService,NetworkServiceInProcess',
    '--disable-features=IsolateOrigins,site-per-process',
    '--allow-third-party-cookies',
    '--disable-web-security',
    '--disable-features=SameSiteByDefaultCookies'
  ]
});

  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
  );

  try {
    await page.goto('https://www.hotelmurah.com/pulsa/pln/token-listrik', {
      waitUntil: 'networkidle2',
    });

    await page.evaluate(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        .helpcrunch-launcher,
        iframe[src*="helpcrunch"],
        #helpcrunch-chat,
        [class*="helpcrunch"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(style);
    });

    await page.waitForSelector('#id_pelanggan', { timeout: 5000 });
    await page.click('#id_pelanggan', { clickCount: 3 });
    await page.type('#id_pelanggan', idpel, { delay: 50 });

    await page.waitForSelector('#nohp_input', { timeout: 5000 });
    await page.click('#nohp_input', { clickCount: 3 });
    await page.type('#nohp_input', '08567833304', { delay: 50 });

    await page.waitForSelector('.grid-kuota.TU5-8', { timeout: 5000 });
    await page.click('.grid-kuota.TU5-8');

    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise(resolve => setTimeout(resolve, 500));

    let responseCaptured = false;
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/pln/cari_id_android') && !responseCaptured) {
        responseCaptured = true;
        try {
          const json = await response.json();

          if (json && json.data?.info?.cust_name) {
            const info = json.data.info;
            const hasil = {
              code: 200,
              nama: info.cust_name,
              meter_no: info.meter_no,
              va: info.kelas,
             
            };
            console.log(JSON.stringify(hasil));
          } else {
            console.log(JSON.stringify({ code: 403, error: 'Data pelanggan tidak ditemukan.' }));
          }
        } catch (err) {
          console.log(JSON.stringify({ code: 500, error: 'Gagal parsing data.' }));
        } finally {
          await browser.close();
        }
      }
    });

    await page.waitForSelector('#buttonsearch', { timeout: 5000 });
    await page.click('#buttonsearch');

  } catch (error) {
    console.log(JSON.stringify({ code: 500, error: error.message }));
    await browser.close();
  }
})();
