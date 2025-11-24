const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../src/config/database');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Test route
router.get('/', (req, res) => {
  res.json({ message: 'Auth route working!' });
});

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      userType,
      companyName,
      position,
      department,
      bio,
      planType
    } = req.body;

    if (!email || !password || !fullName || !userType) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if email exists
    const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (email, password_hash, full_name, user_type) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, fullName, userType]
    );

    const userId = result.insertId;

    // Create profile based on user type
    if (userType === 'recruiter') {
      if (!companyName || !position || !department) {
        return res.status(400).json({ error: 'Recruiter fields are required' });
      }

      const normalizedPlanType = (planType === 'case_only' || planType === 'full') ? planType : 'full';

      await db.query(
        'INSERT INTO recruiter_profiles (user_id, company_name, position, department, bio, plan_type) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, companyName, position, department, bio || null, normalizedPlanType]
      );
    } else if (userType === 'applicant') {
      await db.query(
        'INSERT INTO applicant_profiles (user_id, preferred_language) VALUES (?, ?)',
        [userId, 'en'] // Default to English, can be updated later
      );
    }

    res.status(201).json({ message: 'User created successfully', userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Regular Login route (for recruiters and applicants with permanent passwords)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];

    // Compare password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, userType: user.user_type },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '12h' }
    );

    let recruiterPlanType = null;
    if (user.user_type === 'recruiter') {
      try {
        const [rp] = await db.query(
          'SELECT plan_type FROM recruiter_profiles WHERE user_id = ? LIMIT 1',
          [user.id]
        );
        recruiterPlanType = rp && rp.length ? rp[0].plan_type : null;
      } catch (e) {
        recruiterPlanType = null;
      }
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        userType: user.user_type,
        planType: recruiterPlanType,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Applicant Login (handles both temp password and permanent password)
router.post('/applicant/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log(`🔐 Applicant login attempt for: ${email}`);

    // Find user
    const [userRows] = await db.query(
      'SELECT id, email, full_name, user_type, password_hash FROM users WHERE email = ? AND user_type = "applicant"',
      [email]
    );

    if (userRows.length === 0) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userRows[0];
    let isValidPassword = false;

    // 1️⃣ Try regular permanent password first
    try {
      isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (isValidPassword) {
        console.log(`✅ Login with permanent password: ${email}`);
      }
    } catch (err) {
      console.log(`⚠️ Permanent password check failed, trying temp password...`);
    }

    // 2️⃣ If permanent password fails, try temp password from case study invitation
    if (!isValidPassword) {
      console.log(`🔍 Checking for temp password in case study invitations...`);
      
      const [invitations] = await db.query(
        `SELECT csi.temp_password, csi.expires_at, csi.status
         FROM case_study_invitations csi
         JOIN job_applications ja ON csi.job_application_id = ja.id
         WHERE ja.email = ?
         ORDER BY csi.created_at DESC
         LIMIT 1`,
        [email]
      );

      if (invitations && invitations.length > 0) {
        const invitation = invitations[0];
        
        console.log(`📋 Found invitation: expires ${invitation.expires_at}, status: ${invitation.status}`);
        
        // Check if temp password is still valid (not expired)
        if (new Date(invitation.expires_at) > new Date()) {
          try {
            isValidPassword = await bcrypt.compare(password, invitation.temp_password);
            if (isValidPassword) {
              console.log(`✅ Login with temp password: ${email}`);
            } else {
              console.log(`❌ Temp password doesn't match`);
            }
          } catch (tempErr) {
            console.log(`⚠️ Temp password check error:`, tempErr.message);
          }
        } else {
          console.log(`⏰ Temp password expired`);
        }
      } else {
        console.log(`❌ No case study invitation found for ${email}`);
      }
    }

    // If both password attempts failed
    if (!isValidPassword) {
      console.log(`❌ All password attempts failed for ${email}`);
      return res.status(401).json({ 
        error: 'Invalid email or password. If you used a temporary password, it may have expired.' 
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, user_type: user.user_type },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '7d' }
    );

    console.log(`✅ Login successful for ${email}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        userType: user.user_type,
      },
    });

  } catch (err) {
    console.error('❌ Applicant login error:', err);
    res.status(500).json({ error: 'Something went wrong during login' });
  }
});

module.exports = router;