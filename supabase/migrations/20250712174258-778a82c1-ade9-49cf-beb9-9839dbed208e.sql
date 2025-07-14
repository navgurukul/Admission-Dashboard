
-- Create templates table for storing offer letter templates
CREATE TABLE public.offer_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('offer_letter', 'consent_form', 'checklist')),
  language TEXT NOT NULL CHECK (language IN ('en', 'hi')),
  program_type TEXT CHECK (program_type IN ('SOP', 'SOB')),
  html_content TEXT NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(template_type, language, program_type, version_number)
);

-- Create offer history table for tracking sent offers
CREATE TABLE public.offer_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id UUID NOT NULL REFERENCES public.admission_dashboard(id),
  template_version_used JSONB NOT NULL, -- stores template IDs and versions used
  email_status TEXT NOT NULL DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'delivered', 'opened', 'bounced', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  message_id TEXT,
  pdf_urls JSONB, -- stores URLs to generated PDFs
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit log table for tracking all actions
CREATE TABLE public.offer_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type TEXT NOT NULL CHECK (action_type IN ('template_created', 'template_updated', 'offer_sent', 'status_changed')),
  user_id UUID REFERENCES auth.users,
  applicant_id UUID REFERENCES public.admission_dashboard(id),
  template_id UUID REFERENCES public.offer_templates(id),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create placeholder settings table for managing available merge fields
CREATE TABLE public.offer_placeholders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  placeholder_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  data_source TEXT NOT NULL, -- which table/field to pull from
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default placeholders
INSERT INTO public.offer_placeholders (placeholder_key, display_name, description, data_source) VALUES
('full_name', 'Full Name', 'Applicant''s full name', 'admission_dashboard.name'),
('mobile_no', 'Mobile Number', 'Applicant''s mobile number', 'admission_dashboard.mobile_no'),
('email', 'Email Address', 'Applicant''s email address', 'admission_dashboard.whatsapp_number'),
('city', 'City', 'Applicant''s city', 'admission_dashboard.city'),
('program_name', 'Program Name', 'Name of the program (SOP/SOB)', 'admission_dashboard.qualifying_school'),
('campus', 'Campus', 'Assigned campus', 'admission_dashboard.campus'),
('allotted_school', 'Allotted School', 'School assigned to applicant', 'admission_dashboard.allotted_school'),
('offer_expiry_date', 'Offer Expiry Date', 'Date when offer expires', 'calculated'),
('current_date', 'Current Date', 'Today''s date', 'calculated'),
('final_marks', 'Final Marks', 'Screening test marks', 'admission_dashboard.final_marks');

-- Enable RLS on all tables
ALTER TABLE public.offer_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_placeholders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for offer_templates
CREATE POLICY "Authenticated users can view templates" ON public.offer_templates FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create templates" ON public.offer_templates FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update templates" ON public.offer_templates FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete templates" ON public.offer_templates FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create RLS policies for offer_history
CREATE POLICY "Authenticated users can view offer history" ON public.offer_history FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create offer history" ON public.offer_history FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update offer history" ON public.offer_history FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create RLS policies for offer_audit_log
CREATE POLICY "Authenticated users can view audit log" ON public.offer_audit_log FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create audit log" ON public.offer_audit_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for offer_placeholders
CREATE POLICY "Authenticated users can view placeholders" ON public.offer_placeholders FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage placeholders" ON public.offer_placeholders FOR ALL USING (auth.uid() IS NOT NULL);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_offer_templates_updated_at
  BEFORE UPDATE ON public.offer_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER update_offer_history_updated_at
  BEFORE UPDATE ON public.offer_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_timestamp();

-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('offer-pdfs', 'offer-pdfs', false);

-- Create storage policies
CREATE POLICY "Authenticated users can upload PDFs" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'offer-pdfs' AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can view PDFs" ON storage.objects FOR SELECT USING (
  bucket_id = 'offer-pdfs' AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can update PDFs" ON storage.objects FOR UPDATE USING (
  bucket_id = 'offer-pdfs' AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can delete PDFs" ON storage.objects FOR DELETE USING (
  bucket_id = 'offer-pdfs' AND auth.uid() IS NOT NULL
);
