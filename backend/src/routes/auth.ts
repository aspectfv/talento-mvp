import express from 'express';
import authController from '../controllers/auth.js';
import { validate } from '../middleware/validation.js';
import loginValidator from '../validation/auth.js';

const router = express.Router();

// POST /auth/login - user login
router.post('/login', validate(loginValidator.loginSchema), authController.login);

export default router;
