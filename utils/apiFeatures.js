class ApiFeatures {
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
  }

  filter() {
    const queryStringObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields", "keyword"];
    excludedFields.forEach((field) => delete queryStringObj[field]);

    let queryStr = JSON.stringify(queryStringObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      console.log("sort", queryString.sort);
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort("createdAt");
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.mongooseQuery.select(fields);
    } else {
      this.mongooseQuery = this.mongooseQuery.select("-__v");
    }
    return this;
  }

  search(modelName) {
    let qeury = {};
    if (this.queryString.keyword) {
      if (modelName === "User") {
        qeury = {
          $or: [{ name: { $regex: this.queryString.keyword, $options: "i" } }],
        };
      } else {
        query = {
          $or: [
            { name: { $regex: this.queryString.keyword, $options: "i" } },
            {
              description: { $regex: this.queryString.keyword, $options: "i" },
            },
          ],
        };
      }
      this.mongooseQuery = this.mongooseQuery.and([query]);
    }
    return this;
  }

  paginate(countDocuments) {
    const page = +this.queryString.page || 1;
    const limit = +this.queryString.limit || 20;
    const skip = (page - 1) * limit;
    const endIndex = page * limit;

    const pagination = {};
    pagination.currentPage = page;
    pagination.limit = limit;
    pagination.NoOfPages = Math.ceil(countDocuments / limit);

    // next pate
    if (endIndex < countDocuments) {
      pagination.next = page + 1;
    }

    //prev
    if (skip > 0) {
      pagination.prev = page - 1;
    }

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    this.paginationResult = pagination;

    return this;
  }
}

module.exports = ApiFeatures;
