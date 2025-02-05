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
    const totalScore = responses.reduce((sum, response) => sum + response.score, 0);

    // Interpretation of Scores
    let interpretation = "Minimal or No Signs of Mental Health Problems";
    if (totalScore >= 5 && totalScore <= 9) {
      interpretation = "Mild Mental Health Concerns";
    } else if (totalScore >= 10 && totalScore <= 14) {
      interpretation = "Moderate Mental Health Concerns";
    } else if (totalScore >= 15) {
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
    const results = await SurveyResponse.find({ patientId }).populate("surveyId");
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
