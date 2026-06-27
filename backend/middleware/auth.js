import { verifyToken } from '../utils/jwt.js';
import ApiError from '../utils/ApiError.js';
import User from '../models/User.js';

const extractToken = (req) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies?.token) return req.cookies.token;
  return null;
};

export const requireAuth = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) throw new ApiError(401, 'Authentication required');

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).lean();
    if (!user) throw new ApiError(401, 'User no longer exists');
    if (user.status === 'blocked') throw new ApiError(403, 'Account is blocked');

    req.user = {
      id: String(user._id),
      _id: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
    };
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Invalid or expired token'));
    }
    next(err);
  }
};

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, 'Authentication required'));
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, `Forbidden. Requires role: ${roles.join('|')}`));
  }
  next();
};

// Optional auth — populates req.user if token is present, else continues anonymously.
export const optionalAuth = async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).lean();
    if (user && user.status !== 'blocked') {
      req.user = {
        id: String(user._id),
        _id: user._id,
        role: user.role,
        email: user.email,
        name: user.name,
      };
    }
  } catch (_) {
    /* ignore */
  }
  next();
};
