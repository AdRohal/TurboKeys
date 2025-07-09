const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// Get user profile
router.get('/profile', auth, (req, res) => {
  try {
    // In a real app, you'd fetch from database
    // For now, we'll simulate user data
    const user = {
      id: req.userId,
      username: `User${req.userId}`,
      email: `user${req.userId}@example.com`,
      createdAt: new Date('2024-01-01'),
      profile: {
        totalTests: 15,
        averageWpm: 65,
        bestWpm: 89,
        accuracy: 96.5,
        favoriteTestDuration: 60,
        preferredTheme: 'dark'
      }
    };

    res.json({ user });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', auth, (req, res) => {
  try {
    const { username, favoriteTestDuration, preferredTheme } = req.body;

    // In a real app, you'd update the database
    // For now, we'll just return success
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: req.userId,
        username: username || `User${req.userId}`,
        profile: {
          favoriteTestDuration: favoriteTestDuration || 60,
          preferredTheme: preferredTheme || 'dark'
        }
      }
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
