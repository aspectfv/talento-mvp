import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase.js';
import { AuthRequest } from '../middleware/auth.js';
import userRoutes from '../routes/user.js';

// mock auth middleware to bypass actual authentication for testing
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req: AuthRequest, _: Response, next: NextFunction) => {
    // mock user info to simulate authenticated user
    req.user = {
      id: '1',
      email: 'john.doe@example.com',
      role: 'seeker'
    };
    next();
  },
  authorizeRole: (_: string[]) => (_: Request, __: Response, next: NextFunction) => {
    // assume user has the required role for testing purposes
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/users', userRoutes);

describe('User Routes', () => {

  describe('GET /users/me', () => {
    it('should return the current user based on the mock auth token', async () => {
      const response = await request(app).get('/users/me');

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe('1');
      expect(response.body.user.email).toBe('john.doe@example.com');
    });
  });

  describe('PUT /users/me', () => {
    it('should update the current user and return the updated data', async () => {
      const updateData = { first_name: 'Johnathan' };
      const updatedUser = { user_id: 1, email: 'john.doe@example.com', first_name: 'Johnathan' };

      // Mock the Supabase update call
      (supabase.from('users').update(updateData).eq('id', '1').select().single as jest.Mock)
        .mockResolvedValue({ data: updatedUser, error: null });

      const response = await request(app)
        .put('/users/me')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.first_name).toBe('Johnathan');
    });

    it('should return 400 if the update body is empty', async () => {
      const response = await request(app)
        .put('/users/me')
        .send({}); // Empty body

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /users/:id', () => {
    it('should get a user by their ID', async () => {
      const mockUser = { user_id: 2, email: 'jane.smith@example.com' };

      (supabase.from('users').select().eq('id', '2').single as jest.Mock)
        .mockResolvedValue({ data: mockUser, error: null });

      const response = await request(app).get('/users/2');

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('jane.smith@example.com');
    });

    it('should return 400 for a non-integer ID', async () => {
      const response = await request(app).get('/users/abc');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });
});
