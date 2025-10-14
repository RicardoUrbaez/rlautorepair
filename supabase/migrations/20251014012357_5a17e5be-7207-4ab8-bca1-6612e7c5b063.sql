-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year INTEGER NOT NULL,
  service_id UUID REFERENCES public.services(id) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled'))
);

-- Create inquiries table for contact form
CREATE TABLE public.inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for services (public read)
CREATE POLICY "Services are viewable by everyone"
ON public.services FOR SELECT
USING (true);

-- RLS Policies for appointments (public create, restricted view)
CREATE POLICY "Anyone can create appointments"
ON public.appointments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view their own appointments"
ON public.appointments FOR SELECT
USING (true);

CREATE POLICY "Anyone can update appointments"
ON public.appointments FOR UPDATE
USING (true);

-- RLS Policies for inquiries (public create only)
CREATE POLICY "Anyone can create inquiries"
ON public.inquiries FOR INSERT
WITH CHECK (true);

-- Insert default services
INSERT INTO public.services (name, description, price, duration_minutes) VALUES
('Oil Change', 'Complete oil and filter change with multi-point inspection', 49.99, 30),
('Brake Service', 'Brake pad replacement and rotor resurfacing', 249.99, 90),
('Engine Diagnostics', 'Complete engine diagnostic scan and troubleshooting', 89.99, 60),
('Tire Replacement', 'Professional tire mounting, balancing, and alignment', 199.99, 60),
('Battery Service', 'Battery testing, cleaning, and replacement', 129.99, 45),
('AC Repair', 'Air conditioning system diagnostics and repair', 179.99, 120),
('Transmission Service', 'Transmission fluid change and inspection', 159.99, 75),
('Wheel Alignment', 'Four-wheel alignment and suspension check', 99.99, 45);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();