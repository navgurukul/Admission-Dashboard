-- Create the Admission Dashboard table
CREATE TABLE public.admission_dashboard (
    mobile_no TEXT NOT NULL PRIMARY KEY,
    unique_number TEXT,
    set_name TEXT,
    exam_centre TEXT,
    date_of_testing DATE,
    name TEXT,
    whatsapp_number TEXT,
    block TEXT,
    city TEXT,
    caste TEXT,
    gender TEXT,
    qualification TEXT,
    current_work TEXT,
    final_marks NUMERIC,
    qualifying_school TEXT,
    lr_status TEXT,
    lr_comments TEXT,
    cfr_status TEXT,
    cfr_comments TEXT,
    offer_letter_status TEXT,
    allotted_school TEXT,
    joining_status TEXT,
    final_notes TEXT,
    triptis_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.admission_dashboard ENABLE ROW LEVEL SECURITY;

-- Create policies for admissions dashboard access
-- For now, allowing all authenticated users to view and manage data
-- You can modify these policies based on your specific access requirements
CREATE POLICY "Allow authenticated users to view admission dashboard" 
ON public.admission_dashboard 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert admission dashboard" 
ON public.admission_dashboard 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update admission dashboard" 
ON public.admission_dashboard 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete admission dashboard" 
ON public.admission_dashboard 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admission_dashboard_updated_at
    BEFORE UPDATE ON public.admission_dashboard
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on commonly queried fields for better performance
CREATE INDEX idx_admission_dashboard_name ON public.admission_dashboard(name);
CREATE INDEX idx_admission_dashboard_city ON public.admission_dashboard(city);
CREATE INDEX idx_admission_dashboard_date_of_testing ON public.admission_dashboard(date_of_testing);
CREATE INDEX idx_admission_dashboard_lr_status ON public.admission_dashboard(lr_status);
CREATE INDEX idx_admission_dashboard_cfr_status ON public.admission_dashboard(cfr_status);
CREATE INDEX idx_admission_dashboard_offer_letter_status ON public.admission_dashboard(offer_letter_status);