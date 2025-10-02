import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../db/supabase.js';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, password_hash, role, company_id')
    .eq('email', email)
    .single();

  if (error) {
    throw error;
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.company_id
    }
  });
};

export default { login };
