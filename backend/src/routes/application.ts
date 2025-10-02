import express from 'express';
import applicationController from '../controllers/application.js';
import { validate } from '../middleware/validation.js';
import applicationValidator from '../validation/application.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// POST /applications - Submits a new application for a job.
router.post(
  '/',
  authenticateToken,
  authorizeRole(['seeker']), // Only seekers can apply for jobs
  validate(applicationValidator.createApplicationSchema),
  applicationController.createApplication
);

// GET /applications/:id - Retrieves a single application.
router.get(
  '/:id',
  authenticateToken, // Auth logic is handled in the controller (seeker or admin of company)
  validate(applicationValidator.getApplicationByIdSchema),
  applicationController.getApplicationById
);

// PUT /applications/:id - Updates the status of an application.
router.put(
  '/:id',
  authenticateToken,
  authorizeRole(['admin', 'superadmin']),
  validate(applicationValidator.updateApplicationSchema),
  applicationController.updateApplication
);

export default router;
