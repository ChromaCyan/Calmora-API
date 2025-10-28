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

    // Normalize text
    const lines = parsedResults.ParsedText
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    // Filter out irrelevant lines
    const ignoreWords = ["LAST NAME", "FIRST NAME", "MIDDLE NAME", "REGISTRAT", "REGISTRATION"];
    const nameLines = lines.filter(line => 
      !ignoreWords.some(word => line.toUpperCase().includes(word)) &&
      /^[A-Z\s]+(JR|SR)?$/.test(line.toUpperCase()) // keep only lines that look like names
    );

    // Deduplicate consecutive duplicates
    const uniqueNames = [...new Set(nameLines)];

    const extractedName = uniqueNames.join(" ").trim() || null;

    // Extract profession
    const profession = lines.join(" ").match(/MEDICAL TECHNOLOGIST|PSYCHOLOGIST|PHYSICIAN|COUNSELOR|THERAPIST|OCCUPATIONAL THERAPY/i)?.[0] || null;

    // Extract registration number (5+ digits)
    const licenseNumber =
      lines.join(" ").match(/REGISTRAT[^\n]*\n.*?(\d{5,})/)?.[1]?.trim() ||
      lines.join(" ").match(/\b\d{5,}\b/)?.[0] ||
      null;

    return {
      extractedName,
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
