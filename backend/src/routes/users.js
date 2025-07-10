const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    // Fetch user from database
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, favoriteTestDuration, preferredTheme, firstName, lastName } = req.body;

    // Update user in the database
    const update = {};
    if (username) update.username = username;
    if (firstName) update.firstName = firstName;
    if (lastName) update.lastName = lastName;
    if (favoriteTestDuration) update.favoriteTestDuration = favoriteTestDuration;
    if (preferredTheme) update.preferredTheme = preferredTheme;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: update },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user achievements/badges
router.get('/achievements', auth, (req, res) => {
  try {
    const achievements = [
      {
        id: 1,
        name: 'First Test',
        description: 'Complete your first typing test',
        earned: true,
        earnedAt: new Date('2024-01-01')
      },
      {
        id: 2,
        name: 'Speed Demon',
        description: 'Reach 60 WPM',
        earned: true,
        earnedAt: new Date('2024-01-05')
      },
      {
        id: 3,
        name: 'Accuracy Expert',
        description: 'Achieve 95% accuracy',
        earned: true,
        earnedAt: new Date('2024-01-10')
      },
      {
        id: 4,
        name: 'Century Club',
        description: 'Reach 100 WPM',
        earned: false,
        earnedAt: null
      }
    ];

    res.json({ achievements });

  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
