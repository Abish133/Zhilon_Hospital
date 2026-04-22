// Parses page/pageSize/sortBy/sortOrder from req.query and returns a { limit, offset, order }
// object ready to splice into a Sequelize findAll. Keeps the controller-side code a 1-liner:
//   const { limit, offset, order } = parsePaging(req.query);
//   const { rows, count } = await Model.findAndCountAll({ where, limit, offset, order });
//   return res.json(paginatedResponse(rows, count, req.query));

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 200;

function parsePaging(query = {}, opts = {}) {
  const defaultOrder = opts.defaultOrder || [];
  const allowedSortFields = opts.allowedSortFields || null; // if supplied, restricts sortBy

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  let pageSize = parseInt(query.pageSize || query.limit, 10);
  if (!pageSize || pageSize < 1) pageSize = DEFAULT_PAGE_SIZE;
  if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;

  const offset = (page - 1) * pageSize;

  let order = defaultOrder;
  if (query.sortBy) {
    const dir = (query.sortOrder || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    if (!allowedSortFields || allowedSortFields.includes(query.sortBy)) {
      order = [[query.sortBy, dir]];
    }
  }

  return { page, pageSize, limit: pageSize, offset, order };
}

function paginatedResponse(rows, totalCount, query = {}) {
  const { page, pageSize } = parsePaging(query);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return {
    success: true,
    data: rows,
    pagination: {
      page,
      pageSize,
      total: totalCount,
      totalPages
    }
  };
}

module.exports = { parsePaging, paginatedResponse, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE };
