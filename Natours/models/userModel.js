const mongoose = require('mongoose');
const Validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email Id'],
    unique: true,
    lowercase: true,
    validate: [Validator.isEmail, 'Please provide  valid email'],
  },
  photo: {
    type: String,
  },
  changePasswordAt: Date,
  password: {
    type: String,
    required: [true, 'Please provide your password'],
    min: [4, 'Minimum length of the password should be 4'],
    max: [10, 'Password length should be atmost 10 characters'],
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, 'Please provide your confirm password'],
    min: [4, 'Minimum length of the password should be 4'],
    max: [10, 'Password length should be atmost 10 characters'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Password and Confirm PasswordShould be same',
    },
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  forgotPasswordToken: String,
  tokenExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.confirmPassword = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (this.isModified('password') || this.isNew) {
    next();
  }
  this.changePasswordAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (jwtTimeStamp) {
  if (this.changePasswordAt) {
    const changePasswordTimeStamp = parseInt(
      this.changePasswordAt.getTime() / 1000,
      10
    );
    //console.log(changePasswordTimeStamp, jwtTimeStamp);
    return jwtTimeStamp < changePasswordTimeStamp; //100<200
  }

  return false;
};

userSchema.methods.createForgotPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.forgotPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.tokenExpires = Date.now() + 10 * 60 * 1000;

  console.log(resetToken, this.forgotPasswordToken);
  return resetToken;
};
const User = mongoose.model('user', userSchema);

module.exports = User;
