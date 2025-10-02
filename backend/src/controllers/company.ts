import { Request, Response } from 'express';
import { supabase } from '../db/supabase.js';

export const createCompany = async (req: Request, res: Response) => {
  const { name, website, description, logo_url } = req.body;

  const { data, error } = await supabase
    .from('companies')
    .insert({ name, website, description, logo_url })
    .select()
    .single();

  if (error) throw error;

  res.status(201).json(data);
};

export const getAllCompanies = async (_: Request, res: Response) => {
  const { data, error } = await supabase.from('companies').select('*');

  if (error) throw error;

  res.json(data);
};

export const getCompanyById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  if (!data) {
    return res.status(404).json({ error: 'Company not found' });
  }

  res.json(data);
};

export const updateCompany = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, website, description, logo_url } = req.body;

  const { data, error } = await supabase
    .from('companies')
    .update({ name, website, description, logo_url, updated_at: new Date() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (!data) {
    return res.status(404).json({ error: 'Company not found' });
  }

  res.json(data);
};

export default {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
};
