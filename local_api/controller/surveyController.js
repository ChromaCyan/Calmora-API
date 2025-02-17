const Survey = require("../model/surveyModel");
const SurveyResponse = require("../model/surveyResponse");

// Create a new survey
exports.createSurvey = async (req, res) => {
  const { category, questions } = req.body;

  try {
    const survey = new Survey({ category, questions });
    await survey.save();
    res.status(201).json({ success: true, data: survey });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all surveys
exports.getSurveys = async (req, res) => {
  try {
    const surveys = await Survey.find();
    res.status(200).json({ success: true, data: surveys });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Submit a survey response
exports.submitSurveyResponse = async (req, res) => {
  const { patientId, surveyId, responses, category } = req.body;

  try {
    const totalScore = responses.reduce(
      (sum, response) => sum + response.score,
      0
    );

    let interpretation = "Severe Mental Health Concerns";
    if (totalScore >= 85 && totalScore <= 100) {
      interpretation = "Minimal or No Signs of Mental Health Problems";
    } else if (totalScore >= 70 && totalScore < 85) {
      interpretation = "Mild Mental Health Concerns";
    } else if (totalScore >= 50 && totalScore < 70) {
      interpretation = "Moderate Mental Health Concerns";
    } else if (totalScore < 50) {
      interpretation = "Severe Mental Health Concerns";
    }

    // Save Survey Response
    const surveyResponse = new SurveyResponse({
      patient: patientId,
      surveyId,
      responses,
      totalScore,
      category,
      interpretation,
    });

    await surveyResponse.save();
    res.status(201).json({ success: true, data: surveyResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Survey Results for a Patient
exports.getPatientSurveyResults = async (req, res) => {
  const { patientId } = req.params;

  try {
    const results = await SurveyResponse.find({ patientId }).populate(
      "surveyId"
    );
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get recommended articles based on the latest survey interpretation
exports.getRecommendedArticles = async (req, res) => {
  try {
    const { id: patientId } = req.params;

    // Fetch the latest survey response for the patient
    const latestSurvey = await SurveyResponse.findOne({ patient: patientId })
      .sort({ createdAt: -1 })
      .select("interpretation");

    if (!latestSurvey) {
      return res.status(404).json({ message: "No survey responses found" });
    }

    const categoryMapping = {
      "Minimal or No Signs of Mental Health Problems": ["growth", "mental wellness"],
      "Mild Mental Health Concerns": ["coping strategies", "self-care"],
      "Moderate Mental Health Concerns": ["mental wellness", "coping strategies"],
      "Severe Mental Health Concerns": ["mental wellness", "coping strategies", "self-care"],
    };

    const categoriesToRecommend = categoryMapping[latestSurvey.interpretation] || [];

    if (categoriesToRecommend.length === 0) {
      return res.status(404).json({ message: "No relevant articles found" });
    }

    const recommendedArticles = await Article.find({
      categories: { $in: categoriesToRecommend },
    }).populate("specialistId", "firstName lastName profileImage");

    res.status(200).json(recommendedArticles);
  } catch (error) {
    res.status(500).json({ message: "Error fetching recommended articles", error: error.message });
  }
};