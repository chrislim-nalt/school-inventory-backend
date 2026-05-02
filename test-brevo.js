require("dotenv").config();
const { sendOTP } = require("./services/emailService");

async function test() {
  console.log("Testing Brevo email configuration...");
  console.log("Email user:", process.env.EMAIL_USER);
  console.log("Email host:", process.env.EMAIL_HOST);
  
  const result = await sendOTP("your_test_email@gmail.com", "123456", "Test User", "TEST123", "Test School");
  
  if (result) {
    console.log("✅ Email sent successfully!");
  } else {
    console.log("❌ Email failed to send");
  }
}

test();