
-- Add a new auto-generated ID column as the primary key
ALTER TABLE public.admission_dashboard ADD COLUMN id UUID DEFAULT gen_random_uuid();

-- Drop the existing primary key constraint on mobile_no
ALTER TABLE public.admission_dashboard DROP CONSTRAINT admission_dashboard_pkey;

-- Set the new ID column as the primary key
ALTER TABLE public.admission_dashboard ADD PRIMARY KEY (id);

-- Update the ID column to be NOT NULL and ensure it has values for existing rows
ALTER TABLE public.admission_dashboard ALTER COLUMN id SET NOT NULL;

-- Create a unique index on mobile_no to maintain data integrity while allowing duplicates if needed
-- (We'll keep mobile_no as a regular column that can have duplicates)
-- CREATE UNIQUE INDEX idx_admission_dashboard_mobile_no ON public.admission_dashboard(mobile_no);

-- Update the trigger to use the new primary key structure
-- The existing trigger should continue to work as it updates the updated_at column
