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
      .replace(/\s+/g, " ") // collapse multiple spaces
      .toUpperCase();

    // Extract names
    const lastName =
      text.match(/LAST NAME\s*[:\s]*([A-Z\s]+)/)?.[1]?.trim() || null;
    const firstName =
      text.match(/FIRST NAME\s*[:\s]*([A-Z\s]+)/)?.[1]?.trim() || null;
    const middleName =
      text.match(/MIDDLE NAME\s*[:\s]*([A-Z\s]+)/)?.[1]?.trim() || null;

    // Extract license number
    const licenseNumber =
      text.match(/REGISTRATION\s*NO\s*[:\s]*([A-Z0-9]+)/)?.[1]?.trim() || null;

    // Extract profession (line above QR code)
    const profession =
      text.match(
        /MEDICAL TECHNOLOGIST|PSYCHOLOGIST|PHYSICIAN|COUNSELOR|THERAPIST|OCCUPATIONAL THERAPY/i
      )?.[0] || null;

    // Extract expiry date
    const expiry =
      text.match(/VALID UNTIL\s*[:\s]*([0-9/]+)/)?.[1]?.trim() || null;

    // Combine names
    const extractedName = [firstName, middleName, lastName]
      .filter(Boolean)
      .join(" ");

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
