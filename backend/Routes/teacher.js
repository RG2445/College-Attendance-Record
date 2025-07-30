
const express = require('express');
const router = express.Router();
const { jwtAuthMiddleware } = require('./../jwt.js');
const Attendance = require('../Models/Attendance');
const Subject = require('../Models/Subject');
const Teacher = require('../Models/Teacher');
const Student = require('../Models/Student');
const User = require('../Models/User');
const mongoose = require('mongoose');

//-------------------------------------------------------------------------------------------------------------------//

// Create a new teacher (Admin only)
router.post('/create', jwtAuthMiddleware, async (req, res) => {
  try {
    const { email, password, name, subjects = [] } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const newUser = new User({
      email,
      password,
      role: 'teacher'
    });
    await newUser.save();

    const newTeacher = new Teacher({
      user: newUser._id,
      name,
      subjects
    });
    await newTeacher.save();

    if (subjects.length > 0) {
      await Subject.updateMany(
        { _id: { $in: subjects } },
        { teacher: newTeacher._id }
      );
    }

    res.status(201).json({ 
      message: 'Teacher created successfully', 
      teacher: newTeacher 
    });
  }
  catch (err) {
    res.status(500).json({ error: 'Failed to create teacher' });
  }
});

// Get all teachers (Admin)
router.get('/', jwtAuthMiddleware, async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate('user', 'email')
      .populate('subjects', 'name code')
      .select('-__v');
    
    res.json(teachers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

//----------------------------------------------------------------------------------------------------------------------------------------------//

// Get current teacher's profile
router.get('/profile/me', jwtAuthMiddleware, async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user.id })
      .populate('user', 'email')
      .populate('subjects', 'name code');
    
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }
    
    res.json(teacher);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get teacher's subjects
router.get("/subjects", jwtAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const teacher = await Teacher.findOne({ user: userId });
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }
    
    const subjects = await Subject.find({ teacher: teacher._id });
    res.json(subjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

// Get students for a specific subject (for attendance marking)
router.get('/subject/:subjectId/students', jwtAuthMiddleware, async (req, res) => {
  try {
    const { subjectId } = req.params;
    const userId = req.user.id;

    // Verify teacher has access to this subject
    const teacher = await Teacher.findOne({ user: userId });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const subject = await Subject.findOne({ 
      _id: subjectId, 
      teacher: teacher._id 
    });
    
    if (!subject) {
      return res.status(403).json({ error: 'Access denied to this subject' });
    }

    // Get all students (you might want to filter by class/branch based on subject)
    const students = await Student.find()
      .populate('user', 'email')
      .select('name enrollmentNumber user');
    
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});


router.post('/attendance-by-date', require('./../jwt.js').jwtAuthMiddleware, async (req, res) => {
  const { subjectId, date } = req.body;
  if (!subjectId || !date) {
    return res.status(400).json({ error: "Subject ID and date are required." });
  }

  try {
    // Find attendance for the subject and date
    const attendance = await Attendance.findOne({ subject: subjectId, date })
      .populate({
        path: 'records.student',
        select: 'name enrollmentNumber'
      });

    if (!attendance) {
      return res.status(200).json({ records: [] }); // No attendance found for this date
    }

    // Return attendance records with student info
    return res.status(200).json({
      records: attendance.records.map(r => ({
        student: {
          _id: r.student._id,
          name: r.student.name,
          enrollmentNumber: r.student.enrollmentNumber
        },
        status: r.status
      }))
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error fetching attendance." });
  }
});

// POST /api/teachers/mark-attendance
router.post('/mark-attendance', jwtAuthMiddleware, async (req, res) => {
  try {
    const { subjectId, date, attendanceList } = req.body;

    if (!subjectId || !date || !Array.isArray(attendanceList)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const formattedDate = new Date(date);

    // Check if attendance already exists for subject + date
    const existing = await Attendance.findOne({ subject: subjectId, date: formattedDate });
    if (existing) {
      return res.status(400).json({ error: 'Attendance already marked for this subject on this date.' });
    }

    // Build records array
    const records = attendanceList.map(entry => ({
      student: entry.studentId,
      status: entry.status.charAt(0).toUpperCase() + entry.status.slice(1) // "present" => "Present"
    }));

    const newAttendance = new Attendance({
      subject: subjectId,
      date: formattedDate,
      records
    });

    await newAttendance.save();

    res.status(201).json({ message: 'Attendance marked successfully.' });
  } catch (err) {
    console.error('Error in mark-attendance:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Route: Update attendance for a subject on a specific date
router.put('/update-attendance', jwtAuthMiddleware, async (req, res) => {
  try {
    const { subjectId, date, records } = req.body;

    if (!subjectId || !date || !records || records.length === 0) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const attendance = await Attendance.findOne({
      subject: subjectId,
      date: { $gte: startOfDay, $lt: endOfDay },
    });

    if (!attendance) {
      return res.status(404).json({ error: 'Attendance not found for this subject and date.' });
    }

    attendance.records = records;
    await attendance.save();

    res.json({ message: 'Attendance updated successfully.' });
  } catch (error) {
    console.error('Update Attendance Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance records for a specific subject and date
router.get('/attendance/:subjectCode/:date', jwtAuthMiddleware, async (req, res) => {
  try {
    const { subjectCode, date } = req.params;
    const userId = req.user.id;

    // Verify teacher has access to this subject
    const teacher = await Teacher.findOne({ user: userId });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const isoDate = new Date(date);

    const subject = await Subject.findOne({ 
      code: subjectCode, 
      teacher: teacher._id 
    });
    
    if (!subject) {
      return res.status(403).json({ error: 'Access denied to this subject' });
    }

    const attendanceList = await Attendance.find({ 
      subject: subject._id, 
      date: isoDate 
    }).populate('records.student', 'name branch');

    if (!attendanceList || attendanceList.length === 0) {
      return res.status(404).json({ error: 'No attendance records found for this subject on this date' });
    }
    console.log(attendanceList);
    res.json(attendanceList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// Get all attendance records for a subject for a selected month (no pagination)
router.get('/subject/:subjectCode/attendance', jwtAuthMiddleware, async (req, res) => {
  const { subjectCode } = req.params;
  const { month, year } = req.query;

  try {
    const userId = req.user.id;

    // Validate month and year
    if (!month || !year) {
      return res.status(400).json({ error: "Month and year are required" });
    }

    const selectedMonth = parseInt(month) - 1; // JavaScript Date months are 0-indexed
    const selectedYear = parseInt(year);

    if (selectedMonth < 0 || selectedMonth > 11 || isNaN(selectedYear)) {
      return res.status(400).json({ error: "Invalid month or year" });
    }

    const startDate = new Date(selectedYear, selectedMonth, 1); // Start of month
    const endDate = new Date(selectedYear, selectedMonth + 1, 1); // Start of next month

    // Find teacher
    const teacher = await Teacher.findOne({ user: userId });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Check if the teacher teaches the subject
    const subject = await Subject.findOne({ code: subjectCode, teacher: teacher._id });
    if (!subject) {
      return res.status(403).json({ error: 'Access denied to this subject' });
    }

    const subjectId = subject._id;

    // Find all attendance entries for that month
    const attendanceDocs = await Attendance.find({
      subject: subjectId,
      date: { $gte: startDate, $lt: endDate }
    }).sort({ date: 1 }).populate('records.student', 'name branch');

    const formattedRecords = attendanceDocs.map(doc => {
      const presentCount = doc.records.filter(r => r.status === 'Present').length;
      return {
        _id: doc._id,
        date: doc.date,
        presentCount,
        totalMarked: doc.records.length
      };
    });

    const totalPresent = formattedRecords.reduce((sum, rec) => sum + rec.presentCount, 0);

    res.json({
      totalPresent,
      records: formattedRecords
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});


// Get attendance summary for a subject
router.get('/subject/:subjectCode/summary', jwtAuthMiddleware, async (req, res) => {
  const { subjectCode } = req.params;

  try {
    const userId = req.user.id;

    // Find teacher
    const teacher = await Teacher.findOne({ user: userId });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Check if the teacher teaches the subject
    const subject = await Subject.findOne({ code: subjectCode, teacher: teacher._id });
    if (!subject) {
      return res.status(403).json({ error: 'Access denied to this subject' });
    }
    
    const subjectId = subject._id;

    // Get all attendance records for the subject
    const attendanceRecords = await Attendance.find({ subject: subjectId })
      .sort({ date: 1 })
      .populate('records.student', 'name enrollmentNumber');

    if (!attendanceRecords || attendanceRecords.length === 0) {
      return res.status(404).json({ error: 'No attendance records found for this subject' });
    }

    // Aggregate attendance per student
    const studentStats = {};

    attendanceRecords.forEach(record => {
      record.records.forEach(r => {
        const studentId = r.student?._id?.toString();
        if (!studentId) return;
        if (!studentStats[studentId]) {
          studentStats[studentId] = {
            name: r.student.name,
            enrollmentNumber: r.student.enrollmentNumber,
            present: 0,
            total: 0
          };
        }
        studentStats[studentId].total += 1;
        if (r.status === 'Present') {
          studentStats[studentId].present += 1;
        }
      });
    });

// Prepare summary array
const summary = Object.values(studentStats).map(s => ({
  name: s.name,
  enrollmentNumber: s.enrollmentNumber,
  percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
  presentClasses: s.present,
  totalClasses: s.total
}));

    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
});


//-----------------------------------------------------------------------------------------------------------------------------------------//

// Update teacher profile
router.put('/profile', jwtAuthMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    const teacher = await Teacher.findOneAndUpdate(
      { user: userId },
      { name },
      { new: true, runValidators: true }
    ).populate('user', 'email').populate('subjects', 'name code');

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json({ message: 'Profile updated successfully', teacher });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;