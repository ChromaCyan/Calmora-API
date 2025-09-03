const accountDeletedEmail = (firstName) => `
  <div style="font-family: Arial, sans-serif; background: #f8f9fa; padding: 40px 20px;">
    <div style="max-width: 600px; background: #fff; margin: 0 auto; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); text-align: center;">
    <img src="https://xipqovlvavpygfnzjtpg.supabase.co/storage/v1/object/sign/profile-images/calmora_circle_crop.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80YTAyMDlhYS00NjI2LTRhOTktYTM5Ny1jYzBmZDM2ZWJjNDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9maWxlLWltYWdlcy9jYWxtb3JhX2NpcmNsZV9jcm9wLnBuZyIsImlhdCI6MTc1NjkwMTU1NywiZXhwIjoxNzg4NDM3NTU3fQ.4zMqfAPZNB6pq3wwTfBL2oqGR-OF1N7Pxgx-Y50hbGY" alt="Calmora Logo" style="height: 50px; margin-bottom: 30px;" />
      <h2 style="color: #dc3545;">Account Deleted</h2>
      <p style="font-size: 16px; color: #495057;">Hi <strong>${firstName}</strong>,</p>
      <p style="font-size: 16px; color: #495057;">
        Your specialist account has been permanently removed from Calmora by the admin team.
      </p>
      <p style="font-size: 14px; color: #6c757d;">
        If you believe this was a mistake, please contact our support team for assistance.
      </p>
      <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
        - Calmora Team
      </p>
    </div>
    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #adb5bd;">
      Have questions? Contact us at <a href="mailto:support@calmora.com" style="color: #6c757d;">support@calmora.com</a>
    </div>
  </div>
`;

module.exports = accountDeletedEmail;
