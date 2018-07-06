const express = require('express');
const router = express.Router();

// @route   GET api/profile/test
// @desc    Tests profile route
// @access  Public
router.get('/test', (req, res, next) => res.json({ msg: "Profile works" }));

module.exports = router;