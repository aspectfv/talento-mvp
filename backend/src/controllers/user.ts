import { Response } from 'express';
import bcrypt from 'bcrypt';
import { supabase } from '../db/supabase.js';
import { AuthRequest } from '../middleware/auth.js';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, email, role, company_id, first_name, last_name');

  if (error) throw error;

  res.json(data);
};

export const createUser = async (req: AuthRequest, res: Response) => {
  const { email, password, role, company_id, messenger_psid, first_name, last_name } = req.body;

  if ((!email || !password || !role) && !messenger_psid) {
    return res.status(400).json({ error: 'Required user information is missing.' });
  }

  let password_hash = null;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    password_hash = await bcrypt.hash(password, salt);
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      password_hash,
      role,
      company_id,
      messenger_psid,
      first_name,
      last_name,
    })
    .select('user_id, email, role, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'User with this email or messenger ID already exists.' });
    }
    throw error;
  }

  res.status(201).json(data);
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
};

export const updateCurrentUser = async (req: AuthRequest, res: Response) => {
  const { id } = req.user!; // assert non-null because of auth middleware
  const { first_name, last_name, university, skills, interests } = req.body;

  const { data, error } = await supabase
    .from('users')
    .update({ first_name, last_name, university, skills, interests, updated_at: new Date() })
    .eq('user_id', id)
    .select('user_id, email, role, company_id, first_name, last_name, university, skills, interests')
    .single();

  if (error) throw error;

  res.json(data);
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { data: user, error } = await supabase
    .from('users')
    .select('user_id, email, role, company_id, first_name, last_name, university, skills, interests')
    .eq('user_id', id)
    .single();

  if (error) throw error;

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
};

export const updateUserById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { first_name, last_name, university, skills, interests } = req.body;

  const { data: user, error } = await supabase
    .from('users')
    .update({ first_name, last_name, university, skills, interests, updated_at: new Date() })
    .eq('user_id', id)
    .select('user_id, email, role, company_id, first_name, last_name, university, skills, interests')
    .single();

  if (error) throw error;

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
};

export default {
  getAllUsers,
  createUser,
  getCurrentUser,
  updateCurrentUser,
  getUserById,
  updateUserById,
};
