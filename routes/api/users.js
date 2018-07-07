const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');

// Load input validation
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

// Load User model
const User = require('../../models/User');
console.log(User);

// @route   GET api/users/test
// @desc    Tests users route
// @access  Public
router.get('/test', (req, res, next) => res.json({ msg: "Users works" }));

// @route   POST api/users/register
// @desc    Register user
// @access  Public
router.post('/register', (req, res, next) => {
  const { errors, isValid } = validateRegisterInput(req.body);

  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email })
    .then(user => {
      if (user) {
        errors.email = 'E-mail address already exists.'
        return res.status(400).json(errors);
      } else {
        const avatar = gravatar.url(req.body.email, {
          s: '200', //Size
          r: 'pg', //Rating
          d: 'mm' // Default
        });
        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          avatar, //ES6 shortening avatar: avatar
          password: req.body.password
        });
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser.save()
              .then(user => res.json(user))
              .catch(console.log(err));
          });
        });
      }
    });
});

// @route   POST api/users/login
// @desc    Login user / Returning JWT Token
// @access  Public
router.post('/login', (req, res, next) => {
  const { errors, isValid } = validateLoginInput(req.body);

  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const email = req.body.email;
  const password = req.body.password;

  // Find user by email
  User.findOne({ email }) // matching email: email
    .then(user => {
      if (!user) {
        errors.email = 'User not found';
        return res.status(404).json(errors);
      }

    // Check Password
    bcrypt.compare(password, user.password)
      .then(isMatch => {
        if(isMatch) {

          // User matched. Create JWT payload
          const payload = {
            id: user.id,
            name: user.name,
            avatar: user.avatar
          } 

          // Sign Token
          jwt.sign(
            payload,
            keys.secretOrKey, 
            { expiresIn: 3600 }, 
            (err, token) => {
              res.json({
                success: true,
                token: 'Bearer ' + token
              });
          });
        } else {
          errors.password = 'Password incorrect'
          return res.status(400).json(errors);
        }
    });
  }); 
});

// @route   GET api/users/current
// @desc    Return current user
// @access  Private
router.get('/current', passport.authenticate('jwt', { session: false }), (req, res, next) => {
  res.json(req.user);
});

module.exports = router;