const express = require('express');
const router = express.Router();
const User = require('../Models/User');
const jwt = require('jsonwebtoken');
const {generateToken}=require('./../jwt.js')

require('dotenv').config();

// Login Route
router.post('/login', async (req,res)=>{
    let success=false;
    try{
        const {email,password}=req.body;
        const user=await User.findOne({email:email})

        if(!user || !(await user.comparePassword(password))){
            return res.status(401).json({success,error: 'Invalid email or password'})
        }

        const payload={
            id: user.id,
            email: user.email
        }
        const token=generateToken(payload)
        success=true
        res.json({success,token,role:user.role})
    }
    catch(err){
        console.log(err);
        res.status(500).json({err:"Internal Server Error"})
    }
})


router.post('/signup', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // Create and save new user
    const newUser = new User({ email, password, role });
    await newUser.save();

    // Generate JWT token
    const token = generateToken({ id: newUser._id, role: newUser.role });
    res.status(201).json({ token, role: newUser.role });

  } catch (err) {
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
});

module.exports = router;

