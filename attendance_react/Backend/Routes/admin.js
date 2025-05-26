const express = require('express');
const router = express.Router();
const User = require('../Models/User');
const Student = require('../Models/Student');
const Teacher = require('../Models/Teacher');
const Class = require('../Models/Class');
const Subject = require('../Models/Subject');

// Get statistics
router.get('/stats', async (req, res) => {
  try {
    const studentCount = await Student.countDocuments();
    const teacherCount = await Teacher.countDocuments();
    const classCount = await Class.countDocuments();
    res.json({ students: studentCount, teachers: teacherCount, classes: classCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// Add a new user (admin action)
router.post('/add-user', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const newUser = new User({ username, password, role });
    await newUser.save();
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

module.exports = router;
