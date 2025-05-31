
const express = require('express');
const router = express.Router();
const { jwtAuthMiddleware } = require('./../jwt.js');
const Attendance = require('../Models/Attendance');
const Subject = require('../Models/Subject');
const Teacher = require('../Models/Teacher');
const Student = require('../Models/Student');
const User = require('../Models/User');

// Create a new teacher (Admin only)
router.post('/create', jwtAuthMiddleware, async (req, res) => {
  try {
    const { email, password, name, subjects = [] } = req.body;

    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create user account
    const newUser = new User({
      email,
      password,
      role: 'teacher'
    });
    await newUser.save();

    // Create teacher profile
    const newTeacher = new Teacher({
      user: newUser._id,
      name,
      subjects
    });
    await newTeacher.save();

    // Update subjects to reference this teacher
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
  } catch (err) {
    console.error(err);
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
      .select('name branch user');
    
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Mark attendance
router.post('/mark-attendance', jwtAuthMiddleware, async (req, res) => {
  const { subjectId, date, attendanceList } = req.body;
  
  try {
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

    // Mark attendance for each student
    const attendancePromises = attendanceList.map(async (record) => {
      const { studentId, status } = record;
      return await Attendance.findOneAndUpdate(
        { student: studentId, subject: subjectId, date },
        { student: studentId, subject: subjectId, date, status },
        { upsert: true, new: true }
      );
    });

    await Promise.all(attendancePromises);
    
    res.json({ 
      message: 'Attendance marked successfully',
      count: attendanceList.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Get attendance records for a specific subject and date
router.get('/attendance/:subjectId/:date', jwtAuthMiddleware, async (req, res) => {
  try {
    const { subjectId, date } = req.params;
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

    const records = await Attendance.find({ 
      subject: subjectId, 
      date 
    }).populate('student', 'name branch');
    
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// Get all attendance records for a subject (with pagination)
router.get('/subject/:subjectId/attendance', jwtAuthMiddleware, async (req, res) => {
  const { subjectId } = req.params;
  const { page = 1, limit = 50, startDate, endDate } = req.query;
  
  try {
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

    // Build query filter
    let filter = { subject: subjectId };
    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }

    // Get paginated results
    const skip = (page - 1) * limit;
    const records = await Attendance.find(filter)
      .populate('student', 'name branch')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(filter);

    res.json({
      records,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// Get attendance summary for a subject
router.get('/subject/:subjectId/summary', jwtAuthMiddleware, async (req, res) => {
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

    const summary = await Attendance.aggregate([
      { $match: { subject: new require('mongoose').Types.ObjectId(subjectId) } },
      {
        $group: {
          _id: '$student',
          totalClasses: { $sum: 1 },
          presentClasses: {
            $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $project: {
          student: { $arrayElemAt: ['$student', 0] },
          totalClasses: 1,
          presentClasses: 1,
          attendancePercentage: {
            $multiply: [
              { $divide: ['$presentClasses', '$totalClasses'] },
              100
            ]
          }
        }
      },
      { $sort: { 'student.name': 1 } }
    ]);

    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
});

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