import express from 'express';
import { createUser, updateProfile } from '../controllers/user.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// create new user
router.post('/', authenticateToken, authorizeRole(['superadmin']), createUser);

// update user profile
router.put('/profile', authenticateToken, authorizeRole(['seeker']), updateProfile);

export default router;
