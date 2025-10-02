import express from 'express';
import jobController from '../controllers/job.js';
import { validate } from '../middleware/validation.js';
import jobValidator from '../validation/job.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// POST /jobs - create a new job posting
router.post(
  '/',
  authenticateToken,
  authorizeRole(['admin']),
  validate(jobValidator.createJobSchema),
  jobController.createJob
);

// GET /jobs - get all jobs (logic depends on user role)
router.get(
  '/',
  authenticateToken, // Authenticated to distinguish roles
  validate(jobValidator.getAllJobsSchema),
  jobController.getAllJobs
);

// GET /jobs/:id - get a single job by its ID
router.get(
  '/:id',
  authenticateToken,
  validate(jobValidator.getJobByIdSchema),
  jobController.getJobById
);

// GET /jobs/:job_id/applications - get all applications for a specific job
router.get(
  '/:job_id/applications',
  authenticateToken,
  authorizeRole(['admin', 'superadmin']),
  validate(jobValidator.getApplicationsForJobSchema),
  jobController.getApplicationsForJob
);

// PUT /jobs/:id - update a job
router.put(
  '/:id',
  authenticateToken,
  authorizeRole(['admin', 'superadmin']),
  validate(jobValidator.updateJobSchema),
  jobController.updateJob
);

// DELETE /jobs/:id - delete a job (soft delete)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRole(['admin', 'superadmin']),
  validate(jobValidator.deleteJobSchema),
  jobController.deleteJob
);

export default router;
