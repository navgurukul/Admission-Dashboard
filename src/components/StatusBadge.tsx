import { cn } from "@/lib/utils";

type StatusType = 
  | 'enrollment-key-generated'
  | 'basic-details-entered' 
  | 'unreachable'
  | 'became-disinterested'
  | 'screening-test-pass'
  | 'screening-test-fail'
  | 'created-without-exam'
  | 'learner-round-pass'
  | 'learner-round-fail'
  | 'cultural-fit-pass'
  | 'cultural-fit-fail'
  | 'no-show'
  | 'offer-pending'
  | 'offer-sent'
  | 'offer-accepted'
  | 'offer-declined'
  | 'waitlisted'
  | 'onboarded'
  | 'selected-not-joined';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  'enrollment-key-generated': { 
    label: 'Enrollment Key Generated', 
    className: 'bg-status-prospect/10 text-status-prospect border-status-prospect/20' 
  },
  'basic-details-entered': { 
    label: 'Basic Details Entered', 
    className: 'bg-status-pending/10 text-status-pending border-status-pending/20' 
  },
  'unreachable': { 
    label: 'Unreachable', 
    className: 'bg-status-inactive/10 text-status-inactive border-status-inactive/20' 
  },
  'became-disinterested': { 
    label: 'Became Disinterested', 
    className: 'bg-status-fail/10 text-status-fail border-status-fail/20' 
  },
  'screening-test-pass': { 
    label: 'Screening Test Pass', 
    className: 'bg-status-active/10 text-status-active border-status-active/20' 
  },
  'screening-test-fail': { 
    label: 'Screening Test Fail', 
    className: 'bg-status-fail/10 text-status-fail border-status-fail/20' 
  },
  'created-without-exam': { 
    label: 'Created Without Exam', 
    className: 'bg-status-pending/10 text-status-pending border-status-pending/20' 
  },
  'learner-round-pass': { 
    label: 'Learner Round Pass', 
    className: 'bg-status-active/10 text-status-active border-status-active/20' 
  },
  'learner-round-fail': { 
    label: 'Learner Round Fail', 
    className: 'bg-status-fail/10 text-status-fail border-status-fail/20' 
  },
  'cultural-fit-pass': { 
    label: 'Cultural Fit Pass', 
    className: 'bg-status-active/10 text-status-active border-status-active/20' 
  },
  'cultural-fit-fail': { 
    label: 'Cultural Fit Fail', 
    className: 'bg-status-fail/10 text-status-fail border-status-fail/20' 
  },
  'no-show': { 
    label: 'No Show', 
    className: 'bg-status-inactive/10 text-status-inactive border-status-inactive/20' 
  },
  'offer-pending': { 
    label: 'Offer Pending', 
    className: 'bg-status-pending/10 text-status-pending border-status-pending/20' 
  },
  'offer-sent': { 
    label: 'Offer Sent', 
    className: 'bg-status-prospect/10 text-status-prospect border-status-prospect/20' 
  },
  'offer-accepted': { 
    label: 'Offer Accepted', 
    className: 'bg-status-active/10 text-status-active border-status-active/20' 
  },
  'offer-declined': { 
    label: 'Offer Declined', 
    className: 'bg-status-fail/10 text-status-fail border-status-fail/20' 
  },
  'waitlisted': { 
    label: 'Waitlisted', 
    className: 'bg-status-pending/10 text-status-pending border-status-pending/20' 
  },
  'onboarded': { 
    label: 'Onboarded', 
    className: 'bg-status-active/10 text-status-active border-status-active/20' 
  },
  'selected-not-joined': { 
    label: 'Selected but not joined', 
    className: 'bg-status-inactive/10 text-status-inactive border-status-inactive/20' 
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 text-xs font-medium border rounded-full",
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}