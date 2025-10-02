import request from 'supertest';
import express, { Response, NextFunction } from 'express';
import { supabase } from '../db/supabase.js';
import { AuthRequest } from '../middleware/auth.js';
import applicationRoutes from '../routes/application.js';
import jobRoutes from '../routes/job.js'; // for the nested route

let mockUser: { id: string; email: string; role: string; companyId?: string; } | null = null;

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
app.use('/applications', applicationRoutes);
app.use('/jobs', jobRoutes); // Mount job routes for nested route testing

describe('Application Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null;
  });

  describe('POST /applications', () => {
    it('should allow a seeker to create an application', async () => {
      mockUser = { id: '1', email: 'seeker@test.com', role: 'seeker' };
      const newApplication = { job_id: 1 };
      const returnedApplication = { id: 1, ...newApplication, user_id: '1', status: 'applied' };

      (supabase.from('applications').insert(expect.anything()).select().single as jest.Mock)
        .mockResolvedValue({ data: returnedApplication, error: null });

      const response = await request(app)
        .post('/applications')
        .send(newApplication);

      expect(response.status).toBe(201);
      expect(response.body.job_id).toBe(1);
      expect(response.body.user_id).toBe('1');
    });

    it('should return 409 if the seeker has already applied', async () => {
      mockUser = { id: '1', email: 'seeker@test.com', role: 'seeker' };
      (supabase.from('applications').insert(expect.anything()).select().single as jest.Mock)
        .mockResolvedValue({ data: null, error: { code: '23505' } });

      const response = await request(app)
        .post('/applications')
        .send({ job_id: 1 });

      expect(response.status).toBe(409);
    });

    it('should return 403 if an admin tries to apply', async () => {
      mockUser = { id: '3', email: 'admin@test.com', role: 'admin', companyId: '1' };
      const response = await request(app)
        .post('/applications')
        .send({ job_id: 1 });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /applications/:id', () => {
    it('should allow a seeker to get their own application', async () => {
      mockUser = { id: '1', email: 'seeker@test.com', role: 'seeker' };
      const mockApplication = { id: 1, user_id: '1', job: { company_id: '2' } };

      (supabase.from('applications').select(expect.anything()).eq('id', '1').single as jest.Mock)
        .mockResolvedValue({ data: mockApplication, error: null });

      const response = await request(app).get('/applications/1');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
    });

    it('should forbid a seeker from getting another user application', async () => {
      mockUser = { id: '2', email: 'anotherseeker@test.com', role: 'seeker' };
      const mockApplication = { id: 1, user_id: '1', job: { company_id: '2' } };

      (supabase.from('applications').select(expect.anything()).eq('id', '1').single as jest.Mock)
        .mockResolvedValue({ data: mockApplication, error: null });

      const response = await request(app).get('/applications/1');
      expect(response.status).toBe(403);
    });
  });

  describe('PUT /applications/:id', () => {
    it('should allow an admin to update an application status and create an action', async () => {
      mockUser = { id: '3', email: 'admin@test.com', role: 'admin', companyId: '1' };
      const applicationToUpdate = { id: 1, job: { company_id: '1' } };
      const updatedApplication = { id: 1, status: 'shortlisted' };
      const statusUpdate = { status: 'shortlisted' };

      // Mocks for different chains
      const mockAppSelectSingle = jest.fn().mockResolvedValue({ data: applicationToUpdate, error: null });
      const mockAppUpdateSingle = jest.fn().mockResolvedValue({ data: updatedApplication, error: null });
      const mockActionInsert = jest.fn().mockResolvedValue({ error: null });

      // Centralized mock for supabase.from
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: mockAppSelectSingle,
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: mockAppUpdateSingle,
                }),
              }),
            }),
          };
        }
        if (table === 'recruiter_actions') {
          return {
            insert: mockActionInsert,
          };
        }
      });

      const response = await request(app)
        .put('/applications/1')
        .send(statusUpdate);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('shortlisted');
      expect(mockAppSelectSingle).toHaveBeenCalledTimes(1);
      expect(mockAppUpdateSingle).toHaveBeenCalledTimes(1);
      expect(mockActionInsert).toHaveBeenCalledTimes(1);
      expect(mockActionInsert).toHaveBeenCalledWith({
        application_id: '1',
        recruiter_user_id: '3',
        action_type: 'shortlist',
      });
    });
  });

  describe('GET /jobs/:job_id/applications', () => {
    it("should allow an admin to get applications for their company's job", async () => {
      mockUser = { id: '3', email: 'admin@test.com', role: 'admin', companyId: '1' };
      const mockJob = { company_id: '1' };
      const mockApplications = [{ id: 1, job_id: 1 }, { id: 2, job_id: 1 }];

      const mockAppQuery = jest.fn().mockResolvedValue({ data: mockApplications, error: null });
      const mockJobQuery = jest.fn().mockResolvedValue({ data: mockJob, error: null });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'jobs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: mockJobQuery,
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: mockAppQuery,
        };
      });

      const response = await request(app).get('/jobs/1/applications');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });
  });
});
