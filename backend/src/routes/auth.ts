import express from 'express';
import authController from '../controllers/auth.js';
import { validate } from '../middleware/validation.js';
import { loginSchema } from '../validation/auth.js';

const router = express.Router();

router.post('/login', validate(loginSchema), authController.login);

export default router;
