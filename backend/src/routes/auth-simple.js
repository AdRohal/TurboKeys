const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// In-memory user storage (for development without database)
let users = [];
let nextUserId = 1;

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Helper function to find user
const findUserByEmail = (email) => {
  return users.find(user => user.email === email);
};

const findUserByUsername = (username) => {
  return users.find(user => user.username === username);
};

const findUserById = (id) => {
  return users.find(user => user.id === id);
};

// Register endpoint
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 30 }).trim(),
  body('password').isLength({ min: 6 }),
  body('firstName').optional().trim(),
  body('lastName').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUserByEmail = findUserByEmail(email);
    const existingUserByUsername = findUserByUsername(username);

    if (existingUserByEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    if (existingUserByUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = {
      id: nextUserId++,
      email,
      username,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      createdAt: new Date(),
      stats: {
        totalTests: 0,
        bestWpm: 0,
        averageWpm: 0,
        bestAccuracy: 0,
        averageAccuracy: 0
      }
    };

    users.push(newUser);

    // Generate token
    const token = generateToken(newUser.id);

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Remove password from response
    const userResponse = { ...newUser };
    delete userResponse.password;

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Remove password from response
    const userResponse = { ...user };
    delete userResponse.password;

    res.json({
      message: 'Login successful',
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = findUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    // Remove password from response
    const userResponse = { ...user };
    delete userResponse.password;

    res.json({ user: userResponse });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
});

// OAuth endpoints (placeholders for now)
router.get('/google', (req, res) => {
  const googleAuthUrl = `https://accounts.google.com/oauth/authorize?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_CALLBACK_URL}&scope=profile email&response_type=code`;
  res.json({ url: googleAuthUrl });
});

router.get('/github', (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_CALLBACK_URL}&scope=user:email`;
  res.json({ url: githubAuthUrl });
});

module.exports = router;
