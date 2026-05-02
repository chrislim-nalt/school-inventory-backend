const nodemailer = require("nodemailer");

// Create transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error);
  } else {
    console.log("✅ Email transporter ready (Gmail)");
  }
});

// Send OTP email
exports.sendOTP = async (email, otp, name, schoolCode = null, schoolName = null) => {
  try {
    const displaySchoolName = schoolName || "Your School";
    const displaySchoolCode = schoolCode || "Not available";
    
    const schoolInfoSection = schoolCode ? `
      <div style="background-color: #e8f4e8; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; border: 1px solid #4caf50;">
        <h3 style="color: #2e7d32; margin: 0 0 10px 0;">🏫 School Information</h3>
        <p style="margin: 5px 0;"><strong>School Name:</strong> ${displaySchoolName}</p>
        <p style="margin: 5px 0;"><strong>School Code:</strong> <span style="font-size: 20px; font-weight: bold; letter-spacing: 2px; background-color: #fff; padding: 5px 10px; border-radius: 5px;">${displaySchoolCode}</span></p>
        <p style="margin: 10px 0 0 0; font-size: 12px; color: #555;">
          🔑 Share this code with other staff members to join your school
        </p>
      </div>
    ` : '';

    const subject = schoolCode 
      ? `🏫 Welcome to ${displaySchoolName} Inventory System`
      : `🔐 Your Login Verification Code - ${displaySchoolName}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; border-radius: 10px;">
        <div style="text-align: center; background-color: #1e3a5f; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🏫 ${displaySchoolName}</h1>
          <p style="color: #cbd5e1; margin: 5px 0 0;">Inventory Management System</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1e3a5f; margin-top: 0;">Hello ${name || "User"}!</h2>
          
          ${schoolCode ? `
            <p style="color: #333; font-size: 16px;">Welcome to the system! You have successfully registered <strong>${displaySchoolName}</strong>.</p>
            <p style="color: #333; font-size: 16px;">Please find your school information below:</p>
          ` : `
            <p style="color: #333; font-size: 16px;">You've requested to log in to your account at <strong>${displaySchoolName}</strong>. Please use the verification code below to complete your login.</p>
          `}
          
          ${schoolInfoSection}
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 42px; font-weight: bold; letter-spacing: 10px; color: #1e3a5f; background-color: #f0f4f8; padding: 15px; border-radius: 8px; font-family: monospace;">
              ${otp}
            </div>
            <p style="color: #555; font-size: 12px; margin-top: 10px;">This code expires in <strong>10 minutes</strong></p>
          </div>
          
          ${schoolCode ? `
            <div style="background-color: #fff3e0; padding: 12px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
              <p style="margin: 0; color: #e65100; font-size: 13px;">
                💡 <strong>Tip:</strong> Save this email or write down your school code. You'll need it when logging in and sharing with other staff members.
              </p>
            </div>
          ` : `
            <p style="color: #555; font-size: 14px;">If you didn't request this, please ignore this email or contact your system administrator.</p>
          `}
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #888; font-size: 12px; text-align: center;">
            This is an automated message from ${displaySchoolName} Inventory System.<br>
            Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"${displaySchoolName} Inventory" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${email} - Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("❌ Email sending error:", error.message);
    return false;
  }
};

// Send password reset OTP
exports.sendPasswordResetOTP = async (email, otp, name, schoolName = null) => {
  try {
    const displaySchoolName = schoolName || "Your School";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; border-radius: 10px;">
        <div style="text-align: center; background-color: #1e3a5f; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🏫 ${displaySchoolName}</h1>
          <p style="color: #cbd5e1; margin: 5px 0 0;">Inventory Management System</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1e3a5f; margin-top: 0;">Hello ${name || "User"}!</h2>
          <p style="color: #333; font-size: 16px;">You requested to reset your password for <strong>${displaySchoolName}</strong>. Please use the verification code below to proceed.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 42px; font-weight: bold; letter-spacing: 10px; color: #1e3a5f; background-color: #f0f4f8; padding: 15px; border-radius: 8px; font-family: monospace;">
              ${otp}
            </div>
            <p style="color: #555; font-size: 12px; margin-top: 10px;">This code expires in <strong>10 minutes</strong></p>
          </div>
          
          <p style="color: #555; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #888; font-size: 12px; text-align: center;">
            This is an automated message from ${displaySchoolName} Inventory System.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"${displaySchoolName} Inventory" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🔐 Password Reset Request - ${displaySchoolName}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Password reset email error:", error.message);
    return false;
  }
};

// Send school code recovery email
exports.sendSchoolCodeRecovery = async (email, schoolName, schoolCode) => {
  try {
    const displaySchoolName = schoolName || "Your School";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; border-radius: 10px;">
        <div style="text-align: center; background-color: #1e3a5f; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🏫 ${displaySchoolName}</h1>
          <p style="color: #cbd5e1; margin: 5px 0 0;">Inventory Management System</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1e3a5f; margin-top: 0;">School Code Recovery</h2>
          
          <p style="color: #333; font-size: 16px;">You requested your school code for <strong>${displaySchoolName}</strong>.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #1e3a5f; background-color: #f0f4f8; padding: 15px; border-radius: 8px; font-family: monospace;">
              ${schoolCode}
            </div>
          </div>
          
          <div style="background-color: #e8f4e8; padding: 12px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #2e7d32; font-size: 13px;">
              🔑 Share this code with other staff members so they can join your school.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #888; font-size: 12px; text-align: center;">
            This is an automated message from ${displaySchoolName} Inventory System.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"${displaySchoolName} Inventory" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🏫 Your School Code - ${displaySchoolName}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ School code sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ School code email error:", error.message);
    return false;
  }
};