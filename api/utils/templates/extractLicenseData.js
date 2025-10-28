// utils/templates/extractLicenseData.js
const axios = require("axios");

async function extractLicenseData(imageUrl) {
  try {
    const apiKey = "K86286414288957";

    if (!apiKey) {
      throw new Error("Missing OCR_SPACE_API_KEY in environment variables");
    }

    const response = await axios.post(
      "https://api.ocr.space/parse/image",
      {},
      {
        params: {
          apikey: apiKey,
          url: imageUrl,
          language: "eng",
        },
      }
    );

    const parsedResults = response.data.ParsedResults?.[0];
    if (!parsedResults || !parsedResults.ParsedText) {
      console.error("OCR.space did not return valid text:", response.data);
      return null;
    }

    const text = parsedResults.ParsedText;

    // Basic pattern matching
    const licenseNumber = text.match(/\b\d{4,}-\d{2,}\b/)?.[0] || null;
    const nameMatch = text.match(/Name[:\s]+([A-Z\s]+)/i);
    const profession = text.match(
      /PSYCHOLOGIST|PSYCHOMETRICIAN|PHYSICIAN|COUNSELOR|THERAPIST/i
    );
    const expiry = text.match(/Valid\s*until[:\s]*([A-Za-z0-9\s]+)/i);

    return {
      extractedName: nameMatch?.[1]?.trim() || null,
      extractedLicenseNumber: licenseNumber,
      extractedProfession: profession ? profession[0] : null,
      extractedExpiry: expiry ? expiry[1].trim() : null,
      confidenceScore: parsedResults.FileParseExitCode === 1 ? 0.95 : 0.7,
    };
  } catch (err) {
    console.error("OCR extraction failed:", err.response?.data || err.message);
    return null;
  }
}

module.exports = extractLicenseData;
