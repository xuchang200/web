const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

// GET /api/users/profile - Get user profile
router.get('/profile', protect, async (req, res) => {
  // req.user is attached by the 'protect' middleware
  if (req.user) {
    res.json({
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

module.exports = router;