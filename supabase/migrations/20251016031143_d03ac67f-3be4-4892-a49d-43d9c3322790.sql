-- Update RLS policies for appointments table to support admin and mechanic roles only
-- Drop existing customer-specific policies
DROP POLICY IF EXISTS "Customers can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Customers can create appointments" ON public.appointments;

-- Update policies for admins
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can update appointments" ON public.appointments;

CREATE POLICY "Admins can view all appointments" 
ON public.appointments 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all appointments" 
ON public.appointments 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete appointments" 
ON public.appointments 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Update policies for mechanics
DROP POLICY IF EXISTS "Mechanics can view assigned appointments" ON public.appointments;
DROP POLICY IF EXISTS "Mechanics can update assigned appointments" ON public.appointments;

CREATE POLICY "Mechanics can view all appointments" 
ON public.appointments 
FOR SELECT 
USING (public.has_role(auth.uid(), 'mechanic'));

CREATE POLICY "Mechanics can update assigned appointments" 
ON public.appointments 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'mechanic') AND assigned_mechanic_id = auth.uid());

-- Allow anyone to create appointments (no customer role needed)
CREATE POLICY "Anyone can create appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (true);

-- Update inquiries table policies
DROP POLICY IF EXISTS "Admins can view inquiries" ON public.inquiries;

CREATE POLICY "Admins can view all inquiries" 
ON public.inquiries 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete inquiries" 
ON public.inquiries 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Note: After this migration, manually create these users in Supabase Auth:
-- 1. admin@rlautorepair.com (for single admin login)
-- 2. mechanic@rlautorepair.com (shared login for Jose, Tony, Jesus)
-- Then insert roles:
-- INSERT INTO public.user_roles (user_id, role) VALUES ('[admin-user-uuid]', 'admin');
-- INSERT INTO public.user_roles (user_id, role) VALUES ('[mechanic-user-uuid]', 'mechanic');