const express = require('express');
const Tour = require('../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const cathcAsync = require('../utils/cathcAsync');
const AppError = require('../utils/appError');

exports.aliasCheapTours = cathcAsync(async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,ratingsAverage,price,summary,difficultys';
  next();
});

exports.getAllTours = cathcAsync(async (req, res, next) => {
  console.log(req.query);

  ///-----Filerting
  // const queryObj = { ...req.query };
  // const excludedFields = ['page', 'sort', 'limit', 'fields'];

  // excludedFields.forEach((el) => delete queryObj[el]);

  //------Advanced Filtering
  // let queryStr = JSON.stringify(queryObj);
  // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
  // console.log(JSON.parse(queryStr));

  // let queryManual = Tour.find(JSON.parse(queryStr));

  //-------Sorting
  // if (req.query.sort) {
  //   const sortBy = req.query.sort.split(',').join(' ');
  //   // queryManual = queryManual.sort(req.query.sort);
  //   queryManual = queryManual.sort(sortBy);
  //   console.log(sortBy);
  // } else {
  //   queryManual = queryManual.sort('-createdAt');
  // }
  //-------FieldsLimiting
  // if (req.query.fields) {
  //   const fields = req.query.fields.split(',').join(' ');
  //   queryManual = queryManual.select(fields);
  //   console.log(fields);
  // } else {
  //   queryManual = queryManual.select('-__v');
  // }

  //--------Pagination:
  // const page = req.query.page * 1 || 1;
  // const limit = req.query.limit * 1 || 100;

  // const skip = (page - 1) * limit;

  // queryManual = queryManual.skip(skip).limit(limit);
  const features = new APIFeatures(Tour.find(), req.query)
    .sorting()
    .fieldLimit()
    .filtering()
    .pagination();

  const tours = await features.queryMan;
  res.status(200).json({
    status: 'Success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.createTour = cathcAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'Success',
    data: {
      tour: newTour,
    },
  });
});

exports.getTour = cathcAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    return next(new AppError('There is no tour with this id'));
  }

  res.status(200).json({
    status: 'Success',
    data: {
      tour,
    },
  });
});

exports.deleteTour = cathcAsync(async (req, res, next) => {
  const tour = await Tour.findOneAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError('There is no tour with this id', 404));
  }

  res.status(204).json({
    status: 'Success',
    data: tour,
  });
});

exports.updateTour = cathcAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'Success',
    data: {
      tour,
    },
  });
});

exports.getTourStats = cathcAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        avgRatings: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: -1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);
  res.status(200).json({
    status: 'Success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = cathcAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        tourName: { $push: '$name' },
      },
    },
    {
      $sort: { numTours: -1 },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: { _id: 0 },
    },
  ]);

  res.status(200).json({
    status: 'Success',
    data: {
      plan,
    },
  });
});
