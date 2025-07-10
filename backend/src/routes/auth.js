const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('../config/passport');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, username, firstName, lastName } = req.body;

    // Validate input
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check if username is taken
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Create user
    const user = new User({
      email,
      password,
      username,
      firstName: firstName || '',
      lastName: lastName || '', 
      profileCompleted: true, 
      totalTests: 0,
      averageWPM: 0,
      averageAccuracy: 0,
      bestWPM: 0,
      bestAccuracy: 0
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      id: user._id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profileCompleted: user.profileCompleted,
      totalTests: user.totalTests,
      averageWPM: user.averageWPM,
      averageAccuracy: user.averageAccuracy,
      bestWPM: user.bestWPM,
      bestAccuracy: user.bestAccuracy,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      token,
      id: user._id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profileCompleted: user.profileCompleted,
      totalTests: user.totalTests,
      averageWPM: user.averageWPM,
      averageAccuracy: user.averageAccuracy,
      bestWPM: user.bestWPM,
      bestAccuracy: user.bestAccuracy
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profileCompleted: user.profileCompleted,
      totalTests: user.totalTests,
      averageWPM: user.averageWPM,
      averageAccuracy: user.averageAccuracy,
      bestWPM: user.bestWPM,
      bestAccuracy: user.bestAccuracy,
      createdAt: user.createdAt // Add createdAt to /me response
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user stats
router.put('/stats', auth, async (req, res) => {
  try {
    const { wpm, accuracy } = req.body;

    if (typeof wpm !== 'number' || typeof accuracy !== 'number') {
      return res.status(400).json({ error: 'WPM and accuracy must be numbers' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update stats
    user.totalTests += 1;
    user.averageWPM = ((user.averageWPM * (user.totalTests - 1)) + wpm) / user.totalTests;
    user.averageAccuracy = ((user.averageAccuracy * (user.totalTests - 1)) + accuracy) / user.totalTests;
    user.bestWPM = Math.max(user.bestWPM, wpm);
    user.bestAccuracy = Math.max(user.bestAccuracy, accuracy);

    await user.save();

    res.json({
      id: user._id,
      email: user.email,
      username: user.username,
      totalTests: user.totalTests,
      averageWPM: user.averageWPM,
      averageAccuracy: user.averageAccuracy,
      bestWPM: user.bestWPM,
      bestAccuracy: user.bestAccuracy
    });
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// OAuth routes
router.get('/oauth2/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

router.get('/oauth2/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, generate JWT token
    const token = generateToken(req.user._id);
    
    // Always redirect to OAuth callback handler in frontend
    res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${token}`);
  }
);

router.get('/oauth2/github', passport.authenticate('github', { 
  scope: ['user:email'] 
}));

router.get('/oauth2/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, generate JWT token
    const token = generateToken(req.user._id);
    
    // Always redirect to OAuth callback handler in frontend
    res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${token}`);
  }
);

// Complete profile for OAuth users
router.post('/complete-profile', auth, async (req, res) => {
  try {
    const { fullName, username } = req.body;

    // Validate input
    if (!fullName || !username) {
      return res.status(400).json({ error: 'Full name and username are required' });
    }

    // Validate username format
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
    }

    // Check if username is already taken by another user
    const existingUser = await User.findOne({ 
      username: username, 
      _id: { $ne: req.user.userId } 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Update user profile
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Parse full name
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    user.firstName = firstName;
    user.lastName = lastName;
    user.username = username;
    user.profileCompleted = true;

    await user.save();

    res.json({
      message: 'Profile completed successfully',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profileCompleted: user.profileCompleted,
        totalTests: user.totalTests,
        averageWPM: user.averageWPM,
        averageAccuracy: user.averageAccuracy,
        bestWPM: user.bestWPM,
        bestAccuracy: user.bestAccuracy
      }
    });
  } catch (error) {
    console.error('Profile completion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check username availability
router.get('/check-username/:username', auth, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Check if username is taken by another user
    const existingUser = await User.findOne({ 
      username: username, 
      _id: { $ne: req.user.userId } 
    });
    
    res.json({ available: !existingUser });
  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
