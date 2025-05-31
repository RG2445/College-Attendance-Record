const express = require('express');
const router = express.Router();
const { jwtAuthMiddleware } = require('./../jwt.js');
const Attendance = require('../Models/Attendance');
const Student = require('../Models/Student');
const User = require('../Models/User');

// Create a new student (Admin only)
router.post('/create', jwtAuthMiddleware, async (req, res) => {
  try {
    const { email, password, name,enrollmentNumber, branch, classId } = req.body;

    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create user account
    const newUser = new User({
      email,
      password,
      role: 'student'
    });
    await newUser.save();

    // Create student profile
    const newStudent = new Student({
      user: newUser._id,
      name,
      branch,
      classId,
      enrollmentNumber
    });
    await newStudent.save();

    // Update class students array if classId provided
    if (classId) {
      const Class = require('../Models/Class');
      await Class.findByIdAndUpdate(classId, {
        $push: { students: newStudent._id }
      });
    }

    res.status(201).json({ 
      message: 'Student created successfully', 
      student: newStudent 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// Get all students (done by Admin/Teacher)
router.get('/', jwtAuthMiddleware, async (req, res) => {
  try {
    const students = await Student.find()
      .populate('user', 'email')
      .populate('classId', 'name')
      .select('-__v');
    
    res.json(students);
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

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

// Get student by ID
router.get('/:id', jwtAuthMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'email')
      .populate('classId', 'name');
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});



// Update student by Id
router.put('/:id', jwtAuthMiddleware, async (req, res) => {
  try {
    const { name, branch, classId } = req.body;
    
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { name, branch, classId },
      { new: true, runValidators: true }
    ).populate('user', 'email').populate('classId', 'name');
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ message: 'Student updated successfully', student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

//Delete student by Id
router.delete('/:id', jwtAuthMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Remove student from class
    if (student.classId) {
      const Class = require('../Models/Class');
      await Class.findByIdAndUpdate(student.classId, {
        $pull: { students: student._id }
      });
    }

    // Delete that student attendance records
    await Attendance.deleteMany({ student: student._id });

    // Delete student and user
    await Student.findByIdAndDelete(req.params.id);
    await User.findByIdAndDelete(student.user);

    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

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

// Get student's overall attendance statistics
router.get('/:studentId/attendance/stats', jwtAuthMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const attendanceStats = await Attendance.aggregate([
      { $match: { student: new require('mongoose').Types.ObjectId(studentId) } },
      {
        $group: {
          _id: '$subject',
          totalClasses: { $sum: 1 },
          presentClasses: {
            $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subject'
        }
      },
      {
        $project: {
          subject: { $arrayElemAt: ['$subject', 0] },
          totalClasses: 1,
          presentClasses: 1,
          attendancePercentage: {
            $multiply: [
              { $divide: ['$presentClasses', '$totalClasses'] },
              100
            ]
          }
        }
      }
    ]);
    
    res.json(attendanceStats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance statistics' });
  }
});

module.exports = router;