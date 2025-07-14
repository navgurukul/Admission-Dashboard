
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
    "Screening Test Pass",
    "Screening Test Fail",
    "Created Student Without Exam"
  ],
  "interviews": [
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

export const StatusDropdown = ({ applicant, onUpdate }: StatusDropdownProps) => {
  const { toast } = useToast();
  const currentStage = applicant.stage || "sourcing";
  const availableStatuses = STAGE_STATUS_MAP[currentStage as keyof typeof STAGE_STATUS_MAP] || [];

  const handleStatusChange = async (newStatus: string) => {
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

  return (
    <Select value={applicant.status || ""} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-full h-8 text-xs">
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent className="bg-background border border-border shadow-lg z-50">
        {availableStatuses.map((status) => (
          <SelectItem key={status} value={status} className="text-xs">
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
