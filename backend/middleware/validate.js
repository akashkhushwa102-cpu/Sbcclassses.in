import ApiError from '../utils/ApiError.js';

/**
 * validate(schema, source) — Joi validation middleware.
 * source: 'body' | 'query' | 'params'
 */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const { value, error } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  if (error) {
    return next(
      new ApiError(
        400,
        'Validation failed',
        error.details.map((d) => ({ message: d.message, path: d.path.join('.') }))
      )
    );
  }
  req[source] = value;
  next();
};

export default validate;
