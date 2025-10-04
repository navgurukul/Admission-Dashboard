import { useEffect, useState } from "react";

export const STAGE_OPTIONS = [
	{ value: "screening", label: "Screening" },
	{ value: "Sourcing", label: "Sourcing" },
];

export const STAGE_STATUS_MAP: Record<string, string[]> = {
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

export const STAGE_DEFAULT_STATUS: Record<string, string> = {
	"Cultural Fit Interview Pass": "Enrollment Key Generated",
	screening: "Screening Test Pass",
};

interface StageDropdownProps {
	row?: { id?: any; stage?: string; status?: string };
	updateRow?: (field: string, value: any) => void;
	disabled?: boolean;
	// showStatus kept for backward compatibility if you ever want both selects in one cell
	showStatus?: boolean;
}

export default function StageDropdown({ row, updateRow, disabled, showStatus }: StageDropdownProps) {
	const [stage, setStage] = useState(row?.stage || "");
	const [status, setStatus] = useState(row?.status || "");

	useEffect(() => {
		setStage(row?.stage || "");
		setStatus(row?.status || "");
	}, [row?.stage, row?.status]);

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
		updateRow?.("stage", newStage);
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

