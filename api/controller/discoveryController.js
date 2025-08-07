const User = require("../model/userModel");

// Fetch all specialists
async function getSpecialists() {
  const specialists = await User.find({ userType: 'specialist' }).select(
    'firstName lastName email gender specialization licenseNumber bio yearsOfExperience languagesSpoken availability reviews'
  );
  return specialists;
}

// Fetch a specialist by ID
async function getSpecialistById(specialistId) {
  const specialist = await User.findById(specialistId).select(
    'firstName lastName email specialization licenseNumber bio yearsOfExperience languagesSpoken availability reviews'
  );
  if (!specialist) {
    throw new Error('Specialist not found');
  }
  return specialist;
}

// Update specialist profile
async function updateSpecialistProfile(specialistId, updateData) {
  const updatedSpecialist = await User.findByIdAndUpdate(specialistId, updateData, { new: true })
    .select('firstName lastName email specialization licenseNumber bio yearsOfExperience languagesSpoken availability reviews');
  
  if (!updatedSpecialist) {
    throw new Error('Specialist not found');
  }
  return updatedSpecialist;
}

// Add a review to a specialist
async function addReview(specialistId, reviewData) {
  const { rating, comment, reviewerName } = reviewData;

  const specialist = await User.findById(specialistId);

  if (!specialist) {
    throw new Error('Specialist not found');
  }
  specialist.reviews.push({ rating, comment, reviewerName });

  const totalReviews = specialist.reviews.length;
  const avgRating = specialist.reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews;

  specialist.averageRating = avgRating;

  await specialist.save();
  return specialist;
}

module.exports = {
  getSpecialists,
  getSpecialistById,
  updateSpecialistProfile,
  addReview,
};
