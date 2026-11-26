import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Loader2, CheckSquare, Square } from "lucide-react";

export interface CSVField {
  id: string;
  label: string;
  category: string;
  required?: boolean;
}

interface CSVExportFieldsModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (selectedFields: string[]) => Promise<void>;
  exportType: 'all' | 'filtered' | 'selected';
  exportCount?: number;
}

// Define all available CSV fields organized by category
export const ALL_CSV_FIELDS: CSVField[] = [
  // Personal Information
  { id: 'first_name', label: '*First Name', category: 'Personal Information', required: true },
  { id: 'middle_name', label: 'Middle Name', category: 'Personal Information' },
  { id: 'last_name', label: 'Last Name', category: 'Personal Information', required: true },
  { id: 'gender', label: 'Gender', category: 'Personal Information' },
  { id: 'dob', label: 'Date of Birth', category: 'Personal Information' },
  { id: 'email', label: 'Email', category: 'Personal Information' },
  { id: 'phone_number', label: '*Phone Number', category: 'Personal Information' },
  { id: 'whatsapp_number', label: 'WhatsApp Number', category: 'Personal Information' },
  { id: 'mode', label: 'Mode', category: 'Personal Information' },
  { id: 'imported_at', label: 'Imported At', category: 'Personal Information' },
  { id: 'is_duplicate', label: 'Is Duplicate', category: 'Personal Information' },
  
  // Address Information
  { id: 'state', label: 'State', category: 'Address Information' },
  { id: 'city', label: 'City', category: 'Address Information' },
  { id: 'district', label: 'District', category: 'Address Information' },
  { id: 'block', label: 'Block', category: 'Address Information' },
  { id: 'pin_code', label: 'Pincode', category: 'Address Information' },
  
  // Academic & Background
  {id: 'school_college_name', label: 'School/College Name', category: 'Academic & Background' },
  { id: 'qualification', label: 'Qualification', category: 'Academic & Background' },
  { id: 'graduation_mode', label: 'Graduation Mode', category: 'Academic & Background' },
  { id: 'graduation_year', label: 'Graduation Year', category: 'Academic & Background' },
  { id: 'partner_name', label: 'Partner Name', category: 'Partner & Donor' },
  {id:'donor_name',label:'Donor Name',category:'Partner & Donor'},

  
  // School & Campus
  { id: 'initial_school', label: '*Preferred School', category: 'Preferred School & Campus' },
  { id: 'preferred_campus', label: 'Preferred Campus', category: 'Preferred School & Campus' },

  { id: 'qualifying_school', label: 'Qualifying School', category: 'Assigned School and Campus' },
  { id: 'attempt_number', label: 'Attempt Number', category: 'Personal Information' },
  
  // Communication
  { id: 'communication_notes', label: 'Communication Notes', category: 'Communication' },
  
  // Screening Round
  { id: 'exam_status', label: 'Status', category: 'Screening Round' },
  { id: 'question_set_name', label: 'Set Name', category: 'Screening Round' },
  { id: 'obtained_marks', label: 'Mark', category: 'Screening Round' },
  { id: 'screening_qualifying_school', label: 'Qualifying School', category: 'Screening Round' },
  { id: 'exam_centre', label: 'Exam Centre', category: 'Screening Round' },
  { id: 'date_of_test', label: 'Date of Test', category: 'Screening Round' },
  { id: 'screening_created_at', label: 'Created At', category: 'Screening Round' },
  { id: 'screening_updated_at', label: 'Updated At', category: 'Screening Round' },
  { id: 'screening_updated_by', label: 'Updated By', category: 'Screening Round' },
  
  // Learning Round
  { id: 'learning_round_status', label: 'Status', category: 'Learning Round' },
  { id: 'learning_round_qualifying_school', label: 'Qualifying School', category: 'Learning Round' },
  { id: 'learning_round_comments', label: 'Learning Round Comments', category: 'Learning Round' },
  { id: 'learning_round_created_at', label: 'Created At', category: 'Learning Round' },
  { id: 'learning_round_updated_at', label: 'Updated At', category: 'Learning Round' },
  { id: 'learning_round_updated_by', label: 'Updated By', category: 'Learning Round' },
  
  // Cultural Fit Round
  { id: 'cultural_fit_status', label: 'Status', category: 'Cultural Fit Round' },
  { id: 'cultural_fit_overall_feedback', label: 'Overall Feedback', category: 'Cultural Fit Round' },
  { id: 'cultural_fit_created_at', label: 'Created At', category: 'Cultural Fit Round' },
  { id: 'cultural_fit_updated_at', label: 'Updated At', category: 'Cultural Fit Round' },
  { id: 'cultural_fit_updated_by', label: 'Updated By', category: 'Cultural Fit Round' },

  { id: 'campus', label: 'Campus', category: 'Assigned School and Campus' },

  
  // Final Decision
  { id: 'admission_letter_status', label: 'Admission Letter Status', category: 'Final Decision' },
  { id: 'admission_letter_sent_at', label: 'Admission Letter Sent At', category: 'Final Decision' },
  { id: 'admission_letter_sent_by', label: 'Admission Letter Sent By (Email)', category: 'Final Decision' },
  { id: 'onboarded_status', label: 'Onboarded Status', category: 'Final Decision' },
  { id: 'final_notes', label: 'Final Notes', category: 'Final Decision' },
  { id: 'joining_date', label: 'Joining Date', category: 'Final Decision' },
  { id: 'final_decisions_created_at', label: 'Final Decision Created At', category: 'Final Decision' },
  { id: 'final_decisions_updated_at', label: 'Final Decision Updated At', category: 'Final Decision' },
  { id: 'final_status_updated_by', label: 'Final Status Updated By (Email)', category: 'Final Decision' },
];

