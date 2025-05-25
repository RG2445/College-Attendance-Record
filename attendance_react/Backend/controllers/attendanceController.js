const Attendance = require('../Models/Attendance');

const getAttendanceBySubject = async (req, res) => {
  try {
    const records = await Attendance.find({ subject: req.params.subjectId });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subject attendance' });
  }
};

module.exports = { getAttendanceBySubject };
