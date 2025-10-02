import { Response } from 'express';
import { supabase } from '../db/supabase.js';
import { AuthRequest } from '../middleware/auth.js';

export const createJob = async (req: AuthRequest, res: Response) => {
  const { title, description, location, employment_type } = req.body;
  const { id: userId, companyId } = req.user!;

  if (!companyId) {
    return res.status(400).json({ error: 'User is not associated with a company.' });
  }

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      title,
      description,
      location,
      employment_type,
      company_id: companyId,
      created_by_user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;

  res.status(201).json(data);
};

export const getAllJobs = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  let query = supabase.from('jobs').select('*');

  if (!user || user.role === 'seeker') {
    // public or seeker - only active jobs
    query = query.eq('is_active', true);
  } else if (user.role === 'admin') {
    // admin - only jobs from their company
    if (!user.companyId) {
      return res.json([]); // Admin not in a company has no jobs
    }
    query = query.eq('company_id', user.companyId);
  }

  // superadmin - no restrictions
  const { data, error } = await query;

  if (error) throw error;

  res.json(data);
};
export const getJobById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { user } = req;

  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // admin can only see jobs from their own company
  if (user && user.role === 'admin' && user.companyId !== job.company_id) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(job);
};

export const updateJob = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { user } = req;
  const updateData = req.body;

  // first retrieve job to check for ownership
  const { data: existingJob, error: findError } = await supabase
    .from('jobs')
    .select('company_id')
    .eq('id', id)
    .single();

  if (findError || !existingJob) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // admin can only update jobs from their own company
  if (user!.role === 'admin' && user!.companyId !== existingJob.company_id) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const { data, error } = await supabase
    .from('jobs')
    .update({ ...updateData, updated_at: new Date() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  res.json(data);
};

// soft delete only
export const deleteJob = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { user } = req;

  const { data: existingJob, error: findError } = await supabase
    .from('jobs')
    .select('company_id')
    .eq('id', id)
    .single();

  if (findError || !existingJob) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (user!.role === 'admin' && user!.companyId !== existingJob.company_id) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const { error } = await supabase
    .from('jobs')
    .update({ is_active: false, updated_at: new Date() })
    .eq('id', id);

  if (error) throw error;

  res.status(204).send();
};

export const getApplicationsForJob = async (req: AuthRequest, res: Response) => {
  const { job_id } = req.params;
  const { status } = req.query;
  const { user } = req;

  // first, verify the job exists and the user has permission to see it/its applications
  const { data: job, error: findError } = await supabase
    .from('jobs')
    .select('company_id')
    .eq('id', job_id)
    .single();

  if (findError || !job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (user!.role === 'admin' && user!.companyId != job.company_id) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  let query = supabase.from('applications').select('*').eq('job_id', job_id);

  if (status) {
    query = query.eq('status', status as string);
  }

  const { data: applications, error } = await query;

  if (error) throw error;

  res.json(applications);
};

export default {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  getApplicationsForJob,
};
