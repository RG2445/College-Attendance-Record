const express = require('express');
const router = express.Router();
const { jwtAuthMiddleware } = require('./../jwt.js');
const User = require('../Models/User');
const Student = require('../Models/Student');
const Teacher = require('../Models/Teacher');
const Class = require('../Models/Class');
const Subject = require('../Models/Subject');
const Attendance = require('../Models/Attendance');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// Get dashboard statistics
router.get('/stats', jwtAuthMiddleware, isAdmin, async (req, res) => {
  try {
    const [studentCount, teacherCount, classCount, subjectCount] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Class.countDocuments(),
      Subject.countDocuments()
    ]);

    // Get recent attendance stats
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await Attendance.countDocuments({ date: today });

    res.json({ 
      students: studentCount, 
      teachers: teacherCount, 
      classes: classCount,
      subjects: subjectCount,
      todayAttendance
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// ========== USER MANAGEMENT ==========

// Get all users
router.get('/users', jwtAuthMiddleware, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create a new user (generic)
router.post('/users', jwtAuthMiddleware, isAdmin, async (req, res) => {
  const { email, password, role } = req.body;
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const newUser = new User({ email, password, role });
    await newUser.save();
    
    res.status(201).json({ 
      message: 'User created successfully',
      user: { id: newUser._id, email: newUser.email, role: newUser.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Delete user
router.delete('/users/:id', jwtAuthMiddleware, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Find user and related profiles
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete related profiles based on role
    if (user.role === 'student') {
      const student = await Student.findOne({ user: userId });
      if (student) {
        // Remove from class
        if (student.classId) {
          await Class.findByIdAndUpdate(student.classId, {
            $pull: { students: student._id }
          });
        }
        // Delete attendance records
        await Attendance.deleteMany({ student: student._id });
        await Student.findByIdAndDelete(student._id);
      }
    } else if (user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: userId });
      if (teacher) {
        // Remove teacher from subjects
        await Subject.updateMany(
          { teacher: teacher._id },
          { $unset: { teacher: 1 } }
        );
        await Teacher.findByIdAndDelete(teacher._id);
      }
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ========== CLASS MANAGEMENT ==========

// Get all classes
router.get('/classes', jwtAuthMiddleware, isAdmin, async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('students', 'name branch')
      .select('-__v');
    res.json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Create a new class
router.post('/classes', jwtAuthMiddleware, isAdmin, async (req, res) => {
  const { name, branch, students = [] } = req.body;
  
  try {
    const newClass = new Class({ name, branch, students });
    await newClass.save();
    
    // Update students' classId
    if (students.length > 0) {
      await Student.updateMany(
        { _id: { $in: students } },
        { classId: newClass._id }
      );
    }
    
    res.status(201).json({ 
      message: 'Class created successfully', 
      class: newClass 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// Update class
router.put('/classes/:id', jwtAuthMiddleware, isAdmin, async (req, res) => {
  try {
    const { name, branch, students } = req.body;
    
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      { name, branch, students },
      { new: true, runValidators: true }
    ).populate('students', 'name branch');
    
    if (!updatedClass) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    // Update students' classId
    if (students) {
      // Remove classId from students not in the list
      await Student.updateMany(
        { classId: req.params.id, _id: { $nin: students } },
        { $unset: { classId: 1 } }
      );
      
      // Add classId to students in the list
      await Student.updateMany(
        { _id: { $in: students } },
        { classId: req.params.id }
      );
    }
    
    res.json({ message: 'Class updated successfully', class: updatedClass });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update class' });
  }
});

// Delete class
router.delete('/classes/:id', jwtAuthMiddleware, isAdmin, async (req, res) => {
  try {
    const classObj = await Class.findByIdAndDelete(req.params.id);
    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    // Remove classId from students
    await Student.updateMany(
      { classId: req.params.id },
      { $unset: { classId: 1 } }
    );
    
    res.json({ message: 'Class deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

// ========== SUBJECT MANAGEMENT ==========

// Get all subjects
router.get('/subjects', jwtAuthMiddleware, isAdmin, async (req, res) => {
  try {
    const subjects = await Subject.find()
      .populate('teacher', 'name')
      .select('-__v');
    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Create a new subject
router.post('/subjects', jwtAuthMiddleware, isAdmin, async (req, res) => {
  const { name, code, teacher } = req.body;
  
  try {
    const newSubject = new Subject({ name, code, teacher });
    await newSubject.save();
    
    // Update teacher's subjects array
    if (teacher) {
      await Teacher.findByIdAndUpdate(teacher, {
        $addToSet: { subjects: newSubject._id }
      });
    }
    
    res.status(201).json({ 
      message: 'Subject created successfully', 
      subject: newSubject 
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      res.status(400).json({ error: 'Subject code already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create subject' });
    }
  }
});

// Update subject
router.put('/subjects/:id', jwtAuthMiddleware, isAdmin, async (req, res) => {
  try {
    const { name, code, teacher } = req.body;
    const subjectId = req.params.id;
    
    const oldSubject = await Subject.findById(subjectId);
    if (!oldSubject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    // Update subject
    const updatedSubject = await Subject.findByIdAndUpdate(
      subjectId,
      { name, code, teacher },
      { new: true, runValidators: true }
    ).populate('teacher', 'name');
    
    // Handle teacher changes
    if (oldSubject.teacher && oldSubject.teacher.toString() !== teacher) {
      // Remove from old teacher
      await Teacher.findByIdAndUpdate(oldSubject.teacher, {
        $pull: { subjects: subjectId }
      });
    }
    
    if (teacher && teacher !== oldSubject.teacher?.toString()) {
      // Add to new teacher
      await Teacher.findByIdAndUpdate(teacher, {
        $addToSet: { subjects: subjectId }
      });
    }
    
    res.json({ message: 'Subject updated successfully', subject: updatedSubject });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      res.status(400).json({ error: 'Subject code already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update subject' });
    }
  }
});

// Delete subject
router.delete('/subjects/:id', jwtAuthMiddleware, isAdmin, async (req, res) => {
  try {
    const subjectId = req.params.id;
    const subject = await Subject.findById(subjectId);
    
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    // Remove from teacher's subjects array
    if (subject.teacher) {
      await Teacher.findByIdAndUpdate(subject.teacher, {
        $pull: { subjects: subjectId }
      });
    }
    
    // Delete all attendance records for this subject
    await Attendance.deleteMany({ subject: subjectId });
    
    // Delete the subject
    await Subject.findByIdAndDelete(subjectId);
    
    res.json({ message: 'Subject deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

// Assign subject to teacher
router.post('/assign-subject', jwtAuthMiddleware, isAdmin, async (req, res) => {
  const { subjectId, teacherId } = req.body;

  try {
    // Update the subject's teacher field
    const subject = await Subject.findByIdAndUpdate(
      subjectId, 
      { teacher: teacherId }, 
      { new: true }
    ).populate('teacher', 'name');

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Update the teacher's subjects array
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    if (!teacher.subjects.includes(subjectId)) {
      teacher.subjects.push(subjectId);
      await teacher.save();
    }

    res.json({ message: 'Subject assigned to teacher successfully', subject });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to assign subject' });
  }
});

// Remove subject from teacher
router.post('/unassign-subject', jwtAuthMiddleware, isAdmin, async (req, res) => {
  const { subjectId, teacherId } = req.body;

  try {
    // Remove teacher from subject
    const subject = await Subject.findByIdAndUpdate(
      subjectId, 
      { $unset: { teacher: 1 } }, 
      { new: true }
    );

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Remove subject from teacher's subjects array
    await Teacher.findByIdAndUpdate(teacherId, {
      $pull: { subjects: subjectId }
    });

    res.json({ message: 'Subject unassigned from teacher successfully', subject });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to unassign subject' });
  }
});

// ========== REPORTS AND ANALYTICS ==========

// Get attendance report by date range
router.get('/reports/attendance', jwtAuthMiddleware, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate, subjectId, classId } = req.query;
    
    let matchCondition = {};
    
    if (startDate && endDate) {
      matchCondition.date = { $gte: startDate, $lte: endDate };
    }
    
    if (subjectId) {
      matchCondition.subject = new require('mongoose').Types.ObjectId(subjectId);
    }

    let pipeline = [
      { $match: matchCondition },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subject',
          foreignField: '_id',
          as: 'subjectInfo'
        }
      },
      {
        $project: {
          date: 1,
          status: 1,
          student: { $arrayElemAt: ['$studentInfo', 0] },
          subject: { $arrayElemAt: ['$subjectInfo', 0] }
        }
      }
    ];

    // Filter by class if specified
    if (classId) {
      pipeline.splice(3, 0, {
        $match: { 'student.classId': new require('mongoose').Types.ObjectId(classId) }
      });
    }

    const report = await Attendance.aggregate(pipeline);
    
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate attendance report' });
  }
});

// Get low attendance students (below threshold)
router.get('/reports/low-attendance', jwtAuthMiddleware, isAdmin, async (req, res) => {
  try {
    const { threshold = 75, subjectId } = req.query;
    
    let matchCondition = {};
    if (subjectId) {
      matchCondition.subject = new require('mongoose').Types.ObjectId(subjectId);
    }

    const lowAttendanceStudents = await Attendance.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: { student: '$student', subject: '$subject' },
          totalClasses: { $sum: 1 },
          presentClasses: {
            $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          attendancePercentage: {
            $multiply: [
              { $divide: ['$presentClasses', '$totalClasses'] },
              100
            ]
          }
        }
      },
      {
        $match: { attendancePercentage: { $lt: parseFloat(threshold) } }
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id.student',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id.subject',
          foreignField: '_id',
          as: 'subject'
        }
      },
      {
        $project: {
          student: { $arrayElemAt: ['$student', 0] },
          subject: { $arrayElemAt: ['$subject', 0] },
          totalClasses: 1,
          presentClasses: 1,
          attendancePercentage: { $round: ['$attendancePercentage', 2] }
        }
      },
      { $sort: { attendancePercentage: 1 } }
    ]);

    res.json(lowAttendanceStudents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch low attendance report' });
  }
});

// Get attendance summary by class
router.get('/reports/class-summary', jwtAuthMiddleware, isAdmin, async (req, res) => {
  try {
    const { classId } = req.query;
    
    let matchCondition = {};
    if (classId) {
      // First get students in the class
      const classObj = await Class.findById(classId).populate('students');
      if (!classObj) {
        return res.status(404).json({ error: 'Class not found' });
      }
      
      const studentIds = classObj.students.map(student => student._id);
      matchCondition.student = { $in: studentIds };
    }

    const summary = await Attendance.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$subject',
          totalClasses: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] }
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
          presentCount: 1,
          absentCount: 1,
          attendancePercentage: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$presentCount', '$totalClasses'] },
                  100
                ]
              },
              2
            ]
          }
        }
      },
      { $sort: { 'subject.name': 1 } }
    ]);

    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch class summary' });
  }
});

module.exports = router;