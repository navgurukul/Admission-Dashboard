
import { cn } from "@/lib/utils";

type StatusType = string;

interface StatusBadgeProps {
  status: StatusType;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyle = (status: StatusType) => {
    // Success/Pass statuses
    if (status?.includes('Pass') || 
        status === 'Offer Accepted' || 
        status === 'Onboarded' ||
        status === 'Created Student Without Exam') {
      return "bg-green-500/10 text-green-700 border-green-500/20";
    }
    
    // Fail/Decline statuses
    if (status?.includes('Fail') || 
        status === 'Offer Declined' || 
        status === 'Duplicate' ||
        status === 'Unreachable' ||
        status === 'Became Disinterested' ||
        status === 'No Show' ||
        status === 'Selected but not joined') {
      return "bg-red-500/10 text-red-700 border-red-500/20";
    }
    
    // Pending/In-progress statuses
    if (status?.includes('Pending') || 
        status === 'Offer Sent' ||
        status === 'Reschedule' ||
        status === 'Waitlisted' ||
        status === 'Enrollment Key Generated' ||
        status === 'Basic Details Entered') {
      return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
    }
    
    // Default
    return "bg-gray-500/10 text-gray-700 border-gray-500/20";
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        getStatusStyle(status)
      )}
    >
      {status || "No Status"}
    </span>
  );
}
