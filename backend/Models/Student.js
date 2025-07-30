//This model stores information about students

const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: String,
  enrollmentNumber: {type:String,unique:true},
  branch: String,
  // optionally link with User model:
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
    classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }
});

module.exports = mongoose.model('Student', studentSchema);
