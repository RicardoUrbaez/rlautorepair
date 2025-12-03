-- Create table to store TOTP secrets for users
CREATE TABLE public.totp_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret text NOT NULL,
  enabled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.totp_secrets ENABLE ROW LEVEL SECURITY;

-- Users can view their own TOTP secrets
CREATE POLICY "Users can view their own TOTP secret"
ON public.totp_secrets
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own TOTP secrets
CREATE POLICY "Users can update their own TOTP secret"
ON public.totp_secrets
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own TOTP secret
CREATE POLICY "Users can insert their own TOTP secret"
ON public.totp_secrets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all TOTP secrets
CREATE POLICY "Admins can view all TOTP secrets"
ON public.totp_secrets
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create assigned_jobs table for mechanic job assignment
CREATE TABLE public.assigned_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tekmetric_job_id text,
  tekmetric_appointment_id text,
  customer_name text NOT NULL,
  customer_phone text,
  vehicle text NOT NULL,
  description text,
  appointment_date date,
  assigned_to uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'approved')),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  approved_at timestamp with time zone,
  approved_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.assigned_jobs ENABLE ROW LEVEL SECURITY;

-- Admins can do everything with assigned_jobs
CREATE POLICY "Admins can manage all assigned jobs"
ON public.assigned_jobs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Mechanics can view jobs assigned to them
CREATE POLICY "Mechanics can view assigned jobs"
ON public.assigned_jobs
FOR SELECT
USING (has_role(auth.uid(), 'mechanic'::app_role));

-- Mechanics can update job status
CREATE POLICY "Mechanics can update job status"
ON public.assigned_jobs
FOR UPDATE
USING (has_role(auth.uid(), 'mechanic'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_totp_secrets_updated_at
BEFORE UPDATE ON public.totp_secrets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assigned_jobs_updated_at
BEFORE UPDATE ON public.assigned_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();