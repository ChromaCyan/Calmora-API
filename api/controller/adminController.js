const Specialist = require('../model/specialistModel');

// Get all specialists (for admin)
exports.getAllSpecialists = async (req, res) => {
  try {
    const specialists = await Specialist.find({}, '-password');
    res.status(200).json({ success: true, data: specialists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get pending specialists (for admin)
exports.getPendingSpecialists = async (req, res) => {
  try {
    const pendingSpecialists = await Specialist.find({ approvalStatus: 'pending' }, '-password');
    res.status(200).json({ success: true, data: pendingSpecialists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve a specialist
exports.approveSpecialist = async (req, res) => {
  const { specialistId } = req.params;
  try {
    const specialist = await Specialist.findByIdAndUpdate(
      specialistId,
      { approvalStatus: 'approved' },
      { new: true, runValidators: true }
    );

    if (!specialist) {
      return res.status(404).json({ success: false, message: 'Specialist not found' });
    }

    res.status(200).json({ success: true, data: specialist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reject a specialist
exports.rejectSpecialist = async (req, res) => {
  const { specialistId } = req.params;
  try {
    const specialist = await Specialist.findByIdAndUpdate(
      specialistId,
      { approvalStatus: 'rejected' },
      { new: true, runValidators: true }
    );

    if (!specialist) {
      return res.status(404).json({ success: false, message: 'Specialist not found' });
    }

    res.status(200).json({ success: true, data: specialist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};