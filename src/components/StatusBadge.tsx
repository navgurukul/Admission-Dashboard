
import { cn } from "@/lib/utils";

type StatusType = 
  | "pending" 
  | "active" 
  | "inactive" 
  | "qualified" 
  | "disqualified"
  | "pass"
  | "fail"
  | "booked"
  | "rescheduled"
  | "lr_qualified"
  | "lr_failed"
  | "cfr_qualified"
  | "cfr_failed"
  | "offer_pending"
  | "offer_sent"
  | "offer_rejected"
  | "offer_accepted"
  | "Qualified for SOP"
  | "Qualified for SOB"
  | "Contact"
  | "Screening - Pending"
  | "Screening - Pass"
  | "Screening - Fail"
  | "Interviews - Pending"
  | "Interviews - Booked"
  | "Interviews - Rescheduled"
  | "Interviews - LR Qualified"
  | "Interviews - LR Failed"
  | "Interviews - CFR Qualified"
  | "Interviews - CFR Failed"
  | "Interviews - Offer Pending"
  | "Decision - Offer Pending"
  | "Decision - Offer Sent"
  | "Decision - Offer Rejected"
  | "Decision - Offer Accepted"
  | "Screening - Qualified for SOP"
  | "Screening - Qualified for SOB";

interface StatusBadgeProps {
  status: StatusType;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyle = (status: StatusType) => {
    // Handle combined stage-status displays
    if (status.includes("Pass") || status.includes("Qualified") || status.includes("Accepted")) {
      return "bg-green-500/10 text-green-700 border-green-500/20";
    }
    
    if (status.includes("Fail") || status.includes("Rejected")) {
      return "bg-red-500/10 text-red-700 border-red-500/20";
    }
    
    if (status.includes("Pending") || status.includes("Booked") || status.includes("Sent") || status.includes("Rescheduled")) {
      return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
    }
    
    if (status === "Contact") {
      return "bg-blue-500/10 text-blue-700 border-blue-500/20";
    }

    // Original status handling
    switch (status) {
      case "pass":
      case "qualified":
      case "active":
      case "lr_qualified":
      case "cfr_qualified":
      case "offer_accepted":
      case "Qualified for SOP":
      case "Qualified for SOB":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      
      case "fail":
      case "disqualified":
      case "inactive":
      case "lr_failed":
      case "cfr_failed":
      case "offer_rejected":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      
      case "pending":
      case "booked":
      case "rescheduled":
      case "offer_pending":
      case "offer_sent":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const getStatusText = (status: StatusType) => {
    // Handle combined stage-status displays - return as is
    if (status.includes(" - ") || status === "Contact") {
      return status;
    }

    // Original status text handling
    switch (status) {
      case "lr_qualified":
        return "LR Qualified";
      case "lr_failed":
        return "LR Failed";
      case "cfr_qualified":
        return "CFR Qualified";
      case "cfr_failed":
        return "CFR Failed";
      case "offer_pending":
        return "Offer Pending";
      case "offer_sent":
        return "Offer Sent";
      case "offer_rejected":
        return "Offer Rejected";
      case "offer_accepted":
        return "Offer Accepted";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        getStatusStyle(status)
      )}
    >
      {getStatusText(status)}
    </span>
  );
}
