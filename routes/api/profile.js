const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// Load validation
const validateProfileInput = require('../../validation/profile');

// Load Profile Model
const Profile = require('../../models/Profile');
// Load User Profile
const User = require('../../models/User');

// @route   GET api/profile/test
// @desc    Tests profile route
// @access  Public
router.get('/test', (req, res, next) => res.json({ msg: "Profile works" }));

// @route   GET api/profile
// @desc    Get current user's profile
// @access  Private
router.get('/', passport.authenticate('jwt', { session: false }), (req, res, next) => {
  const errors = {};

  Profile.findOne({ user: req.user.id })
    .populate('user', ['name', 'avatar']) // Add some fields from User
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user'
        return res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

// @route   GET api/profile/all
// @desc    Get all profiles
// @access  Public
router.get('/all', (req, res, next) => {
  const errors = {};

  Profile.find()
    .populate('user', ['name', 'avatar'])
    .then(profiles => {
      if (!profiles) {
        errors.noprofile = 'There are no profiles'
        return res.status(404).json(errors);
      }
      res.json(profiles);
    })
    .catch(err => res.status(404).json({ profile: 'There are no profiles' }));
});

// @route   GET api/profile/handle/:handle
// @desc    Get profile by handle
// @access  Public
router.get('/handle/:handle', (req, res, next) => {
  const errors = {};

  Profile.findOne({ handle: req.params.handle })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get('/user/:user_id', (req, res, next) => {
  const errors = {};

  Profile.findOne({ user: req.params.user_id })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

// @route   POST api/profile
// @desc    Create or edit user profile
// @access  Private
router.post('/', passport.authenticate('jwt', { session: false }), (req, res, next) => {
  const { errors, isValid } = validateProfileInput(req.body);

  // Check validation
  if (!isValid) {
    // Return any errors with 400
    return res.status(400).json(errors)
  }

  // Get fields
  const profilefields = {};
  profilefields.user = req.user.id;
  if (req.body.handle) profilefields.handle = req.body.handle;
  if (req.body.company) profilefields.company = req.body.company;
  if (req.body.website) profilefields.website = req.body.website;
  if (req.body.location) profilefields.location = req.body.location;
  if (req.body.bio) profilefields.bio = req.body.bio;
  if (req.body.status) profilefields.status = req.body.status;
  if (req.body.githubusername) profilefields.githubusername = req.body.githubusername;

  // Skills - Split into array
  if (typeof req.body.skills !== 'undefined') {
    profilefields.skills = req.body.skills.split(',');
  }
  
  // Social
  profilefields.social = {};
  if (req.body.youtube) profilefields.social.youtube = req.body.youtube;
  if (req.body.facebook) profilefields.social.facebook = req.body.facebook;
  if (req.body.twitter) profilefields.social.twitter = req.body.twitter;
  if (req.body.linkedin) profilefields.social.linkedin = req.body.linkedin;
  if (req.body.instagram) profilefields.social.instagram = req.body.instagram;

  Profile.findOne({ user: req.user.id })
    .then(profile => {
      if (profile) {
        // Update
        Profile.findOneAndUpdate(
          { user: req.user.id }, 
          { $set: profilefields },
          { new: true })
          .then(profile => res.json(profile));
      } else {
        // Create

        // Check if handle (SEO friendly link) exists
        Profile.findOne({ handle: profilefields.handle })
          .then(profile => {
            if (profile) {
              errors.handle = 'That handle already exists';
              res.status(400).json(errors);
            }
            // Save profile
            new Profile(profilefields)
              .save()
              .then(profile => res.json(profile));
          });
      }
    });
});

module.exports = router;