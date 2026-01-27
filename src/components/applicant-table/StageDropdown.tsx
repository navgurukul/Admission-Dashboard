import { useEffect, useState } from "react";

export const STAGE_OPTIONS = [
  { value: "screening", label: "Screening" },
  //   { value: "sourcing", label: "Sourcing" },
];

export const STAGE_STATUS_MAP: Record<string, string[]> = {
  "": [""],
  screening: [
    "Screening Test Pass",
    "Screening Test Fail",
    "Created Student Without Exam",
  ],
  interview: [
    "Learning Round Pass",
    "Learning Round Fail",
    "Culture Fit Round Pass",
    "Culture Fit Round Fail",
  ],
  "final decision": [
    "Offer Pending",
    "Offer Sent",
    "Offer Accepted",
    "Offer Declined",
    "Waitlisted",
    "Selected but not joined",
  ],
  "onboarded": ["Onboarded"],
};

export const STAGE_DEFAULT_STATUS: Record<string, string> = {
  "": "",
  "sourcing": "Enrollment Key Generated",
  "screening": "Screening Test Pass",
  "final decision": "Final Decision",
  "interview": "Learning Round Pass",
  "onboarded": "Onboarded",
};

interface StageDropdownProps {
  row?: { id?: any; stage_name?: string; status?: string };
  updateRow?: (field: string, value: any) => void;
  disabled?: boolean;
  // showStatus kept for backward compatibility if you ever want both selects in one cell
  showStatus?: boolean;
}

export default function StageDropdown({
  row,
  updateRow,
  disabled,
  showStatus,
}: StageDropdownProps) {
  const [stage, setStage] = useState(row?.stage_name || "");
  const [status, setStatus] = useState(row?.status || "");

  useEffect(() => {
    console.log("row", row);
    setStage(row?.stage_name || "");
    setStatus(row?.status || "");
  }, [row?.stage_name, row?.status]);

  useEffect(() => {
    // if stage becomes empty, reset status
    if (!stage) setStatus("");
  }, [stage]);

  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStage = e.target.value;
    const defaultStatus = STAGE_DEFAULT_STATUS[newStage] || "";
    setStage(newStage);
    setStatus(defaultStatus);

    // Inform parent to update both fields (stage column + status column)
    updateRow?.("stage_name", newStage);
    updateRow?.("status", defaultStatus);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    updateRow?.("status", newStatus);
  };

  const statusOptions = stage ? STAGE_STATUS_MAP[stage] || [] : [];

  return (
    // Render only the Stage select by default so "Stage" and "Status" are separate table columns.
    <div className="flex gap-4 items-center">
      {/* Stage select (single field for the stage column) */}
      <div>
        <select
          value={stage}
          onChange={handleStageChange}
          className="border p-1 rounded bg-white"
          disabled={disabled}
        >
          <option value="">Select Stage</option>
          {STAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Optional small status select only when explicitly requested via prop */}
      {showStatus && (
        <div>
          <select
            value={status}
            onChange={handleStatusChange}
            className="border p-1 rounded bg-white"
            disabled={disabled || !stage}
          >
            <option value="">{disabled ? "—" : "Select Status"}</option>
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
