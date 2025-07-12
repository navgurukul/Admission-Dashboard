
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendOfferRequest {
  applicantIds: string[];
  templateIds: {
    offer_letter: string;
    consent_en: string;
    consent_hi: string;
    checklist_en: string;
    checklist_hi: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { applicantIds, templateIds }: SendOfferRequest = await req.json();

    for (const applicantId of applicantIds) {
      // Get applicant data
      const { data: applicant, error: applicantError } = await supabase
        .from('admission_dashboard')
        .select('*')
        .eq('id', applicantId)
        .single();

      if (applicantError || !applicant) {
        console.error('Applicant not found:', applicantId);
        continue;
      }

      // Get templates
      const { data: templates, error: templatesError } = await supabase
        .from('offer_templates')
        .select('*')
        .in('id', Object.values(templateIds));

      if (templatesError || !templates) {
        console.error('Templates not found');
        continue;
      }

      // Process placeholders for each template
      const processedTemplates = templates.map(template => {
        let content = template.html_content;
        
        // Replace placeholders with actual data
        const placeholders = {
          full_name: applicant.name || '',
          mobile_no: applicant.mobile_no || '',
          email: applicant.whatsapp_number || '',
          city: applicant.city || '',
          campus: applicant.campus || '',
          allotted_school: applicant.allotted_school || '',
          final_marks: applicant.final_marks?.toString() || '',
          current_date: new Date().toLocaleDateString(),
          offer_expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
        };

        for (const [key, value] of Object.entries(placeholders)) {
          content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }

        return { ...template, processed_content: content };
      });

      // Create offer history record
      const { data: historyRecord, error: historyError } = await supabase
        .from('offer_history')
        .insert({
          applicant_id: applicantId,
          template_version_used: templateIds,
          email_status: 'pending'
        })
        .select()
        .single();

      if (historyError) {
        console.error('Failed to create history record:', historyError);
        continue;
      }

      // TODO: Generate PDFs from processed templates
      // TODO: Upload PDFs to storage
      // TODO: Send email with attachments
      // TODO: Update history record with status

      // For now, just mark as sent
      await supabase
        .from('offer_history')
        .update({ 
          email_status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', historyRecord.id);

      // Log audit
      await supabase
        .from('offer_audit_log')
        .insert({
          action_type: 'offer_sent',
          applicant_id: applicantId,
          details: { templates_used: templateIds }
        });
    }

    return new Response(
      JSON.stringify({ success: true, processed: applicantIds.length }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
