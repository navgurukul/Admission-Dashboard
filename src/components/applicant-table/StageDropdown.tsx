import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { updateStudent } from "@/utils/api";
import { STAGE_DEFAULT_STATUS } from "./StatusDropdown";

interface StageDropdownProps {
  applicantId: string | number;
  applicant: any;
  onUpdate: () => void;
}

const STAGE_OPTIONS = [
  {
    value: "Cultural Fit Interview Pass",
    label: "Cultural Fit Interview Pass",
  },
  { value: "screening", label: "Screening" },
];

const StageDropdown = ({ applicant, onUpdate }: StageDropdownProps) => {
  const { toast } = useToast();

  const handleStageChange = async (value: string) => {
    if (!applicant?.id) return;
    try {
      const defaultStatus =
        STAGE_DEFAULT_STATUS[value as keyof typeof STAGE_DEFAULT_STATUS];

      // Update via API
      await updateStudent(applicant.id, {
        stage: value,
        status: defaultStatus,
      });

      toast({
        title: "Stage Updated",
        description: `Stage changed to ${value}`,
      });

      // Refresh UI
      onUpdate();
    } catch (error) {
      console.error("Error updating stage:", error);
      toast({
        title: "Error",
        description: "Failed to update stage",
        variant: "destructive",
      });
    }
  };

  const currentStage = applicant.stage || "screening";

  return (
    <Select value={currentStage} onValueChange={handleStageChange}>
      <SelectTrigger className="w-full h-8 text-xs bg-white border border-gray-300">
        <SelectValue placeholder="Select a stage" />
      </SelectTrigger>
      <SelectContent className="bg-white border border-gray-300 shadow-lg z-50">
        {STAGE_OPTIONS.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="text-xs cursor-pointer hover:bg-gray-100"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default React.memo(StageDropdown);
