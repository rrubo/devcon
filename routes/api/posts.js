const express = require('express');
const router = express.Router();

// @route   GET api/posts/test
// @desc    Tests post route
// @access  Public
router.get('/test', (req, res, next) => res.json({ msg: "Posts works" }));

module.exports = router;