const express = require('express');
const router = express.Router();
const {jwtAuthMiddleware}=require('./../jwt.js')
const Attendance = require('../Models/Attendance');
const Student = require('../Models/Student');

// Get student's monthly attendance report
router.get('/attendance/:studentId/:month', jwtAuthMiddleware, async (req, res) => {
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
});

module.exports = router;