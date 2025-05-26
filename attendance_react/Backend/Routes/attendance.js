const express = require('express');
const router = express.Router();
const Attendance = require('../Models/Attendance');

// Get attendance by subject
router.get('/subject/:subjectId', async (req, res) => {
  try {
    const records = await Attendance.find({ subject: req.params.subjectId });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subject attendance' });
  }
});

module.exports = router;