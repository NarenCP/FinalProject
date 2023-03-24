const AppError = require('../utils/appError');

const sendErrorDevlpment = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.log(err);
    res.status(500).json({
      status: 'Fail',
      message: 'Something went wrong',
    });
  }
};

////////////////////////////////
const handleCastError = (err) => {
  const message = `Invalid ${err.path} and ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateError = (err) => {
  const message = 'Please enter the different name';
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Please provide proper input ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleWebTokenError = () => {
  return new AppError('Please login again and provide the proper token', 400);
};

const handleTokenExpiredError = () => {
  return new AppError(
    'Token has been expired please login again and try the token',
    400
  );
};

module.exports = (err, req, res, next) => {
  err.status = err.status || 'error';
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    sendErrorDevlpment(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (err.name === 'ValidationError') error = handleValidationError(error);
    if (error.name === 'CastError') error = handleCastError(error);

    if (error.code === 11000) error = handleDuplicateError(error);
    if (error.name === 'JsonWebTokenError') error = handleWebTokenError();
    if (error.name === 'TokenExpiredError') error = handleTokenExpiredError();

    console.log('Error name is ', err.name);

    sendErrorProd(error, res);
  }
  next();
  // res.status(err.statusCode).json({
  //   status: err.status,
  //   message: err.message,
  // });
  // next();
};
