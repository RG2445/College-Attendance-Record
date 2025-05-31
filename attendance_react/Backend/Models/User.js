//This model handles login credentials and role-based access

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], required: true }
});

userSchema.pre('save',async function(next){
    const user=this;

    if(!user.isModified('password')) return next();   //if password not modified

    //if password is modified or new
    try{
        //salt generation
        const salt=await bcrypt.genSalt(10);
        //hash password
        const hashedPassword=await bcrypt.hash(user.password,salt);
        //override plain passord with that hashed password in our database
        user.password=hashedPassword;
        next();
    }
    catch(error){
        return next(error);
    }
})

userSchema.methods.comparePassword=async function(userPassword){
    try{
        const isMatch=await bcrypt.compare(userPassword,this.password);
        return isMatch;
    }
    catch(error){
        throw error;
    }
}

module.exports = mongoose.model('User', userSchema);
