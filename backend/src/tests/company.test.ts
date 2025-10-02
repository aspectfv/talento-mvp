import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase.js';
import { AuthRequest } from '../middleware/auth.js';
import companyRoutes from '../routes/company.js';

let mockUserRole = 'superadmin'; // default role for tests

// mock auth middleware
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req: AuthRequest, _: Response, next: NextFunction) => {
    req.user = { id: '1', email: 'test@example.com', role: mockUserRole };
    next();
  },
  authorizeRole: (roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  },
}));

const app = express();
app.use(express.json());
app.use('/companies', companyRoutes);

describe('Company Routes', () => {
  beforeEach(() => {
    // Reset role before each test
    mockUserRole = 'superadmin';
  });

  describe('POST /companies', () => {
    it('should create a new company as a superadmin', async () => {
      const newCompany = { name: 'Test Corp', website: 'https://test.com' };
      (supabase.from('companies').insert(newCompany).select().single as jest.Mock)
        .mockResolvedValue({ data: { id: 1, ...newCompany }, error: null });
      const response = await request(app)
        .post('/companies')
        .send(newCompany);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Test Corp');
    });

    it('should return 403 if user is not a superadmin', async () => {
      mockUserRole = 'seeker'; // change role to a non-superadmin
      const newCompany = { name: 'Test Corp' };

      const response = await request(app)
        .post('/companies')
        .send(newCompany);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /companies', () => {
    it('should get all companies as a superadmin', async () => {
      const mockCompanies = [{ id: 1, name: 'Test Corp' }, { id: 2, name: 'Another Corp' }];
      (supabase.from('companies').select as jest.Mock).mockResolvedValueOnce({ data: mockCompanies, error: null });
      const response = await request(app).get('/companies');

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });

    it('should return 403 if user is not a superadmin', async () => {
      mockUserRole = 'admin';
      const response = await request(app).get('/companies');
      expect(response.status).toBe(403);
    });
  });

  describe('GET /companies/:id', () => {
    it('should get a single company by ID as any authenticated user', async () => {
      mockUserRole = 'seeker'; // any user can view
      const mockCompany = { id: 1, name: 'Test Corp' };
      (supabase.from('companies').select().eq('id', '1').single as jest.Mock)
        .mockResolvedValue({ data: mockCompany, error: null });
      const response = await request(app).get('/companies/1');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test Corp');
    });

    it('should return 404 if company not found', async () => {
      (supabase.from('companies').select().eq('id', '99').single as jest.Mock)
        .mockResolvedValue({ data: null, error: null });

      const response = await request(app).get('/companies/99');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /companies/:id', () => {
    it('should update a company as a superadmin', async () => {
      const updateData = { name: 'Updated Corp' };
      const updatedCompany = { id: 1, name: 'Updated Corp' };
      (supabase.from('companies').update(expect.anything()).eq('id', '1').select().single as jest.Mock)
        .mockResolvedValue({ data: updatedCompany, error: null });
      const response = await request(app)
        .put('/companies/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Corp');
    });

    it('should return 403 if user is not a superadmin', async () => {
      mockUserRole = 'admin';
      const updateData = { name: 'Updated Corp' };

      const response = await request(app)
        .put('/companies/1')
        .send(updateData);

      expect(response.status).toBe(403);
    });

    it('should return 404 if company to update is not found', async () => {
      (supabase.from('companies').update(expect.anything()).eq('id', '99').select().single as jest.Mock)
        .mockResolvedValue({ data: null, error: null });

      const response = await request(app)
        .put('/companies/99')
        .send({ name: 'Does not exist' });

      expect(response.status).toBe(404);
    });
  });
});
