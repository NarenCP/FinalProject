class APIFeatures {
  constructor(queryMan, queryString) {
    this.queryMan = queryMan;
    this.queryString = queryString;
  }

  filtering() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];

    excludedFields.forEach((el) => delete queryObj[el]);

    //Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    console.log(JSON.parse(queryStr));

    this.queryMan.find(JSON.parse(queryStr));
    //let queryManual = Tour.find(JSON.parse(queryStr));

    return this;
  }

  sorting() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      // queryManual = queryManual.sort(req.query.sort);
      this.queryMan = this.queryMan.sort(sortBy);
      console.log(sortBy);
    } else {
      this.queryMan = this.queryMan.sort('-createdAt');
    }

    return this;
  }

  fieldLimit() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.queryMan = this.queryMan.select(fields);
      console.log(fields);
    } else {
      this.queryMan = this.queryMan.select('-__v');
    }
    return this;
  }
  pagination() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;

    const skip = (page - 1) * limit;

    this.queryMan = this.queryMan.skip(skip).limit(limit);
    return this;
  }
}
module.exports = APIFeatures;
