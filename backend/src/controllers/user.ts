import bcrypt from 'bcrypt';
import { supabase } from '../db/supabase.js';
import { AuthRequest } from '../middleware/auth.js';

export const createUser = async (req: AuthRequest, res: any) => {
  const { email, password, role, firstName, lastName, university, companyId } = req.body;

  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        role,
        first_name: firstName,
        last_name: lastName,
        university,
        company_id: companyId
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      id: user.user_id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      university: user.university,
      companyId: user.company_id
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: any) => {
  const { firstName, lastName, university, skills, interests } = req.body;
  const userId = req.user!.id;

  try {
    const { data: user, error } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        university,
        skills,
        interests,
        updated_at: new Date()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      id: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      university: user.university,
      skills: user.skills,
      interests: user.interests
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
