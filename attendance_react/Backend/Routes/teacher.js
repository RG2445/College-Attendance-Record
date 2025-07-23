
const express = require('express');
const router = express.Router();
const { jwtAuthMiddleware } = require('./../jwt.js');
const Attendance = require('../Models/Attendance');
const Subject = require('../Models/Subject');
const Teacher = require('../Models/Teacher');
const Student = require('../Models/Student');
const User = require('../Models/User');

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

    const isoDate = new Date(date);

    const subject = await Subject.findOne({ 
      _id: subjectId, 
      teacher: teacher._id 
    });
    
    if (!subject) {
      return res.status(403).json({ error: 'Access denied to this subject' });
    }

    const records = await Attendance.find({ 
      subject: subjectId, 
      isoDate 
    }).populate('student', 'name branch');
    
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// Get all attendance records for a subject 
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

    let filter = { subject: subjectId };
    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }

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

    // Step 1: Verify teacher
    const teacher = await Teacher.findOne({ user: userId });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Step 2: Check if teacher is assigned to this subject
    const subject = await Subject.findOne({ 
      _id: subjectId, 
      teacher: teacher._id 
    });

    if (!subject) {
      return res.status(403).json({ error: 'Access denied to this subject' });
    }

    // Step 3: Aggregate attendance summary
    const summary = await Attendance.aggregate([
      {
        $match: {
          subject: new mongoose.Types.ObjectId(subjectId),
        },
      },
      {
        $group: {
          _id: '$student',
          totalClasses: { $sum: 1 },
          presentClasses: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Present'] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'student',
        },
      },
      {
        $project: {
          student: { $arrayElemAt: ['$student', 0] },
          totalClasses: 1,
          presentClasses: 1,
          attendancePercentage: {
            $multiply: [
              { $divide: ['$presentClasses', '$totalClasses'] },
              100,
            ],
          },
        },
      },
      {
        $sort: { 'student.name': 1 },
      },
    ]);

    res.json(summary);
    
  } catch (err) {
    console.error('Error fetching attendance summary:', err);
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