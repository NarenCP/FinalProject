const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'Tour must have atmost 40 letters length'],
      minlength: [10, 'Tour must have atleast 10 letters length'],
      // validate: [
      //   validator.isAlpha,
      //   'name should not contain other than alphbaetical',
      // ],
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty'],
      enum: {
        values: ['difficult', 'easy', 'medium'],
        message: 'Difficulty must be either difficult, easy or medium',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      max: [5, 'Tour must have less than or equal to 5 ratings'],
      min: [1, 'Tour must have greater than equal to 1 ratings'],
    },
    ratingsquantity: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return this.val < this.price;
        },
        message: 'Discount amount should not be greater than price',
      },
    },

    Summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'Tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//Document MiddleWare
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });

  next();
});

// tourSchema.pre('save', function (next) {
//   console.log('will Save Documents');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//Query Middleware
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.startTime = Date.now();
  next();
});

tourSchema.post(/^find/, function (doc, next) {
  console.log(`This query took ${Date.now() - this.startTime}ms to create`);
  // console.log(doc);
  next();
});
//Aggregate MiddleWare
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
