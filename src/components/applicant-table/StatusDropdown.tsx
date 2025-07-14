
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

  // Comprehensive status mapping from database to display values
  const normalizeStatus = (status: string) => {
    if (!status) {
      console.log('No status found, returning empty string');
      return "";
    }
    
    console.log('Raw status from database:', status);
    
    // Direct mapping for exact matches first
    const exactMatches: { [key: string]: string } = {
      // Decision stage statuses
      "offer_pending": "Offer Pending",
      "offer_sent": "Offer Sent", 
      "offer_accepted": "Offer Accepted",
      "offer_declined": "Offer Declined",
      
      // Interview stage statuses
      "lr_qualified": "Learner Round Pass",
      "lr_failed": "Learner Round Fail",
      "cfr_qualified": "Cultural Fit Interview Pass", 
      "cfr_failed": "Cultural Fit Interview Fail",
      "pending_booking": "Pending Booking",
      
      // Screening stage statuses
      "pass": "Screening Test Pass",
      "fail": "Screening Test Fail",
      "pending": "Pending",
      
      // Sourcing stage statuses
      "enrollment_key_generated": "Enrollment Key Generated",
      "basic_details_entered": "Basic Details Entered",
      "duplicate": "Duplicate",
      "unreachable": "Unreachable", 
      "became_disinterested": "Became Disinterested",
      
      // Onboarded
      "onboarded": "Onboarded"
    };
    
    // Check exact match first
    const lowerStatus = status.toLowerCase().trim();
    if (exactMatches[lowerStatus]) {
      console.log('Found exact match:', exactMatches[lowerStatus]);
      return exactMatches[lowerStatus];
    }
    
    // If no exact match, check if the status is already in display format
    const allDisplayStatuses = Object.values(STAGE_STATUS_MAP).flat();
    if (allDisplayStatuses.includes(status)) {
      console.log('Status already in display format:', status);
      return status;
    }
    
    // Fallback: return the original status
    console.log('No mapping found, returning original:', status);
    return status;
  };

  // Get the current stage and provide default if no status
  const currentStage = applicant.stage || "sourcing";
  const rawStatus = applicant.status;
  const normalizedStatus = normalizeStatus(rawStatus || "");
  
  // If no status exists, use the default for the current stage
  const displayStatus = normalizedStatus || STAGE_DEFAULT_STATUS[currentStage as keyof typeof STAGE_DEFAULT_STATUS] || "";
  
  console.log('=== STATUS DROPDOWN DEBUG ===');
  console.log('Applicant ID:', applicant.id);
  console.log('Current stage:', currentStage);
  console.log('Raw status from DB:', rawStatus);
  console.log('Normalized status:', normalizedStatus);
  console.log('Final display status:', displayStatus);
  console.log('Available statuses for stage:', availableStatuses);
  console.log('===============================');

  return (
    <Select value={displayStatus} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-full h-8 text-xs bg-white border border-gray-300 hover:bg-gray-50">
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent className="bg-white border border-gray-300 shadow-lg z-[9999] max-h-[200px] overflow-y-auto">
        {availableStatuses.map((status) => (
          <SelectItem 
            key={status} 
            value={status} 
            className="text-xs cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
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
