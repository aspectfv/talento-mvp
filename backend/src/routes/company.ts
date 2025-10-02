import express from 'express';
import { getAllCompanies, createCompany, getCompanyById } from '../controllers/company.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// get all companies 
router.get('/', authenticateToken, authorizeRole(['superadmin']), getAllCompanies);

// create a new company
router.post('/', authenticateToken, authorizeRole(['superadmin']), createCompany);

// get company details
router.get('/:id', authenticateToken, authorizeRole(['admin', 'superadmin']), getCompanyById);

export default router;
