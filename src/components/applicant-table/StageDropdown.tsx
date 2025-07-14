
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StageDropdownProps {
  applicant: any;
  onUpdate: () => void;
}

const STAGE_OPTIONS = [
  { value: "sourcing", label: "Sourcing" },
  { value: "screening", label: "Screening" },
  { value: "interviews", label: "Interviews" },
  { value: "decision", label: "Final Decision" },
  { value: "onboarded", label: "Onboarded" }
];

export const StageDropdown = React.memo(({ applicant, onUpdate }: StageDropdownProps) => {
  const { toast } = useToast();

  const handleStageChange = async (value: string) => {
    try {
      const { error } = await supabase
        .from("admission_dashboard")
        .update({ 
          stage: value,
          status: null,
          last_updated: new Date().toISOString()
        })
        .eq("id", applicant.id);

      if (error) throw error;

      toast({
        title: "Stage Updated",
        description: "Successfully updated stage",
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating stage:', error);
      toast({
        title: "Error",
        description: "Failed to update stage",
        variant: "destructive",
      });
    }
  };

  return (
    <Select
      value={applicant.stage || "sourcing"}
      onValueChange={handleStageChange}
    >
      <SelectTrigger className="w-full h-8 text-xs">
        <SelectValue placeholder="Select a stage" />
      </SelectTrigger>
      <SelectContent className="bg-background border border-border shadow-lg z-50">
        {STAGE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

StageDropdown.displayName = "StageDropdown";
