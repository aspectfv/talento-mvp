import request from 'supertest';
import express from 'express';
import bcrypt from 'bcrypt';
import { supabase } from '../db/supabase.js';
import authRoutes from '../routes/auth.js'; // The router we want to test

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

process.env.JWT_SECRET = 'test-secret';

describe('Auth Routes - POST /auth/login', () => {

  it('should return a token for valid credentials', async () => {
    // 1. mock expected database response
    const mockUser = {
      user_id: 1,
      email: 'john.doe@example.com',
      password_hash: 'hashedpassword',
      role: 'seeker',
      company_id: null,
    };

    // pass the expected arguments to .eq()
    (supabase.from('users').select().eq('email', 'john.doe@example.com').single as jest.Mock).mockResolvedValue({ data: mockUser, error: null });

    // 2. mock bcrypt.compare function to return true
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    // 3. make request and assert response
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'john.doe@example.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe('john.doe@example.com');
  });

  it('should return 401 for invalid credentials (wrong password)', async () => {
    const mockUser = { user_id: 1, email: 'john.doe@example.com', password_hash: 'hashedpassword' };
    (supabase.from('users').select().eq('email', 'john.doe@example.com').single as jest.Mock).mockResolvedValue({ data: mockUser, error: null });

    // mock bcrypt to return false, simulating password mismatch
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'john.doe@example.com', password: 'wrongpassword' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
  });

  it('should return 401 if user does not exist', async () => {
    // mock supabase to return no user
    (supabase.from('users').select().eq('email', 'nouser@example.com').single as jest.Mock).mockResolvedValue({ data: null, error: null });
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'nouser@example.com', password: 'password123' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
  });

  it('should return 400 for invalid email format (Zod validation)', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'not-an-email', password: 'password123' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
  });

  it('should return 400 if password is missing (Zod validation)', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'john.doe@example.com' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
  });
});
