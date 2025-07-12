
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Copy, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OfferTemplateListProps {
  onEditTemplate: (templateId: string) => void;
}

export const OfferTemplateList = ({ onEditTemplate }: OfferTemplateListProps) => {
  const { toast } = useToast();

  const { data: templates, isLoading, refetch } = useQuery({
    queryKey: ['offer-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_templates')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const handleDuplicate = async (template: any) => {
    try {
      const { error } = await supabase
        .from('offer_templates')
        .insert({
          name: `${template.name} (Copy)`,
          template_type: template.template_type,
          language: template.language,
          program_type: template.program_type,
          html_content: template.html_content,
          version_number: 1
        });

      if (error) throw error;
      
      toast({
        title: "Template duplicated",
        description: "Template has been successfully duplicated"
      });
      
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate template",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('offer_templates')
        .update({ is_active: false })
        .eq('id', templateId);

      if (error) throw error;
      
      toast({
        title: "Template deleted",
        description: "Template has been successfully deleted"
      });
      
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div>Loading templates...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates?.map((template) => (
        <Card key={template.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditTemplate(template.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDuplicate(template)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">{template.template_type}</Badge>
                <Badge variant="outline">{template.language.toUpperCase()}</Badge>
                {template.program_type && (
                  <Badge>{template.program_type}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Version {template.version_number}
              </p>
              <p className="text-xs text-muted-foreground">
                Updated {new Date(template.updated_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
