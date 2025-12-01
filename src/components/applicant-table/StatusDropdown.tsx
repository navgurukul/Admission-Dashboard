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
  applicant?: any; // make optional
  onUpdate: () => void;
}

export const STAGE_STATUS_MAP = {
  Sourcing: [
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
  const currentStage = applicant?.stage || "screening";

  const currentStatus = useMemo(() => {
    if (!applicant) return "";
    if (currentStage === "screening" && applicant.exam_sessions?.[0]) {
      return (
        applicant.exam_sessions[0].status || STAGE_DEFAULT_STATUS["screening"]
      );
    }
    return (
      applicant.status ||
      STAGE_DEFAULT_STATUS[currentStage as keyof typeof STAGE_DEFAULT_STATUS]
    );
  }, [applicant, currentStage]);

  const availableStatuses = useMemo(() => {
    return (
      STAGE_STATUS_MAP[currentStage as keyof typeof STAGE_STATUS_MAP] || []
    );
  }, [currentStage]);

  // Guard: if applicant not ready, render nothing
  if (!applicant) {
    return (
      <Select disabled>
        <SelectTrigger className="w-full h-8 text-xs bg-gray-100 border border-gray-300">
          <SelectValue placeholder="Loading status..." />
        </SelectTrigger>
      </Select>
    );
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      if (currentStage === "screening" && applicant.exam_sessions?.[0]) {
        await updateStudent(applicant.id, {
          exam_sessions: [
            {
              ...applicant.exam_sessions[0],
              status: newStatus,
            },
          ],
        });
      } else {
        await updateStudent(applicant.id, { status: newStatus });
      }

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

  return (
    <Select value={currentStatus} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-full h-8 text-xs bg-white border border-gray-300">
        <SelectValue placeholder="Select status" />
        {/* {currentStatus || "Select status"} */}
      </SelectTrigger>
      <SelectContent>
        {availableStatuses.map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default React.memo(StatusDropdown);
