import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/offer-letters/RichTextEditor";
import { PlaceholderPanel } from "@/components/offer-letters/PlaceholderPanel";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OfferTemplateEditorProps {
  templateId?: string | null;
  isNew?: boolean;
  onClose: () => void;
}

export const OfferTemplateEditor = ({ templateId, isNew, onClose }: OfferTemplateEditorProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    template_type: 'offer_letter',
    language: 'en',
    program_type: '',
    html_content: ''
  });

  const { data: template, isLoading } = useQuery({
    queryKey: ['offer-template', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const { data, error } = await supabase
        .from('offer_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!templateId && !isNew
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        template_type: template.template_type,
        language: template.language,
        program_type: template.program_type || '',
        html_content: template.html_content
      });
    }
  }, [template]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (isNew) {
        const { error } = await supabase
          .from('offer_templates')
          .insert([data]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('offer_templates')
          .update(data)
          .eq('id', templateId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Template saved",
        description: "Template has been successfully saved"
      });
      queryClient.invalidateQueries({ queryKey: ['offer-templates'] });
      onClose();
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "Failed to save template. Please check all required fields.",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Template name is required",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.html_content.trim()) {
      toast({
        title: "Validation Error", 
        description: "Template content is required",
        variant: "destructive"
      });
      return;
    }
    
    saveMutation.mutate(formData);
  };

  if (isLoading && !isNew) {
    return <div>Loading template...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Templates
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template_type">Template Type</Label>
                    <Select
                      value={formData.template_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, template_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="offer_letter">Offer Letter</SelectItem>
                        <SelectItem value="consent_form">Consent Form</SelectItem>
                        <SelectItem value="checklist">Checklist</SelectItem>
                        <SelectItem value="complete_package">Complete Package (Letter + Forms)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="hi">Hindi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="program_type">Program Type</Label>
                    <Select
                      value={formData.program_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, program_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SOP">School of Programming</SelectItem>
                        <SelectItem value="SOB">School of Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.template_type === 'complete_package' && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Complete Package Template</h4>
                    <p className="text-sm text-blue-700">
                      This template type will include the offer letter, consent form, and checklist in a single email.
                      Structure your content to include all three sections clearly separated.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Template Content</CardTitle>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  content={formData.html_content}
                  onChange={(content) => setFormData(prev => ({ ...prev, html_content: content }))}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <PlaceholderPanel
              onInsertPlaceholder={(placeholder) => {
                setFormData(prev => ({
                  ...prev,
                  html_content: prev.html_content + `{{${placeholder}}}`
                }));
              }}
            />
          </div>
        </div>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          <div 
            className="p-6 border rounded bg-white"
            dangerouslySetInnerHTML={{ __html: formData.html_content }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
