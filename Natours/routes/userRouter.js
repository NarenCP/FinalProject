const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

router.route('/signup').post(authController.singup);
router.route('/login').post(authController.login);
router.route('/forgotPassword').post(authController.forgotPassword);

router.route('/resetPassword/:token').patch(authController.resetPassword);

router
  .route('/updatePassword')
  .patch(authController.protect, authController.updatePassword);
router
  .route('/updateMe')
  .patch(authController.protect, userController.updateMe);

router
  .route('/deleteMe')
  .delete(authController.protect, userController.deleteMe);

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deletUser);

module.exports = router;
