
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STAGE_DEFAULT_STATUS } from "./StatusDropdown";

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

const StageDropdown = ({ applicant, onUpdate }: StageDropdownProps) => {
  const { toast } = useToast();

  const handleStageChange = async (value: string) => {
    console.log('Changing stage to:', value);
    try {
      const defaultStatus = STAGE_DEFAULT_STATUS[value as keyof typeof STAGE_DEFAULT_STATUS];
      console.log('Setting default status to:', defaultStatus);
      
      const { error } = await supabase
        .from("admission_dashboard")
        .update({ 
          stage: value,
          status: defaultStatus,
          last_updated: new Date().toISOString()
        })
        .eq("id", applicant.id);

      if (error) throw error;

      toast({
        title: "Stage Updated",
        description: "Successfully updated stage and set default status",
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

  const currentStage = applicant.stage || "sourcing";
  console.log('Current stage:', currentStage);

  return (
    <Select
      value={currentStage}
      onValueChange={handleStageChange}
    >
      <SelectTrigger className="w-full h-8 text-xs bg-background border border-border">
        <SelectValue placeholder="Select a stage" />
      </SelectTrigger>
      <SelectContent className="bg-background border border-border shadow-lg z-50">
        {STAGE_OPTIONS.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            className="text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default React.memo(StageDropdown);
