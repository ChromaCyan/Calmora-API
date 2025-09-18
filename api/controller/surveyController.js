const Survey = require("../model/surveyModel");
const SurveyResponse = require("../model/surveyResponse");
const Article = require("../model/articlesModel");

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
    if (totalScore >= 30) {
      interpretation = "Minimal or No Signs of Mental Health Problems";
    } else if (totalScore >= 22 && totalScore < 30) {
      interpretation = "Mild Mental Health Concerns";
    } else if (totalScore >= 15 && totalScore < 22) {
      interpretation = "Moderate Mental Health Concerns";
    }

    const surveyResponse = new SurveyResponse({
      patient: patientId,
      surveyId,
      responses,
      totalScore,
      category,
      interpretation,
    });

    await surveyResponse.save();

    await Patient.findByIdAndUpdate(patientId, { surveyCompleted: true });

    res.status(201).json({
      success: true,
      data: surveyResponse,
      message: "Survey submitted and flag updated",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// Get Survey Results for a Patient
exports.getLatestPatientSurveyResult = async (req, res) => {
  const { patientId } = req.params;

  console.log("Fetching survey results for patient ID:", patientId);

  try {
    const latestResult = await SurveyResponse.findOne({ patient: patientId })
      .sort({ createdAt: -1 }) 
      .populate("surveyId");

    if (!latestResult) {
      return res.status(404).json({ success: false, message: "No survey responses found for this patient." });
    }

    res.status(200).json({ success: true, data: latestResult });
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

    // Define the mapping of interpretation to article categories
    const categoryMapping = {
      "Minimal or No Signs of Mental Health Problems": ["growth", "mental wellness", "health", "social"],
      "Mild Mental Health Concerns": ["coping strategies", "self-care", "health", "relationships"],
      "Moderate Mental Health Concerns": ["mental wellness", "coping strategies", "self-care", "relationships"],
      "Severe Mental Health Concerns": ["mental wellness", "coping strategies", "self-care"],
    };

    // Get the categories to recommend based on the interpretation
    const categoriesToRecommend = categoryMapping[latestSurvey.interpretation] || [];

    if (categoriesToRecommend.length === 0) {
      return res.status(404).json({ message: "No relevant articles found" });
    }

    // Fetch articles that match the recommended categories
    const recommendedArticles = await Article.find({
      categories: { $in: categoriesToRecommend },
    }).populate("specialistId", "firstName lastName profileImage");

    // Return the articles if found
    if (recommendedArticles.length > 0) {
      return res.status(200).json(recommendedArticles);
    } else {
      return res.status(404).json({ message: "No articles found for the selected categories" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching recommended articles", error: error.message });
  }
};