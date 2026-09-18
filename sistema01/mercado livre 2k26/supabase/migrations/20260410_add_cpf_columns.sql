-- Add CPF column to orders table if it doesn't exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Add CPF column to customers table if it doesn't exist
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Comment on columns for clarity
COMMENT ON COLUMN public.orders.cpf IS 'CPF or Document number of the customer for this order';
COMMENT ON COLUMN public.customers.cpf IS 'Last known CPF or Document number for this customer';
