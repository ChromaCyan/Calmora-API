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

    let text = parsedResults.ParsedText.replace(/\r\n/g, "\n").toUpperCase();

    // Split into words/lines
    const words = text.split(/[\s\n]+/);

    // Words to ignore in names
    const ignoreWords = ["LAST", "FIRST", "MIDDLE", "NAME", "REGISTRATION", "VALID", "UNTIL", "IDENTIFICATION", "CARD", "CERTIFICATION", "SCANNED", "WITH", "CAMSCANNER", "Regulation", "Commisions", "www.prc.gov.ph", "Certification"];

    // Extract profession
    const professionMatch = text.match(/MEDICAL TECHNOLOGIST|PSYCHOLOGIST|PHYSICIAN|COUNSELOR|THERAPIST|OCCUPATIONAL THERAPY/i);
    const profession = professionMatch ? professionMatch[0] : null;

    // Extract license number (5+ digits)
    const licenseNumberMatch = text.match(/\b\d{5,}\b/);
    const licenseNumber = licenseNumberMatch ? licenseNumberMatch[0] : null;

    return {
      extractedLicenseNumber: licenseNumber,
      extractedProfession: profession,
      confidenceScore: parsedResults.FileParseExitCode === 1 ? 0.95 : 0.7,
    };
  } catch (err) {
    console.error("OCR extraction failed:", err.response?.data || err.message);
    return null;
  }
}

module.exports = extractLicenseData;
