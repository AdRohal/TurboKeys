const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const TypingTest = require('../models/TypingTest');
const User = require('../models/User');

// Submit a typing test result
router.post('/submit', auth, async (req, res) => {
  try {
    console.log('Received test submission:', req.body);
    console.log('User ID from auth:', req.user.userId);
    
    const { 
      wpm, 
      accuracy, 
      duration, 
      mode, 
      language, 
      difficulty, 
      charactersTyped, 
      errorsCount, 
      correctCharacters, 
      totalCharacters, 
      testText 
    } = req.body;

    // Validate required fields (use proper checks for numbers that can be 0)
    if (wpm === undefined || wpm === null || 
        accuracy === undefined || accuracy === null || 
        !duration || !charactersTyped || !testText) {
      console.log('Validation failed:', { wpm, accuracy, duration, charactersTyped, testText: !!testText });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create typing test record
    const typingTest = new TypingTest({
      userId: req.user.userId,
      wpm: Number(wpm),
      accuracy: Number(accuracy),
      duration: Number(duration),
      mode: mode || 'time',
      language: language || 'english',
      difficulty: difficulty || 'medium',
      charactersTyped: Number(charactersTyped),
      errorsCount: Number(errorsCount) || 0,
      correctCharacters: Number(correctCharacters) || Number(charactersTyped),
      totalCharacters: Number(totalCharacters) || Number(charactersTyped),
      testText
    });

    console.log('Saving typing test:', typingTest);
    await typingTest.save();
    console.log('Typing test saved successfully with ID:', typingTest._id);

    // Update user's best scores
    const user = await User.findById(req.user.userId);
    if (user) {
      console.log('Updating user stats for user:', user.email);
      user.stats.totalTests += 1;
      
      // Update best WPM
      if (Number(wpm) > user.stats.bestWpm) {
        user.stats.bestWpm = Number(wpm);
      }
      
      // Update best accuracy
      if (Number(accuracy) > user.stats.bestAccuracy) {
        user.stats.bestAccuracy = Number(accuracy);
      }
      
      // Calculate new averages
      const allTests = await TypingTest.find({ userId: req.user.userId });
      const totalWpm = allTests.reduce((sum, test) => sum + test.wpm, 0);
      const totalAccuracy = allTests.reduce((sum, test) => sum + test.accuracy, 0);
      
      user.stats.averageWpm = Math.round(totalWpm / allTests.length);
      user.stats.averageAccuracy = Math.round(totalAccuracy / allTests.length);
      
      await user.save();
      console.log('User stats updated successfully');
    }

    const response = {
      id: typingTest._id,
      wpm: typingTest.wpm,
      accuracy: typingTest.accuracy,
      duration: typingTest.duration,
      mode: typingTest.mode,
      language: typingTest.language,
      difficulty: typingTest.difficulty,
      score: typingTest.score,
      completedAt: typingTest.completedAt
    };
    
    console.log('Sending response:', response);
    res.status(201).json(response);
  } catch (error) {
    console.error('Submit test error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get user's typing test history
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, duration, mode, language } = req.query;
    
    // Build filter
    const filter = { userId: req.user.userId };
    if (duration) filter.duration = parseInt(duration);
    if (mode) filter.mode = mode;
    if (language) filter.language = language;

    const tests = await TypingTest.find(filter)
      .sort({ completedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-testText -userId');

    const total = await TypingTest.countDocuments(filter);

    res.json({
      tests,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's best scores by duration
router.get('/best-scores', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const bestScores = await TypingTest.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: { duration: '$duration', mode: '$mode', language: '$language' },
          bestWpm: { $max: '$wpm' },
          bestAccuracy: { $max: '$accuracy' },
          bestScore: { $max: { $multiply: ['$wpm', { $divide: ['$accuracy', 100] }] } },
          testCount: { $sum: 1 },
          latestTest: { $max: '$completedAt' }
        }
      },
      { $sort: { '_id.duration': 1, '_id.mode': 1, '_id.language': 1 } }
    ]);

    res.json(bestScores);
  } catch (error) {
    console.error('Get best scores error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { duration = 30, mode = 'time', language = 'english', limit = 50 } = req.query;
    
    // Get best scores for each user in the specified category
    const leaderboard = await TypingTest.aggregate([
      { 
        $match: { 
          duration: parseInt(duration),
          mode: mode,
          language: language 
        } 
      },
      {
        $group: {
          _id: '$userId',
          bestWpm: { $max: '$wpm' },
          bestAccuracy: { $max: '$accuracy' },
          bestScore: { $max: { $multiply: ['$wpm', { $divide: ['$accuracy', 100] }] } },
          testCount: { $sum: 1 },
          latestTest: { $max: '$completedAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          username: '$user.username',
          avatar: '$user.avatar',
          bestWpm: 1,
          bestAccuracy: 1,
          bestScore: { $round: ['$bestScore', 0] },
          testCount: 1,
          latestTest: 1
        }
      },
      { $sort: { bestWpm: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json(leaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get typing test statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const stats = await TypingTest.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalTests: { $sum: 1 },
          averageWpm: { $avg: '$wpm' },
          averageAccuracy: { $avg: '$accuracy' },
          bestWpm: { $max: '$wpm' },
          bestAccuracy: { $max: '$accuracy' },
          totalCharactersTyped: { $sum: '$charactersTyped' },
          totalErrors: { $sum: '$errorsCount' },
          totalTimeSpent: { $sum: '$duration' }
        }
      }
    ]);

    if (!stats.length) {
      return res.json({
        totalTests: 0,
        averageWpm: 0,
        averageAccuracy: 0,
        bestWpm: 0,
        bestAccuracy: 0,
        totalCharactersTyped: 0,
        totalErrors: 0,
        totalTimeSpent: 0
      });
    }

    const result = stats[0];
    result.averageWpm = Math.round(result.averageWpm);
    result.averageAccuracy = Math.round(result.averageAccuracy);
    result.totalTimeSpent = Math.round(result.totalTimeSpent / 60); // Convert to minutes

    res.json(result);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a typing test
router.delete('/:id', auth, async (req, res) => {
  try {
    const test = await TypingTest.findOne({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    await TypingTest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
