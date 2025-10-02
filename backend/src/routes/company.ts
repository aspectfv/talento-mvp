import express from 'express';
import companyController from '../controllers/company.js';
import { validate } from '../middleware/validation.js';
import companyValidator from '../validation/company.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// POST /companies - create a new company
router.post(
  '/',
  authenticateToken,
  authorizeRole(['superadmin']),
  validate(companyValidator.createCompanySchema),
  companyController.createCompany
);

// GET /companies - get all companies
router.get(
  '/',
  authenticateToken,
  authorizeRole(['superadmin']),
  companyController.getAllCompanies
);

// GET /companies/:id - get company by ID
router.get(
  '/:id',
  authenticateToken, // Any authenticated user can view a company
  validate(companyValidator.getCompanyByIdSchema),
  companyController.getCompanyById
);

// PUT /companies/:id - update company by ID
router.put(
  '/:id',
  authenticateToken,
  authorizeRole(['superadmin']),
  validate(companyValidator.updateCompanySchema),
  companyController.updateCompany
);

export default router;
