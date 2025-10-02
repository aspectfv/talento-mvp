import request from 'supertest';
import express, { Response, NextFunction } from 'express';
import { supabase } from '../db/supabase.js';
import { AuthRequest } from '../middleware/auth.js';
import jobRoutes from '../routes/job.js';

// mock user object
let mockUser: { id: string; email: string; role: string; companyId?: string; } | null = null;

// mock auth middleware
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req: AuthRequest, _: Response, next: NextFunction) => {
    req.user = mockUser!;
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
app.use('/jobs', jobRoutes);

describe('Job Routes', () => {
  beforeEach(() => {
    // reset mocks before each test
    jest.clearAllMocks();
    mockUser = null;
  });

  describe('POST /jobs', () => {
    it('should allow an admin to create a job', async () => {
      mockUser = { id: '3', email: 'recruiter@example.com', role: 'admin', companyId: '1' };
      const newJob = { title: 'Software Engineer', description: 'Build cool stuff.', location: 'Remote', employment_type: 'full-time' };

      // controller calls: .insert().select().single()
      const mockSingle = jest.fn().mockResolvedValue({ data: { id: 1, ...newJob }, error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      });

      const response = await request(app)
        .post('/jobs')
        .send(newJob);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Software Engineer');
    });
  });

  describe('GET /jobs', () => {
    it('should return all jobs for a superadmin', async () => {
      mockUser = { id: '5', email: 'super@example.com', role: 'superadmin' };
      const mockJobs = [{ id: 1 }, { id: 2 }];

      // controller calls: .select()
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: mockJobs, error: null }),
      });

      const response = await request(app).get('/jobs');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });

    it("should return only company's jobs for an admin", async () => {
      mockUser = { id: '3', email: 'admin@example.com', role: 'admin', companyId: '1' };
      const mockJobs = [{ id: 1, company_id: 1 }];

      // controller calls: .select().eq()
      const mockEq = jest.fn().mockResolvedValue({ data: mockJobs, error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const response = await request(app).get('/jobs');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
    });

    it('should return only active jobs for a seeker', async () => {
      mockUser = { id: '1', email: 'seeker@example.com', role: 'seeker' };
      const mockJobs = [{ id: 1, is_active: true }];

      // controller calls: .select().eq()
      const mockEq = jest.fn().mockResolvedValue({ data: mockJobs, error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const response = await request(app).get('/jobs');

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
    });
  });

  describe('PUT /jobs/:id', () => {
    it('should allow a superadmin to update any job', async () => {
      mockUser = { id: '5', email: 'super@example.com', role: 'superadmin' };
      const jobUpdate = { title: 'Senior Engineer' };

      // controller calls: 1. .select().eq().single()  2. .update().eq().select().single()
      const mockSingleFind = jest.fn().mockResolvedValue({ data: { company_id: '2' }, error: null });
      const mockSingleUpdate = jest.fn().mockResolvedValue({ data: { id: 1, ...jobUpdate }, error: null });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ single: mockSingleFind }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({ single: mockSingleUpdate }),
          }),
        }),
      });

      const response = await request(app)
        .put('/jobs/1')
        .send(jobUpdate);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Senior Engineer');
    });

    it("should forbid an admin from updating another company's job", async () => {
      mockUser = { id: '3', email: 'admin@example.com', role: 'admin', companyId: '1' };
      const jobUpdate = { title: 'Senior Engineer' };

      // controller calls: .select().eq().single()
      const mockSingleFind = jest.fn().mockResolvedValue({ data: { company_id: '2' }, error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ single: mockSingleFind }),
        }),
      });

      const response = await request(app)
        .put('/jobs/1')
        .send(jobUpdate);

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /jobs/:id', () => {
    it('should allow an admin to delete (soft) their own company job', async () => {
      mockUser = { id: '3', email: 'admin@example.com', role: 'admin', companyId: '1' };

      // controller calls: 1. .select().eq().single()  2. .update().eq()
      const mockSingleFind = jest.fn().mockResolvedValue({ data: { company_id: '1' }, error: null });
      const mockEqUpdate = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ single: mockSingleFind }),
        }),
        update: jest.fn().mockReturnValue({
          eq: mockEqUpdate,
        }),
      });

      const response = await request(app).delete('/jobs/1');

      expect(response.status).toBe(204);
    });
  });
});
