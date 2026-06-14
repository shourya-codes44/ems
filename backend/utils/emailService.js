// A clean helper to output verification and reset emails to the console for easy testing/verification.
// Since real API keys are not provided, logging fully formed URLs to the terminal provides immediate feedback.

const sendVerificationEmail = (email, name, token) => {
  const url = `http://localhost:3000/verify-email/${token}`;
  console.log("\n========================================================");
  console.log(`✉️  EMAIL VERIFICATION SENT TO: ${email}`);
  console.log(`Hi ${name},`);
  console.log("Please click the link below to verify your EMS account:");
  console.log(`👉 ${url}`);
  console.log("========================================================\n");
};

const sendPasswordResetEmail = (email, name, token) => {
  const url = `http://localhost:3000/reset-password?token=${token}`;
  console.log("\n========================================================");
  console.log(`✉️  PASSWORD RESET REQUEST FOR: ${email}`);
  console.log(`Hi ${name},`);
  console.log("You requested to reset your password. Use the link below:");
  console.log(`👉 ${url}`);
  console.log("This link will expire in 15 minutes.");
  console.log("========================================================\n");
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};
