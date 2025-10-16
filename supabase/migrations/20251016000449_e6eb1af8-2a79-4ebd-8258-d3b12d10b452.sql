-- Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('customer', 'admin', 'mechanic');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can insert/update/delete roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add new columns to appointments table
ALTER TABLE public.appointments
ADD COLUMN vin VARCHAR(17),
ADD COLUMN street_address TEXT,
ADD COLUMN city TEXT,
ADD COLUMN state VARCHAR(2),
ADD COLUMN zip_code VARCHAR(10),
ADD COLUMN assigned_mechanic_id UUID REFERENCES auth.users(id),
ADD COLUMN job_status TEXT NOT NULL DEFAULT 'pending' CHECK (job_status IN ('pending', 'approved', 'in_progress', 'completed', 'cancelled'));

-- Update appointments RLS policies to be role-based
DROP POLICY IF EXISTS "Anyone can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;

-- Customers can view their own appointments
CREATE POLICY "Customers can view own appointments"
ON public.appointments
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Admins can view all appointments
CREATE POLICY "Admins can view all appointments"
ON public.appointments
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Mechanics can view assigned appointments
CREATE POLICY "Mechanics can view assigned appointments"
ON public.appointments
FOR SELECT
USING (
  public.has_role(auth.uid(), 'mechanic') AND
  assigned_mechanic_id = auth.uid()
);

-- Authenticated users (customers) can create appointments
CREATE POLICY "Customers can create appointments"
ON public.appointments
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Admins can update any appointment
CREATE POLICY "Admins can update appointments"
ON public.appointments
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Mechanics can update status of assigned appointments
CREATE POLICY "Mechanics can update assigned appointments"
ON public.appointments
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'mechanic') AND
  assigned_mechanic_id = auth.uid()
);

-- Update inquiries RLS to require admin role for viewing
DROP POLICY IF EXISTS "Anyone can create inquiries" ON public.inquiries;

CREATE POLICY "Anyone can create inquiries"
ON public.inquiries
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view inquiries"
ON public.inquiries
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));