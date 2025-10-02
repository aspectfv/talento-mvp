import express from 'express';

import authRoutes from './auth.js';
import userRoutes from './user.js';
import companyRoutes from './company.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/companies', companyRoutes);

export default router;
