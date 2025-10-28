const verifyEmailTemplate = (firstName, verifyLink) => `
  <div style="font-family: Arial, sans-serif; background: #f8f9fa; padding: 40px 20px;">
    <div style="max-width: 600px; background: #fff; margin: 0 auto; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); text-align: center;">
      <div style="margin-bottom: 30px;">
        <img 
          src="https://xipqovlvavpygfnzjtpg.supabase.co/storage/v1/object/sign/profile-images/Calmora.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80YTAyMDlhYS00NjI2LTRhOTktYTM5Ny1jYzBmZDM2ZWJjNDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9maWxlLWltYWdlcy9DYWxtb3JhLnBuZyIsImlhdCI6MTc1NjkwNTIxNSwiZXhwIjoxNzg4NDQxMjE1fQ.fgcPnsPaGOlVUGU2DdGtMtYjOk40ZDGGM9RTotd_zUU"
          alt="Calmora Logo"
          style="width: 150px; display: block; margin: 0 auto;"
        />
      </div>
      <h2 style="color: #0d6efd;">Verify Your Calmora Email</h2>
      <p style="font-size: 16px; color: #495057;">Hi <strong>${firstName}</strong>,</p>
      <p style="font-size: 16px; color: #495057;">
        Welcome to Calmora! Please verify your email address by clicking the button below.
      </p>

      <div style="margin: 30px 0;">
        <a href="${verifyLink}" target="_blank"
          style="background: #0d6efd; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Verify My Email
        </a>
      </div>

      <p style="font-size: 14px; color: #6c757d;">
        This link will expire in 24 hours. If you did not create a Calmora account, please ignore this message.
      </p>

      <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
        - Calmora Team
      </p>
    </div>

    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #adb5bd;">
      Need help? Contact us at <a href="mailto:support@calmora.com" style="color: #6c757d;">support@calmora.com</a>
    </div>
  </div>
`;

module.exports = verifyEmailTemplate;
