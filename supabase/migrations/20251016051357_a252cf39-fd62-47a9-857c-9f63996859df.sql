-- Allow public users to create appointments (for booking form)
DROP POLICY IF EXISTS "Authenticated users can create appointments" ON public.appointments;

CREATE POLICY "Anyone can create appointments"
ON public.appointments
FOR INSERT
TO public
WITH CHECK (true);

-- Update the user_id column to be nullable since public users won't have one
ALTER TABLE public.appointments 
ALTER COLUMN user_id DROP NOT NULL;