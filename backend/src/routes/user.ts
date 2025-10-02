import express from 'express';
import userController from '../controllers/user.js';
import { validate } from '../middleware/validation.js';
import userValidator from '../validation/user.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /users - get all users
router.get('/', authenticateToken, userController.getAllUsers);
// POST /users - create a new user
router.post('/', validate(userValidator.createUserSchema), userController.createUser);

// GET /users/me - get current user
router.get('/me', authenticateToken, userController.getCurrentUser);
// PUT /users/me - update current user
router.put('/me', authenticateToken, validate(userValidator.updateCurrentUserSchema), userController.updateCurrentUser);

// GET /users/:id - get user by ID
router.get('/:id', authenticateToken, validate(userValidator.getUserByIdSchema), userController.getUserById);
// PUT /users/:id - update user by ID
router.put('/:id', authenticateToken, validate(userValidator.updateUserByIdSchema), userController.updateUserById);

export default router;
