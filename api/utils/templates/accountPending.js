const accountPendingEmail = (firstName) => `
  <div style="font-family: Arial, sans-serif; background: #f8f9fa; padding: 40px 20px;">
    <div style="max-width: 600px; background: #fff; margin: 0 auto; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); text-align: center;">
      <img src="https://yourdomain.com/logo.png" alt="Calmora Logo" style="height: 50px; margin-bottom: 30px;" />

      <h2 style="color: #ffc107; font-size: 24px;">Account Pending Approval</h2>

      <p style="font-size: 16px; color: #495057;">Hi <strong>${firstName}</strong>,</p>

      <p style="font-size: 16px; color: #495057;">
        Thank you for registering as a specialist on Calmora. Your account is currently under review by our admin team.
      </p>

      <p style="font-size: 16px; color: #495057;">
        You will receive another email once your account has been approved or rejected.
      </p>

      <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
        Thanks,<br>The Calmora Team
      </p>
    </div>

    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #adb5bd;">
      Have questions? Contact us at <a href="mailto:support@calmora.com" style="color: #6c757d;">support@calmora.com</a>
    </div>
  </div>
`;

module.exports = accountPendingEmail;
