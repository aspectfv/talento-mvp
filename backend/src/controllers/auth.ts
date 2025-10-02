import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../db/supabase.js';
import { AuthRequest } from '../middleware/auth.js';

export const login = async (req: any, res: any) => {
  const { email, password } = req.body;

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('user_id, email, password_hash, role, company_id')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.user_id },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
        companyId: user.company_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: any) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('user_id, email, role, company_id, first_name, last_name')
      .eq('user_id', req.user!.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.user_id,
      email: user.email,
      role: user.role,
      companyId: user.company_id,
      firstName: user.first_name,
      lastName: user.last_name
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