// Group fields by category
const getFieldsByCategory = () => {
  const categories = new Map<string, CSVField[]>();
  
  ALL_CSV_FIELDS.forEach(field => {
    if (!categories.has(field.category)) {
      categories.set(field.category, []);
    }
    categories.get(field.category)!.push(field);
  });
  
  return categories;
};

export const CSVExportFieldsModal = ({
  open,
  onClose,
  onExport,
  exportType,
  exportCount,
}: CSVExportFieldsModalProps) => {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  
  const fieldsByCategory = getFieldsByCategory();
  const requiredFields = ALL_CSV_FIELDS.filter(f => f.required).map(f => f.id);

  // Initialize with all fields selected
  useEffect(() => {
    if (open) {
      setSelectedFields(new Set(ALL_CSV_FIELDS.map(f => f.id)));
    }
  }, [open]);

  const handleToggleField = (fieldId: string) => {
    const field = ALL_CSV_FIELDS.find(f => f.id === fieldId);
    if (field?.required) return; // Don't allow toggling required fields
    
    setSelectedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldId)) {
        newSet.delete(fieldId);
      } else {
        newSet.add(fieldId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedFields(new Set(ALL_CSV_FIELDS.map(f => f.id)));
  };

  const handleDeselectAll = () => {
    // Keep only required fields
    setSelectedFields(new Set(requiredFields));
  };

  const handleToggleCategory = (category: string) => {
    const categoryFields = fieldsByCategory.get(category) || [];
    const allSelected = categoryFields.every(f => selectedFields.has(f.id));
    
    setSelectedFields(prev => {
      const newSet = new Set(prev);
      categoryFields.forEach(field => {
        if (field.required) return; // Don't toggle required fields
        
        if (allSelected) {
          newSet.delete(field.id);
        } else {
          newSet.add(field.id);
        }
      });
      return newSet;
    });
  };

  const isCategoryFullySelected = (category: string) => {
    const categoryFields = fieldsByCategory.get(category) || [];
    return categoryFields.every(f => selectedFields.has(f.id));
  };

  const isCategoryPartiallySelected = (category: string) => {
    const categoryFields = fieldsByCategory.get(category) || [];
    const selectedInCategory = categoryFields.filter(f => selectedFields.has(f.id)).length;
    return selectedInCategory > 0 && selectedInCategory < categoryFields.length;
  };

  const handleExport = async () => {
    if (selectedFields.size === 0) {
      return; // Prevent export with no fields
    }

    setIsExporting(true);
    try {
      await onExport(Array.from(selectedFields));
      // Reset state after successful export
      setSelectedFields(new Set(ALL_CSV_FIELDS.map(f => f.id)));
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      // Don't close modal on error so user can retry
    } finally {
      setIsExporting(false);
    }
  };

  const getExportTitle = () => {
    switch (exportType) {
      case 'all':
        return 'Export All Data';
      case 'filtered':
        return `Export Filtered Results (${exportCount || 0})`;
      case 'selected':
        return `Export Selected (${exportCount || 0})`;
      default:
        return 'Export Data';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-0 p-0">
        <div className="p-6 pb-4">
          <DialogHeader>
            <DialogTitle>{getExportTitle()}</DialogTitle>
            <DialogDescription>
              Select the fields you want to include in the CSV export. Required fields cannot be deselected.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={handleSelectAll}
              variant="outline"
              size="sm"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Select All
            </Button>
            <Button
              onClick={handleDeselectAll}
              variant="outline"
              size="sm"
            >
              <Square className="h-4 w-4 mr-2" />
              Deselect All
            </Button>
            <div className="ml-auto text-sm text-muted-foreground">
              {selectedFields.size} of {ALL_CSV_FIELDS.length} fields selected
            </div>
          </div>
        </div>

        <ScrollArea className="h-[50vh] px-6">
          <div className="space-y-6 pb-4">
            {Array.from(fieldsByCategory.entries()).map(([category, fields]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={isCategoryFullySelected(category)}
                    onCheckedChange={() => handleToggleCategory(category)}
                    className={isCategoryPartiallySelected(category) ? "data-[state=checked]:bg-primary/50" : ""}
                  />
                  <Label
                    htmlFor={`category-${category}`}
                    className="text-sm font-semibold cursor-pointer"
                  >
                    {category}
                  </Label>
                </div>
                
                <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {fields.map(field => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={field.id}
                        checked={selectedFields.has(field.id)}
                        onCheckedChange={() => handleToggleField(field.id)}
                        disabled={field.required}
                      />
                      <Label
                        htmlFor={field.id}
                        className={`text-sm cursor-pointer ${field.required ? 'font-medium' : ''}`}
                      >
                        {field.label}
                        {field.required && (
                          <span className="text-xs text-muted-foreground ml-1">(required)</span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || selectedFields.size === 0}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
