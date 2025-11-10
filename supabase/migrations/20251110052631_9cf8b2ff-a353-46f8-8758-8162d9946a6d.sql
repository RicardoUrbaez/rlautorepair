-- Create customers table for Tekmetric sync
CREATE TABLE IF NOT EXISTS public.tekmetric_customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tekmetric_id text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  synced_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create orders/repair orders table for Tekmetric sync
CREATE TABLE IF NOT EXISTS public.tekmetric_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tekmetric_id text UNIQUE NOT NULL,
  customer_id uuid REFERENCES public.tekmetric_customers(id),
  tekmetric_customer_id text,
  shop_id text,
  repair_order_number text,
  status text,
  vehicle_year integer,
  vehicle_make text,
  vehicle_model text,
  vin text,
  total_amount numeric,
  created_date timestamp with time zone,
  completed_date timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  synced_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create sync logs table to track sync operations
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type text NOT NULL, -- 'customers', 'orders', 'appointments'
  sync_type text NOT NULL, -- 'manual', 'scheduled'
  status text NOT NULL, -- 'started', 'completed', 'failed'
  records_synced integer DEFAULT 0,
  error_message text,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.tekmetric_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tekmetric_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tekmetric_customers
CREATE POLICY "Admins can view all customers"
  ON public.tekmetric_customers FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert customers"
  ON public.tekmetric_customers FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update customers"
  ON public.tekmetric_customers FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for tekmetric_orders
CREATE POLICY "Admins can view all orders"
  ON public.tekmetric_orders FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert orders"
  ON public.tekmetric_orders FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update orders"
  ON public.tekmetric_orders FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for sync_logs
CREATE POLICY "Admins can view sync logs"
  ON public.sync_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert sync logs"
  ON public.sync_logs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_tekmetric_customers_updated_at
  BEFORE UPDATE ON public.tekmetric_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tekmetric_orders_updated_at
  BEFORE UPDATE ON public.tekmetric_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_tekmetric_customers_tekmetric_id ON public.tekmetric_customers(tekmetric_id);
CREATE INDEX idx_tekmetric_orders_tekmetric_id ON public.tekmetric_orders(tekmetric_id);
CREATE INDEX idx_sync_logs_entity_type ON public.sync_logs(entity_type);
CREATE INDEX idx_sync_logs_started_at ON public.sync_logs(started_at DESC);