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

    const text = parsedResults.ParsedText.replace(/\r\n/g, "\n") // normalize line breaks
      .replace(/\n+/g, "\n") // collapse multiple newlines
      .toUpperCase();

    // Extract last name
    const lastName = text.match(/LAST NAME\s*[▶>]*\s*([A-Z\s]+)/)?.[1]?.trim() || null;
    // Extract first name
    const firstName = text.match(/FIRST NAME\s*[▶>]*\s*([A-Z\s]+)/)?.[1]?.trim() || null;
    // Extract profession
    const profession = text.match(/MEDICAL TECHNOLOGIST|PSYCHOLOGIST|PHYSICIAN|COUNSELOR|THERAPIST|OCCUPATIONAL THERAPY/i)?.[0] || null;
    // Extract registration number (5+ digits)
    const licenseNumber = text.match(/REGISTRAT[^\n]*\n.*?(\d{5,})/)?.[1]?.trim() || text.match(/\b\d{5,}\b/)?.[0] || null;

    const extractedName = [firstName, lastName].filter(Boolean).join(" ");

    return {
      extractedName: extractedName || null,
      extractedLicenseNumber: licenseNumber,
      extractedProfession: profession,
      extractedExpiry: null, 
      confidenceScore: parsedResults.FileParseExitCode === 1 ? 0.95 : 0.7,
    };
  } catch (err) {
    console.error("OCR extraction failed:", err.response?.data || err.message);
    return null;
  }
}

module.exports = extractLicenseData;
