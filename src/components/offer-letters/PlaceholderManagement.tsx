import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, X, Database, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Placeholder {
  id: string;
  placeholder_key: string;
  display_name: string;
  description: string | null;
  data_source: string;
  is_active: boolean;
  created_at: string;
  field_mapping: any;
  conditional_logic: any;
}

export const PlaceholderManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingPlaceholder, setEditingPlaceholder] = useState<Placeholder | null>(null);
  
  const [formData, setFormData] = useState({
    placeholder_key: '',
    display_name: '',
    description: '',
    data_source: 'admission_dashboard',
    field_mapping: '',
    conditional_logic: ''
  });

  const { data: placeholders, isLoading } = useQuery({
    queryKey: ['all-placeholders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_placeholders')
        .select('*')
        .order('display_name');
      
      if (error) throw error;
      return data as Placeholder[];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const saveData = {
        ...data,
        field_mapping: data.field_mapping ? JSON.parse(data.field_mapping) : null,
        conditional_logic: data.conditional_logic ? JSON.parse(data.conditional_logic) : null
      };
      
      if (editingPlaceholder) {
        const { error } = await supabase
          .from('offer_placeholders')
          .update(saveData)
          .eq('id', editingPlaceholder.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('offer_placeholders')
          .insert([saveData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Placeholder ${editingPlaceholder ? 'updated' : 'created'} successfully`
      });
      queryClient.invalidateQueries({ queryKey: ['all-placeholders'] });
      queryClient.invalidateQueries({ queryKey: ['offer-placeholders'] });
      resetForm();
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "Failed to save placeholder",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('offer_placeholders')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Placeholder deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['all-placeholders'] });
      queryClient.invalidateQueries({ queryKey: ['offer-placeholders'] });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete placeholder",
        variant: "destructive"
      });
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('offer_placeholders')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-placeholders'] });
      queryClient.invalidateQueries({ queryKey: ['offer-placeholders'] });
    }
  });

  const resetForm = () => {
    setFormData({
      placeholder_key: '',
      display_name: '',
      description: '',
      data_source: 'admission_dashboard',
      field_mapping: '',
      conditional_logic: ''
    });
    setEditingPlaceholder(null);
    setShowAddDialog(false);
  };

  const handleEdit = (placeholder: Placeholder) => {
    setFormData({
      placeholder_key: placeholder.placeholder_key,
      display_name: placeholder.display_name,
      description: placeholder.description || '',
      data_source: placeholder.data_source,
      field_mapping: placeholder.field_mapping ? JSON.stringify(placeholder.field_mapping, null, 2) : '',
      conditional_logic: placeholder.conditional_logic ? JSON.stringify(placeholder.conditional_logic, null, 2) : ''
    });
    setEditingPlaceholder(placeholder);
    setShowAddDialog(true);
  };

  const handleSave = () => {
    if (!formData.placeholder_key.trim() || !formData.display_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Placeholder key and display name are required",
        variant: "destructive"
      });
      return;
    }
    
    // Validate JSON fields
    if (formData.field_mapping) {
      try {
        JSON.parse(formData.field_mapping);
      } catch (error) {
        toast({
          title: "Validation Error",
          description: "Field mapping must be valid JSON",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (formData.conditional_logic) {
      try {
        JSON.parse(formData.conditional_logic);
      } catch (error) {
        toast({
          title: "Validation Error",
          description: "Conditional logic must be valid JSON",
          variant: "destructive"
        });
        return;
      }
    }
    
    saveMutation.mutate(formData);
  };

  const addPresetMapping = (type: 'allotted_school' | 'template_type') => {
    let mapping = '';
    let logic = '';
    
    if (type === 'allotted_school') {
      setFormData(prev => ({
        ...prev,
        placeholder_key: 'ALLOTTED_SCHOOL',
        display_name: 'Allotted School',
        description: 'School assigned based on student performance and preferences',
        field_mapping: JSON.stringify({
          "source_table": "admission_dashboard",
          "source_field": "allotted_school",
          "default_value": "Not Assigned"
        }, null, 2),
        conditional_logic: JSON.stringify({
          "conditions": [
            {
              "if": "final_marks >= 18",
              "then": "SOP",
              "description": "Assign School of Programming for high performers"
            },
            {
              "if": "final_marks < 18 && final_marks >= 15",
              "then": "SOB", 
              "description": "Assign School of Business for average performers"
            },
            {
              "else": "General",
              "description": "Default assignment"
            }
          ]
        }, null, 2)
      }));
    } else if (type === 'template_type') {
      setFormData(prev => ({
        ...prev,
        placeholder_key: 'TEMPLATE_TYPE',
        display_name: 'Template Type',
        description: 'Determines which template to use based on student data',
        field_mapping: JSON.stringify({
          "source_table": "admission_dashboard",
          "logic_based": true
        }, null, 2),
        conditional_logic: JSON.stringify({
          "template_selection": [
            {
              "if": "allotted_school === 'SOP'",
              "template": "sop_offer_letter",
              "description": "Use SOP offer letter template"
            },
            {
              "if": "allotted_school === 'SOB'", 
              "template": "sob_offer_letter",
              "description": "Use SOB offer letter template"
            }
          ]
        }, null, 2)
      }));
    }
  };

  if (isLoading) {
    return <div>Loading placeholders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Manage Placeholders</h3>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Placeholder
        </Button>
      </div>

      <div className="grid gap-4">
        {placeholders?.map((placeholder) => (
          <Card key={placeholder.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{placeholder.display_name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={placeholder.is_active ? "default" : "secondary"}>
                    {placeholder.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {placeholder.field_mapping && (
                    <Badge variant="outline" className="text-xs">
                      <Database className="h-3 w-3 mr-1" />
                      Mapped
                    </Badge>
                  )}
                  {placeholder.conditional_logic && (
                    <Badge variant="outline" className="text-xs">
                      <Settings className="h-3 w-3 mr-1" />
                      Logic
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(placeholder)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => 
                      toggleActiveMutation.mutate({
                        id: placeholder.id,
                        is_active: !placeholder.is_active
                      })
                    }
                  >
                    {placeholder.is_active ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(placeholder.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{placeholder.placeholder_key}</Badge>
                  <span className="text-sm text-muted-foreground">
                    from {placeholder.data_source}
                  </span>
                </div>
                {placeholder.description && (
                  <p className="text-sm text-muted-foreground">
                    {placeholder.description}
                  </p>
                )}
                {placeholder.field_mapping && (
                  <div className="text-xs bg-blue-50 p-2 rounded">
                    <strong>Field Mapping:</strong> {JSON.stringify(placeholder.field_mapping)}
                  </div>
                )}
                {placeholder.conditional_logic && (
                  <div className="text-xs bg-green-50 p-2 rounded">
                    <strong>Conditional Logic:</strong> {JSON.stringify(placeholder.conditional_logic)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showAddDialog} onOpenChange={resetForm}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlaceholder ? 'Edit Placeholder' : 'Add New Placeholder'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => addPresetMapping('allotted_school')}
              >
                <Database className="h-4 w-4 mr-1" />
                Allotted School Preset
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => addPresetMapping('template_type')}
              >
                <Settings className="h-4 w-4 mr-1" />
                Template Type Preset
              </Button>
            </div>

            <div>
              <Label htmlFor="placeholder_key">Placeholder Key</Label>
              <Input
                id="placeholder_key"
                value={formData.placeholder_key}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  placeholder_key: e.target.value.toUpperCase().replace(/\s+/g, '_') 
                }))}
                placeholder="STUDENT_NAME"
              />
            </div>
            
            <div>
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="Student Name"
              />
            </div>
            
            <div>
              <Label htmlFor="data_source">Data Source</Label>
              <Select
                value={formData.data_source}
                onValueChange={(value) => setFormData(prev => ({ ...prev, data_source: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admission_dashboard">Admission Dashboard</SelectItem>
                  <SelectItem value="profiles">User Profiles</SelectItem>
                  <SelectItem value="custom">Custom Value</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description of what this placeholder represents"
              />
            </div>

            <div>
              <Label htmlFor="field_mapping">Field Mapping (JSON)</Label>
              <Textarea
                id="field_mapping"
                value={formData.field_mapping}
                onChange={(e) => setFormData(prev => ({ ...prev, field_mapping: e.target.value }))}
                placeholder='{"source_table": "admission_dashboard", "source_field": "allotted_school"}'
                className="font-mono text-sm"
                rows={4}
              />
              <div className="text-xs text-muted-foreground mt-1">
                Optional: Define how to map this placeholder to database fields
              </div>
            </div>

            <div>
              <Label htmlFor="conditional_logic">Conditional Logic (JSON)</Label>
              <Textarea
                id="conditional_logic"
                value={formData.conditional_logic}
                onChange={(e) => setFormData(prev => ({ ...prev, conditional_logic: e.target.value }))}
                placeholder='{"conditions": [{"if": "final_marks >= 18", "then": "SOP"}]}'
                className="font-mono text-sm"
                rows={6}
              />
              <div className="text-xs text-muted-foreground mt-1">
                Optional: Define conditional logic for dynamic value assignment
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
