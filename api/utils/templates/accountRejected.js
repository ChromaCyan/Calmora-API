const accountRejectedEmail = (firstName) => `
  <div style="font-family: Arial, sans-serif; background: #f8f9fa; padding: 40px 20px;">
    <div style="max-width: 600px; background: #fff; margin: 0 auto; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); text-align: center;">
      <h2 style="color: #dc3545;">Account Rejected</h2>
      <p style="font-size: 16px; color: #495057;">Hi <strong>${firstName}</strong>,</p>
      <p style="font-size: 16px; color: #495057;">
        Unfortunately, your registration as a specialist was not approved after review.
      </p>
      <p style="font-size: 14px; color: #6c757d;">If you believe this is a mistake, feel free to reply to this email.</p>
      <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
        - Calmora Team
      </p>
    </div>
  </div>
`;

module.exports = accountRejectedEmail;
