require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper function to find user by OAuth ID
const findUserByOAuthId = async (provider, oauthId) => {
  return await User.findOne({ [`${provider}Id`]: oauthId });
};

// Helper function to find user by email
const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

// Helper function to create user
const createOAuthUser = async (profile, provider) => {
  const user = new User({
    email: profile.emails?.[0]?.value || `${profile.username}@${provider}.com`,
    username: `${provider}_${profile.id}`, // Temporary username
    [`${provider}Id`]: profile.id,
    avatar: profile.photos?.[0]?.value || null,
    provider,
    profileCompleted: false, // Mark as needing profile completion
    totalTests: 0,
    averageWPM: 0,
    averageAccuracy: 0,
    bestWPM: 0,
    bestAccuracy: 0
  });
  
  await user.save();
  return user;
};

// Configure Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google OAuth Profile:', profile);
      
      // Check if user already exists with this Google ID
      let user = await findUserByOAuthId('google', profile.id);
      
      if (user) {
        return done(null, user);
      }
      
      // Check if user exists with same email
      const email = profile.emails?.[0]?.value;
      if (email) {
        user = await findUserByEmail(email);
        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          await user.save();
          return done(null, user);
        }
      }
      
      // Create new user
      user = await createOAuthUser(profile, 'google');
      return done(null, user);
      
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, null);
    }
  }));
}

// Configure GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('GitHub OAuth Profile:', profile);
      
      // Check if user already exists with this GitHub ID
      let user = await findUserByOAuthId('github', profile.id);
      
      if (user) {
        return done(null, user);
      }
      
      // Check if user exists with same email
      const email = profile.emails?.[0]?.value;
      if (email) {
        user = await findUserByEmail(email);
        if (user) {
          // Link GitHub account to existing user
          user.githubId = profile.id;
          await user.save();
          return done(null, user);
        }
      }
      
      // Create new user
      user = await createOAuthUser(profile, 'github');
      return done(null, user);
      
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      return done(error, null);
    }
  }));
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;