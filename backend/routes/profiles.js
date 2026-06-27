import express from 'express';
import { createOrUpdateProfile, getMyProfile, getProfileByEmail } from '../controllers/profileController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Allow unauthenticated creation because signup flow may not have backend JWT.
// Basic anti-abuse should be applied in production.
router.post('/', createOrUpdateProfile);
// Authenticated: get my profile
router.get('/me', requireAuth, getMyProfile);
// Public: get profile by email (used by some signup flows)
router.get('/', getProfileByEmail);

export default router;
