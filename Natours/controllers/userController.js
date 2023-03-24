const express = require('express');
const fs = require('fs');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const cathcAsync = require('../utils/cathcAsync');
const { filterObjects } = require('./../controllers/authController');

exports.getAllUsers = cathcAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'Success',
    data: {
      Users: users,
    },
  });
});

exports.updateMe = cathcAsync(async (req, res, next) => {
  if (req.body.password || req.body.confirmPassword) {
    return next(new AppError('You have seperate route to update the user'));
  }

  const filterObj = filterObjects(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterObj, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'Success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = cathcAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'Success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(200).json({
    status: 'Success',
    data: {
      Users: 'user created',
    },
  });
};

exports.getUser = (req, res) => {
  res.status(200).json({
    status: 'Success',
    data: {
      Users: 'Users',
    },
  });
};

exports.updateUser = cathcAsync(async (req, res, next) => {
  res.status(201).json({
    status: 'Success',
    data: {
      Users: 'Updated Users',
    },
  });
});

exports.deletUser = (req, res) => {
  res.status(204).json({
    status: 'Success',
    data: {
      Users: null,
    },
  });
};
