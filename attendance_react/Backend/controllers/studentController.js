const Attendance = require('../Models/Attendance');

const getMonthlyAttendance = async (req, res) => {
  const { studentId, month } = req.params;
  try {
    const records = await Attendance.find({
      student: studentId,
      date: { $regex: `^${month}` } // format: 'YYYY-MM'
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

module.exports = { getMonthlyAttendance };