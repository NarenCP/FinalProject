const express = require('express');

const router = express.Router();
const tourController = require('../controllers/tourController');
const authController = require('./../controllers/authController');
// router.param('id', tourController.checkID);
router
  .route('/top-5-cheap')
  .get(tourController.aliasCheapTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('lead-guide', 'admin'),
    tourController.deleteTour
  );

module.exports = router;
