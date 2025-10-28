const axios = require("axios");

async function extractLicenseData(imageUrl) {
  try {
    const apiKey = "K86286414288957";

    const response = await axios.post(
      "https://api.ocr.space/parse/image",
      new URLSearchParams({
        apikey: apiKey,
        url: imageUrl,
        language: "eng",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const parsedResults = response.data.ParsedResults?.[0];
    if (!parsedResults || !parsedResults.ParsedText) {
      console.error("OCR.space did not return valid text:", response.data);
      return null;
    }

    const text = parsedResults.ParsedText.replace(/\s+/g, " ").toUpperCase();
    console.log("📜 OCR Extracted Text:", text);

    // Extract using more tolerant regex
    const lastName = text.match(/LAST\s*NAME[:\s]+([A-Z\s]+)/)?.[1]?.trim() || null;
    const firstName = text.match(/FIRST\s*NAME[:\s]+([A-Z\s]+)/)?.[1]?.trim() || null;
    const middleName = text.match(/MIDDLE\s*NAME[:\s]+([A-Z\s]+)/)?.[1]?.trim() || null;

    // Find the first standalone number sequence (license no.)
    const licenseNumber = text.match(/\b\d{5,}\b/)?.[0] || null;

    const profession = text.match(
      /PSYCHOLOGIST|PSYCHOMETRICIAN|PHYSICIAN|COUNSELOR|THERAPIST|MEDICAL\s*TECHNOLOGIST|OCCUPATIONAL\s*THERAPY\s*TECHNICIAN/i
    )?.[0] || null;

    const expiry = text.match(/VALID\s*UNTIL[:\s]+([0-9/]+)/)?.[1]?.trim() || null;

    // Combine names gracefully
    const extractedName = [firstName, middleName, lastName].filter(Boolean).join(" ");

    return {
      extractedName: extractedName || null,
      extractedLicenseNumber: licenseNumber,
      extractedProfession: profession,
      extractedExpiry: expiry,
      confidenceScore: parsedResults.FileParseExitCode === 1 ? 0.95 : 0.7,
    };
  } catch (err) {
    console.error("OCR extraction failed:", err.response?.data || err.message);
    return null;
  }
}

module.exports = extractLicenseData;
