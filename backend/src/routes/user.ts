import express from 'express';

import userController from '../controllers/user.js';

const router = express.Router();

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.get('/me', userController.getCurrentUser);
router.put('/me', userController.updateCurrentUser);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUserById);

export default router;
