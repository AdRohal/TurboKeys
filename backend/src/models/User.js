const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username must be less than 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId && !this.githubId;
    },
    minlength: [6, 'Password must be at least 6 characters long']
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name must be less than 50 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name must be less than 50 characters']
  },
  googleId: {
    type: String,
    sparse: true
  },
  githubId: {
    type: String,
    sparse: true
  },
  avatar: {
    type: String,
    default: ''
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'dark'
    },
    language: {
      type: String,
      enum: ['english', 'french'],
      default: 'english'
    }
  },
  stats: {
    totalTests: {
      type: Number,
      default: 0
    },
    bestWpm: {
      type: Number,
      default: 0
    },
    averageWpm: {
      type: Number,
      default: 0
    },
    bestAccuracy: {
      type: Number,
      default: 0
    },
    averageAccuracy: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
