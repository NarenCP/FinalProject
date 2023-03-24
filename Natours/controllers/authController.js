const User = require('../models/userModel');
const { promisify } = require('util');
const cathcAsync = require('../utils/cathcAsync');
const jwt = require('jsonwebtoken');
const appError = require('./../utils/appError');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const crypto = require('crypto');

const singToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = singToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 3600 * 1000
    ),
    httpOnly: true,
  };

  res.cookie('jwt', token, cookieOptions);
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  res.status(statusCode).json({
    status: 'Success',
    token,
    user,
  });
};

exports.singup = cathcAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    changePasswordAt: req.body.changePasswordAt,
    role: req.body.role,
  });
  createSendToken(newUser, 201, res);
});

exports.login = cathcAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //Check whethe email and password exists
  if (!email || !password) {
    return next(new appError('Provide email or password'), 400);
  }
  // Check if user exists and password is correct

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new appError('Incorrect Email or Password'), 401);
  }

  //If everythig is okay then send the token to the client
  const token = singToken(user._id);

  createSendToken(user, 200, res);
});

exports.protect = cathcAsync(async (req, res, next) => {
  //1) Getting the token and check if it is there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // console.log(token);

  if (!token) {
    return next(new AppError('Please kindly Login to get the access'));
  }

  //2) Verify the token
  const decodedToken = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  //Check the user is present or not
  const currentUser = await User.findById(decodedToken.id);

  if (!currentUser) {
    return next(
      new AppError('The user belongs to this token no longer exist'),
      401
    );
  }
  //console.log(decodedToken);

  //Check whether anybody changed the password after alloting the token
  if (currentUser.changePasswordAfter(decodedToken.iat)) {
    return next(
      new AppError('User recently changed the password so Please Login again'),
      401
    );
  }

  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      next(new AppError('You do not have permission to delete the tour', 403));
    }
    next();
  };
};

exports.forgotPassword = cathcAsync(async (req, res, next) => {
  //Get the email of the person and check whether it exists
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new AppError('Please provide your registered email address'),
      400
    );
  }

  //Get the reset Token to send in email
  const resetToken = user.createForgotPasswordToken();
  await user.save({ validateBeforeSave: false });

  console.log(resetToken);

  //send the email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your passoword? Please patch a request to reset password : ${resetURL} \n Please Kindly ignore if it is done`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Reset Token will expires in 10m',
      message: message,
    });

    res.status(200).json({
      status: 'Success',
      message: 'Token sent to an email . Please check your email',
    });
  } catch (err) {
    user.tokenExpires = undefined;
    user.forgotPasswordToken = undefined;
    await user.save({ validateBeforeSave: false });

    next(new AppError('Something went wrong in sending Email '), 500);
  }
});
exports.resetPassword = cathcAsync(async (req, res, next) => {
  //Get the user based token

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    tokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is either Invalid or expired'));
  }

  //update the password now
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.forgotPasswordToken = undefined;
  user.tokenExpires = undefined;
  await user.save();

  //send the token to client to use it
  createSendToken(user, 200, res);
});

exports.updatePassword = cathcAsync(async (req, res, next) => {
  //Get the user from collection

  const user = await User.findById(req.user.id).select('+password');
  console.log(user);
  //check the posted password is correct or not
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Current Password is wrong'), 401);
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  createSendToken(user, 201, res);
});

exports.filterObjects = (Obj, ...objFields) => {
  const newObj = {};
  Object.keys(Obj).forEach((el) => {
    if (objFields.includes(el)) {
      newObj[el] = Obj[el];
    }
  });
  return newObj;
};
