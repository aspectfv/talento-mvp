import { supabase } from '../db/supabase.js';
import { AuthRequest } from '../middleware/auth.js';

export const getAllCompanies = async (req: AuthRequest, res: any) => {
  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(companies);
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCompany = async (req: AuthRequest, res: any) => {
  const { name, website, description, logoUrl } = req.body;

  try {
    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        name,
        website,
        description,
        logo_url: logoUrl
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(company);
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCompanyById = async (req: AuthRequest, res: any) => {
  const companyId = req.params.id;

  if (req.user!.role === 'admin' && req.user!.companyId !== companyId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (error || !company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
