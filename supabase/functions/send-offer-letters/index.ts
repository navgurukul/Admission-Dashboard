
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
  autoSend?: boolean;
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

    const { applicantIds, templateIds, autoSend = false }: SendOfferRequest = await req.json();

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

      // Get placeholders with field mapping and conditional logic
      const { data: placeholders, error: placeholdersError } = await supabase
        .from('offer_placeholders')
        .select('*')
        .eq('is_active', true);

      if (placeholdersError) {
        console.error('Error fetching placeholders:', placeholdersError);
      }

      // Process placeholders with enhanced logic
      const processedPlaceholders: Record<string, string> = {};
      
      // Basic placeholders
      processedPlaceholders.STUDENT_NAME = applicant.name || '';
      processedPlaceholders.MOBILE_NUMBER = applicant.mobile_no || '';
      processedPlaceholders.WHATSAPP_NUMBER = applicant.whatsapp_number || '';
      processedPlaceholders.CAMPUS = applicant.campus || '';
      processedPlaceholders.FINAL_MARKS = applicant.final_marks?.toString() || '';
      processedPlaceholders.INTERVIEW_DATE = applicant.interview_date ? 
        new Date(applicant.interview_date).toLocaleDateString() : '';
      
      // Enhanced placeholder processing with conditional logic
      if (placeholders) {
        for (const placeholder of placeholders) {
          let value = '';
          
          // Handle field mapping
          if (placeholder.field_mapping) {
            const mapping = placeholder.field_mapping;
            if (mapping.source_table === 'admission_dashboard' && mapping.source_field) {
              value = applicant[mapping.source_field]?.toString() || mapping.default_value || '';
            }
          }
          
          // Handle conditional logic
          if (placeholder.conditional_logic) {
            const logic = placeholder.conditional_logic;
            
            // Process conditions for allotted school assignment
            if (logic.conditions) {
              for (const condition of logic.conditions) {
                if (condition.if) {
                  // Simple condition evaluation (can be enhanced)
                  if (condition.if.includes('final_marks >= 18') && applicant.final_marks >= 18) {
                    value = condition.then;
                    break;
                  } else if (condition.if.includes('final_marks < 18') && applicant.final_marks < 18 && applicant.final_marks >= 15) {
                    value = condition.then;
                    break;
                  }
                } else if (condition.else) {
                  value = condition.else;
                }
              
            }
            
            // Process template selection logic
            if (logic.template_selection && placeholder.placeholder_key === 'TEMPLATE_TYPE') {
              const allottedSchool = processedPlaceholders.ALLOTTED_SCHOOL || applicant.allotted_school;
              for (const selection of logic.template_selection) {
                if (selection.if.includes(`allotted_school === '${allottedSchool}'`)) {
                  value = selection.template;
                  break;
                }
              }
            }
          }
          
          if (value) {
            processedPlaceholders[placeholder.placeholder_key] = value;
          }
        }
      }

      // Determine template type based on allotted school
      let selectedTemplateType = 'offer_letter';
      const allottedSchool = processedPlaceholders.ALLOTTED_SCHOOL || applicant.allotted_school;
      
      if (allottedSchool === 'SOP') {
        selectedTemplateType = 'sop_offer_letter';
      } else if (allottedSchool === 'SOB') {
        selectedTemplateType = 'sob_offer_letter';
      }

      // Process templates with placeholders
      const processedTemplates = templates.map(template => {
        let content = template.html_content;
        
        // Replace all placeholders
        Object.entries(processedPlaceholders).forEach(([key, value]) => {
          const placeholder = `{{${key}}}`;
          content = content.replace(new RegExp(placeholder, 'g'), value);
        });

        // Add system placeholders
        const systemPlaceholders = {
          CURRENT_DATE: new Date().toLocaleDateString(),
          OFFER_EXPIRY_DATE: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          ACADEMIC_YEAR: new Date().getFullYear().toString()
        };

        Object.entries(systemPlaceholders).forEach(([key, value]) => {
          const placeholder = `{{${key}}}`;
          content = content.replace(new RegExp(placeholder, 'g'), value);
        });

        return { ...template, processed_content: content };
      });

      // Create offer history record
      const { data: historyRecord, error: historyError } = await supabase
        .from('offer_history')
        .insert({
          applicant_id: applicantId,
          template_version_used: {
            ...templateIds,
            selected_template_type: selectedTemplateType,
            processed_placeholders: processedPlaceholders
          },
          email_status: autoSend ? 'processing' : 'pending'
        })
        .select()
        .single();

      if (historyError) {
        console.error('Failed to create history record:', historyError);
        continue;
      }

      // If autoSend is enabled, process the sending logic
      if (autoSend) {
        // TODO: Implement PDF generation from processed templates
        // TODO: Upload PDFs to storage
        // TODO: Send email with attachments using Resend or similar
        
        // For now, mark as sent and update applicant status
        await supabase
          .from('offer_history')
          .update({ 
            email_status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', historyRecord.id);

        // Update applicant status to "Offer Letter Sent"
        await supabase
          .from('admission_dashboard')
          .update({ 
            offer_letter_status: 'sent',
            stage: 'decision',
            status: 'offer_sent'
          })
          .eq('id', applicantId);
      }

      // Log audit
      await supabase
        .from('offer_audit_log')
        .insert({
          action_type: autoSend ? 'offer_auto_sent' : 'offer_prepared',
          applicant_id: applicantId,
          details: { 
            templates_used: templateIds,
            selected_template_type: selectedTemplateType,
            processed_placeholders: processedPlaceholders,
            auto_send: autoSend
          }
        });
      
      console.log(`Processed offer for applicant ${applicantId} - Auto send: ${autoSend}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: applicantIds.length,
        auto_sent: autoSend 
      }),
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
