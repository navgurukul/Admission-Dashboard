
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateApplicant } from "@/utils/localStorage";

interface EditableCellProps {
  applicant: any;
  field: string;
  displayValue: any;
  onUpdate: () => void;
  showPencil?: boolean;
}

export const EditableCell = ({ applicant, field, displayValue, onUpdate, showPencil = false }: EditableCellProps) => {
  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [cellValue, setCellValue] = useState("");
  const { toast } = useToast();

  const startCellEdit = (id: string, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    setCellValue(currentValue || "");
  };

  const saveCellEdit = async () => {
    if (!editingCell) return;

    try {
      // Save to localStorage first
      updateApplicant(editingCell.id, { [editingCell.field]: cellValue });

      // Also save to Supabase for persistence
      const { error } = await supabase
        .from("admission_dashboard")
        .update({ 
          [editingCell.field]: cellValue,
          last_updated: new Date().toISOString()
        })
        .eq("id", editingCell.id);

      if (error) {
        console.warn('Supabase update failed, but data saved to localStorage:', error);
      }

      toast({
        title: "Success",
        description: "Field updated and saved to localStorage",
      });

      setEditingCell(null);
      setCellValue("");
      // Immediately update the UI by calling onUpdate
      onUpdate();
    } catch (error) {
      console.error('Error updating field:', error);
      toast({
        title: "Error",
        description: "Failed to update field",
        variant: "destructive",
      });
    }
  };

  const cancelCellEdit = () => {
    setEditingCell(null);
    setCellValue("");
  };

  const isEditing = editingCell?.id === applicant.id && editingCell?.field === field;
  
  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={cellValue}
          onChange={(e) => setCellValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveCellEdit();
            if (e.key === 'Escape') cancelCellEdit();
          }}
          className="h-8 text-xs"
          autoFocus
        />
        <Button size="sm" onClick={saveCellEdit} className="h-6 px-2">
          ✓
        </Button>
        <Button size="sm" variant="outline" onClick={cancelCellEdit} className="h-6 px-2">
          ✕
        </Button>
      </div>
    );
  }

  return (
    <div
      className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[24px] flex items-center gap-2 group"
      onClick={() => startCellEdit(applicant.id, field, displayValue)}
      title="Click to edit"
    >
      <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{displayValue || "Click to add"}</span>
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  );
};
