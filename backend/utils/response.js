export const ok = (res, data = null, message = 'Success', meta = undefined) =>
  res.json({ success: true, message, data, ...(meta ? { meta } : {}) });

export const created = (res, data = null, message = 'Created') =>
  res.status(201).json({ success: true, message, data });

export const fail = (res, status = 400, message = 'Error', details = undefined) =>
  res.status(status).json({
    success: false,
    message,
    ...(details !== undefined ? { details } : {}),
  });

export const paginate = (res, data, total, page, limit, message = 'Success') =>
  res.json({
    success: true,
    message,
    data,
    meta: {
      pagination: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) },
    },
  });
