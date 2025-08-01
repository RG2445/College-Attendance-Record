const express = require('express');
const router = express.Router();
const { jwtAuthMiddleware } = require('./../jwt.js');
const Attendance = require('../Models/Attendance');
const Student = require('../Models/Student');
const User = require('../Models/User');
const mongoose=require('mongoose')


// Get current student's profile
router.get('/profile', jwtAuthMiddleware, async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id })
      .populate('user', 'email')
      .populate('classId', 'name');
    
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }
    
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get all subjects for the current student
router.get('/profile/subjects', jwtAuthMiddleware, async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id }).populate('classId');
    if (!student || !student.classId) {
      return res.status(404).json({ error: 'Student or class not found' });
    }

    // Populate subjects from class
    const classWithSubjects = await Class.findById(student.classId._id).populate('subjects');
    res.json(classWithSubjects.subjects || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subjects for student' });
  }
});

// Get student's overall attendance statistics
router.get('/:studentId/attendance/stats', jwtAuthMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }

    const attendanceStats = await Attendance.aggregate([
      { $unwind: "$records" },
      { $match: { "records.student": new mongoose.Types.ObjectId(studentId) } },
      {
        $group: {
          _id: "$subject",
          totalClasses: { $sum: 1 },
          presentClasses: {
            $sum: { $cond: [{ $eq: ["$records.status", "Present"] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: "subjects",
          localField: "_id",
          foreignField: "_id",
          as: "subject"
        }
      },
      {
        $project: {
          subject: { $arrayElemAt: ["$subject", 0] },
          totalClasses: 1,
          presentClasses: 1,
          attendancePercentage: {
            $multiply: [
              { $divide: ["$presentClasses", "$totalClasses"] },
              100
            ]
          }
        }
      }
    ]);

    res.json(attendanceStats);
  } catch (err) {
    console.error('❌ Error in stats route:', err);
    res.status(500).json({ error: 'Failed to fetch attendance statistics' });
  }
});



//----------------------------------------------Currently Unused Routes----------------------------------------------//

// Get student's attendance by subject
router.get('/:studentId/attendance/subject/:subjectId', jwtAuthMiddleware, async (req, res) => {
  const { studentId, subjectId } = req.params;
  try {
    const records = await Attendance.find({
      student: studentId,
      subject: subjectId
    }).populate('subject', 'name code').sort({ date: -1 });
    
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Get student's monthly attendance report
router.get('/attendance/:studentId/:month', jwtAuthMiddleware, async (req, res) => {
  const { studentId, month } = req.params;
  try {
    const records = await Attendance.find({
      student: studentId,
      date: { $regex: `^${month}` } // format: 'YYYY-MM'
    }).populate('subject', 'name code');
    
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

module.exports = router;