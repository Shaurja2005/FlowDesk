/**
 * paginate — applies skip/limit to a Mongoose query and returns
 * pagination metadata alongside the results.
 *
 * @param {Model} model - Mongoose model
 * @param {Object} query - filter object
 * @param {Object} options - { page, limit, sort, populate, select }
 */
const paginate = async (model, query = {}, options = {}) => {
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 10));
  const skip = (page - 1) * limit;
  const sort = options.sort || { createdAt: -1 };

  let dbQuery = model.find(query).sort(sort).skip(skip).limit(limit);

  if (options.select) dbQuery = dbQuery.select(options.select);
  if (options.populate) {
    const pops = Array.isArray(options.populate)
      ? options.populate
      : [options.populate];
    pops.forEach((p) => (dbQuery = dbQuery.populate(p)));
  }

  const [data, total] = await Promise.all([
    dbQuery.exec(),
    model.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

module.exports = { paginate };
