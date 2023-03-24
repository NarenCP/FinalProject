const express = require('express');
const app = express();
const tourRouter = require('./routes/tourRouter');
const userRouter = require('./routes/userRouter');
const globalErrorHandler = require('./../Natours/controllers/errorController');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

app.use(helmet());

app.use(express.static(`${__dirname}/public`));

const morgan = require('morgan');
const AppError = require('./utils/appError');

//Body parser, Reading data from body into req.body
app.use(express.json());

console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//Limit requests form same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Tpp many request please try again later',
});
app.use(mongoSanitize());

app.use(xss());

app.use(hpp());

app.use('/api', limiter);
// app.use((req, res, next) => {
//   console.log('Hi from MiddleWare 🙌');
//   next();
// });

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//app.all have all the crud operations
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'Fail',
  //   message: `Can't find the ${req.originalUrl} on the server`,
  // });
  // const error = new Error(`Can't find the ${req.originalUrl} on the server`);
  // error.statusCode = 404;
  // error.status = 'Fail';
  next(new AppError(`Can't find the ${req.originalUrl} on the server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
