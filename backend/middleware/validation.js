// Request validation middleware
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

export const validateRequired = (req, fields) => {
  for (const field of fields) {
    if (!req.body[field]) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
};

export const validateStudent = (req, res, next) => {
  const error = validateRequired(req, ['name', 'email', 'phone']);
  if (error) {
    return res.status(400).json({ error });
  }

  if (!validateEmail(req.body.email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!validatePhone(req.body.phone)) {
    return res.status(400).json({ error: 'Invalid phone format' });
  }

  next();
};

export const validateBatch = (req, res, next) => {
  const error = validateRequired(req, ['name', 'capacity', 'schedule']);
  if (error) {
    return res.status(400).json({ error });
  }

  if (req.body.capacity < 1) {
    return res.status(400).json({ error: 'Capacity must be at least 1' });
  }

  next();
};
