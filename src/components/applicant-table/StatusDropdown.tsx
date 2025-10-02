import React, { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { updateStudent } from "@/utils/api";

interface StatusDropdownProps {
  applicantId: string | number;
  applicant: any;
  onUpdate: () => void;
}

const STAGE_STATUS_MAP = {
  "Cultural Fit Interview Pass": [
    "Enrollment Key Generated",
    "Basic Details Entered",
    "Duplicate",
    "Unreachable",
    "Became Disinterested",
  ],
  screening: [
    "Screening Test Pass",
    "Screening Test Fail",
    "Created Student Without Exam",
  ],
};

export const STAGE_DEFAULT_STATUS = {
  "Cultural Fit Interview Pass": "Enrollment Key Generated",
  screening: "Screening Test Pass",
};

const StatusDropdown = ({ applicant, onUpdate }: StatusDropdownProps) => {
  const { toast } = useToast();

  const currentStage = applicant.stage || "screening";

  const availableStatuses = useMemo(() => {
    return (
      STAGE_STATUS_MAP[currentStage as keyof typeof STAGE_STATUS_MAP] ||
      STAGE_STATUS_MAP.screening
    );
  }, [currentStage]);

  const handleStatusChange = async (newStatus: string) => {
    if (!applicant?.id) return;
    try {
      await updateStudent(applicant.id, {
        status: newStatus,
      });

      toast({
        title: "Status Updated",
        description: `Status changed to ${newStatus}`,
      });

      onUpdate();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  // Default status agar current status empty hai
  const currentStatus =
    applicant.status ||
    STAGE_DEFAULT_STATUS[currentStage as keyof typeof STAGE_DEFAULT_STATUS] ||
    "";

  // Current status ko list me add karo agar available nahi hai
  const finalAvailableStatuses = [...availableStatuses];
  if (currentStatus && !availableStatuses.includes(currentStatus)) {
    finalAvailableStatuses.unshift(currentStatus + " (Current)");
  }

  return (
    <Select value={currentStatus} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-full h-8 text-xs bg-white border border-gray-300 hover:bg-gray-50">
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent className="bg-white border border-gray-300 shadow-lg z-[9999] max-h-[200px] overflow-y-auto">
        {finalAvailableStatuses.map((status) => {
          const cleanStatus = status.replace(" (Current)", "");
          const isCurrent = status.includes("(Current)");
          return (
            <SelectItem
              key={status}
              value={cleanStatus}
              className={`text-xs cursor-pointer hover:bg-gray-100 focus:bg-gray-100 ${
                isCurrent ? "bg-blue-50 text-blue-700" : ""
              }`}
            >
              {status}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default React.memo(StatusDropdown);
