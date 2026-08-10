class ApiFeatures {
  constructor(mongooseQuery, queryString, baseFilter = {}) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
    this.baseFilter = baseFilter;
  }

  // =========================
  // FILTER
  // =========================

  filter() {
    const queryStringObj = { ...this.queryString };

    const excludedFields = ["page", "sort", "limit", "fields", "keyword"];

    excludedFields.forEach((field) => delete queryStringObj[field]);

    let queryStr = JSON.stringify(queryStringObj);

    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    const queryFilter = JSON.parse(queryStr);

    // Combine protected filter with user filter
    // we put base filter after the query filter to make base filter win and wasn't be overwritten by qeury filter (wrriten by user)
    this.mongooseQuery = this.mongooseQuery.find({
      ...queryFilter,
      ...this.baseFilter,
    });

    return this;
  }

  // =========================
  // SORT
  // =========================

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");

      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort("-createdAt");
    }

    return this;
  }

  // =========================
  // LIMIT FIELDS
  // =========================

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");

      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else {
      this.mongooseQuery = this.mongooseQuery.select("-__v");
    }

    return this;
  }

  // =========================
  // SEARCH
  // =========================

  search(modelName) {
    if (!this.queryString.keyword) {
      return this;
    }

    let query;

    if (modelName === "User") {
      query = {
        $or: [
          {
            name: {
              $regex: this.queryString.keyword,
              $options: "i",
            },
          },
        ],
      };
    } else {
      query = {
        $or: [
          {
            name: {
              $regex: this.queryString.keyword,
              $options: "i",
            },
          },
          {
            description: {
              $regex: this.queryString.keyword,
              $options: "i",
            },
          },
        ],
      };
    }

    this.mongooseQuery = this.mongooseQuery.and([query]);

    return this;
  }

  // =========================
  // PAGINATION
  // =========================

  paginate(countDocuments) {
    const page = Math.max(+this.queryString.page || 1, 1);

    const limit = Math.min(Math.max(+this.queryString.limit || 20, 1), 100);

    const skip = (page - 1) * limit;
    const endIndex = page * limit;

    const pagination = {};

    pagination.currentPage = page;
    pagination.limit = limit;
    pagination.NoOfPages = Math.ceil(countDocuments / limit);

    if (endIndex < countDocuments) {
      pagination.next = page + 1;
    }

    if (skip > 0) {
      pagination.prev = page - 1;
    }

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);

    this.paginationResult = pagination;

    return this;
  }
}

module.exports = ApiFeatures;
