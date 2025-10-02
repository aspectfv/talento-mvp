import { Response } from 'express';
import { supabase } from '../db/supabase.js';
import { AuthRequest } from '../middleware/auth.js';

export const createApplication = async (req: AuthRequest, res: Response) => {
  const { job_id } = req.body;
  const user_id = req.user!.id;

  const { data, error } = await supabase
    .from('applications')
    .insert({ job_id, user_id, status: 'applied' })
    .select()
    .single();

  if (error) {
    // a user can only apply to the same job once
    if (error.code === '23505') {
      return res.status(409).json({ error: 'You have already applied to this job.' });
    }
    throw error;
  }

  res.status(201).json(data);
};

export const getApplicationById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { user } = req;

  const { data: application, error } = await supabase
    .from('applications')
    .select('*, job:jobs(company_id)')
    .eq('id', id)
    .single();

  if (error) throw error;

  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  if (user!.role === 'seeker' && application.user_id.toString() !== user!.id) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const jobData = Array.isArray(application.job) ? application.job[0] : application.job;

  if (user!.role === 'admin' && jobData?.company_id.toString() !== user!.companyId) {
    return res.status(404).json({ error: 'Application not found' });
  }

  res.json(application);
};
export const updateApplication = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const recruiter_user_id = req.user!.id;

  // get application and the job's company_id to verify ownership
  const { data: application, error: findError } = await supabase
    .from('applications')
    .select('*, job:jobs(company_id)')
    .eq('id', id)
    .single();

  if (findError) throw findError;

  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const jobData = Array.isArray(application.job) ? application.job[0] : application.job;

  if (req.user!.role === 'admin' && jobData?.company_id.toString() !== req.user!.companyId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const { data: updatedApplication, error: updateError } = await supabase
    .from('applications')
    .update({ status, updated_at: new Date() })
    .eq('id', id)
    .select()
    .single();

  if (updateError) throw updateError;

  if (status === 'shortlisted' || status === 'rejected') {
    const action_type = status === 'shortlisted' ? 'shortlist' : 'reject';
    const { error: actionError } = await supabase
      .from('recruiter_actions')
      .insert({
        application_id: id,
        recruiter_user_id: recruiter_user_id,
        action_type,
      });
    if (actionError) {
      console.error("Failed to create recruiter action:", actionError);
    }
  }

  res.json(updatedApplication);
};

export default {
  createApplication,
  getApplicationById,
  updateApplication
};
