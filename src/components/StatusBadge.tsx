import { cn } from "@/lib/utils";

type StatusType = string;

interface StatusBadgeProps {
  status: StatusType;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyle = (status: StatusType) => {
    const normalizedStatus = String(status || "").trim().toLowerCase();

    // Specific distinct colors
    switch (normalizedStatus) {
      case "scheduled":
        return "bg-sky-500/10 text-sky-700 border-sky-500/20";
      case "reschedule":
      case "rescheduled":
        return "bg-amber-500/10 text-amber-700 border-amber-500/20";
      // case "active":
      //   return "bg-indigo-500/10 text-indigo-700 border-indigo-500/20";
      case "passed":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "failed":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      case "booked":
        return "bg-teal-500/10 text-teal-700 border-teal-500/20";
      case "available":
        return "bg-cyan-500/10 text-cyan-700 border-cyan-500/20";
      case "expired":
        return "bg-slate-500/10 text-slate-700 border-slate-500/20";
      case "no show":
        return "bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-500/20";
      case "cancelled":
      case "canceled":
        return "bg-orange-500/10 text-orange-700 border-orange-500/20";
    }

    // Success/Pass fallbacks
    if (
      status?.includes("Pass") ||
      status === "Offer Accepted" ||
      status === "Onboarded" ||
      status === "Created Student Without Exam"
    ) {
      return "bg-green-500/10 text-green-700 border-green-500/20";
    }

    // Fail/Decline statuses
    if (
      status?.includes("Fail") ||
      status === "Offer Declined" ||
      status === "Duplicate" ||
      status === "Unreachable" ||
      status === "Became Disinterested" ||
      // status === "No Show" ||
      status === "Selected but not joined"
    ) {
      return "bg-red-500/10 text-red-700 border-red-500/20";
    }

    // Pending/In-progress statuses
    if (
      status?.includes("Pending") ||
      status === "Offer Sent" ||
      // status === "Reschedule" ||
      status === "Waitlisted" ||
      status === "Enrollment Key Generated" ||
      status === "Basic Details Entered" ||
      status === "Pending Booking"
    ) {
      return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
    }

    // Default
    return "bg-gray-500/10 text-gray-700 border-gray-500/20";
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        getStatusStyle(status),
      )}
    >
      {status || "No Status"}
    </span>
  );
}
