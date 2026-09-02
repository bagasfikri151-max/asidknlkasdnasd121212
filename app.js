
  
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
        imageUrl1: config.image1Url || '',
        imageUrl2: config.image2Url || '',
        imageUrl3: config.image3Url || '',
        imageUrl4: config.image4Url || '',
        imageUrl5: config.image5Url || '',
        telegramId: config.telegramId || '',  // ✅ PASS TELEGRAM ID KE FORM!
        titlefour: config.titlefour || '',
        buttonname: config.buttonname || '',
        footerdesc: config.footerdesc || '',
        footerImageUrl: config.footerImageUrl || '',
      });
    } else {
      return res.status(404).send('View not found');
    }
  });
});
