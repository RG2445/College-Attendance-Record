const Attendance = require('../Models/Attendance');

const markAttendance = async (req, res) => {
  const { subjectId, date, attendanceList } = req.body;
  try {
    for (const record of attendanceList) {
      const { studentId, status } = record;
      await Attendance.findOneAndUpdate(
        { student: studentId, subject: subjectId, date },
        { student: studentId, subject: subjectId, date, status },
        { upsert: true, new: true }
      );
    }
    res.json({ message: 'Attendance marked successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

module.exports = { markAttendance };
