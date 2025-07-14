
import React, { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StatusDropdownProps {
  applicant: any;
  onUpdate: () => void;
}

const STAGE_STATUS_MAP = {
  "sourcing": [
    "Enrollment Key Generated",
    "Basic Details Entered", 
    "Duplicate",
    "Unreachable",
    "Became Disinterested"
  ],
  "screening": [
    "Pending",
    "Screening Test Pass",
    "Screening Test Fail",
    "Created Student Without Exam"
  ],
  "interviews": [
    "Pending Booking",
    "Learner Round Pass",
    "Learner Round Fail", 
    "Cultural Fit Interview Pass",
    "Cultural Fit Interview Fail",
    "Reschedule",
    "No Show"
  ],
  "decision": [
    "Offer Pending",
    "Offer Sent",
    "Offer Accepted", 
    "Offer Declined",
    "Waitlisted",
    "Selected but not joined"
  ],
  "onboarded": [
    "Onboarded"
  ]
};

const STAGE_DEFAULT_STATUS = {
  "sourcing": "Enrollment Key Generated",
  "screening": "Pending",
  "interviews": "Pending Booking",
  "decision": "Offer Pending",
  "onboarded": "Onboarded"
};

const StatusDropdown = ({ applicant, onUpdate }: StatusDropdownProps) => {
  const { toast } = useToast();
  
  const availableStatuses = useMemo(() => {
    const currentStage = applicant.stage || "sourcing";
    console.log('Current stage:', currentStage);
    console.log('Available statuses:', STAGE_STATUS_MAP[currentStage as keyof typeof STAGE_STATUS_MAP]);
    return STAGE_STATUS_MAP[currentStage as keyof typeof STAGE_STATUS_MAP] || STAGE_STATUS_MAP.sourcing;
  }, [applicant.stage]);

  const handleStatusChange = async (newStatus: string) => {
    console.log('Changing status to:', newStatus);
    try {
      const { error } = await supabase
        .from("admission_dashboard")
        .update({ 
          status: newStatus,
          last_updated: new Date().toISOString()
        })
        .eq("id", applicant.id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: "Successfully updated status",
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const currentStatus = applicant.status || "";
  console.log('Current status:', currentStatus);
  console.log('Current applicant:', applicant);

  return (
    <Select value={currentStatus} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-full h-8 text-xs bg-background border border-border">
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent className="bg-background border border-border shadow-lg z-50 max-h-[200px] overflow-y-auto">
        {availableStatuses.map((status) => (
          <SelectItem 
            key={status} 
            value={status} 
            className="text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground"
          >
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default React.memo(StatusDropdown);
export { STAGE_DEFAULT_STATUS };
