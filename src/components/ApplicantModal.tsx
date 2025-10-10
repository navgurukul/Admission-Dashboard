import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, MessageSquare, Pencil } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { InlineEditModal } from "./InlineEditModal";
import { ApplicantCommentsModal } from "./ApplicantCommentsModal";
import StageStatusForm from "./applicant-table/StageDropdown";
import StatusDropdown from "./applicant-table/StatusDropdown";
import { Calendar } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EditableCell } from "./applicant-table/EditableCell";
import {
  getAllCasts,
  updateStudent,
  getAllQualification,
  getAllStatuses,
  getAllSchools,
  getCampusesApi,
  getStudentById,
  getAllQuestionSets,
  API_MAP,
  submitFinalDecision,
} from "@/utils/api";
import { states } from "@/utils/mockApi";
import { InlineSubform } from "@/components/Subform";
import { Input } from "@/components/ui/input";
import StageDropdown, {
  STAGE_STATUS_MAP,
} from "./applicant-table/StageDropdown";

interface ApplicantModalProps {
  applicant: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ApplicantModal({
  applicant,
  isOpen,
  onClose,
}: ApplicantModalProps) {
  // All hooks here!
  const [currentApplicant, setCurrentApplicant] = useState(applicant);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [castes, setCastes] = useState<any[]>([]);
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [currentWorks, setCurrentWorks] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [questionSets, setQuestionSets] = useState<any[]>([]);
  const [joiningDate, setJoiningDate] = useState("");
  const [stateOptions, setStateOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const [campus, setCampus] = useState<any[]>([]);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const format = (date: Date, formatStr: string) => {
    if (formatStr === "PPP") {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    if (formatStr === "yyyy-MM-dd") {
      return date.toISOString().split("T")[0];
    }
    return date.toLocaleDateString();
  };

  useEffect(() => {
    if (applicant?.id) {
      setCurrentApplicant(applicant);
    } else {
      // console.error(" Applicant missing ID:", applicant);
    }
  }, [applicant]);

  useEffect(() => {
    if (isOpen && applicant?.id) {
      const fetchStudent = async () => {
        try {
          const response = await getStudentById(applicant.id);
          // API may return the student object directly or { data: student }
          let updated: any = response;
          if (response && typeof response === "object" && "data" in response) {
            updated = (response as any).data;
          }
          if (updated?.id) {
            setCurrentApplicant(updated);
          } else {
            console.error("Invalid response - no ID found:", response);
          }
        } catch (err) {
          console.error("Failed to fetch student data", err);
        }
      };
      fetchStudent();
    }
  }, [isOpen, applicant?.id, refreshKey]);

  useEffect(() => {
    async function fetchDropdowns() {
      try {
        const [
          casteRes,
          qualRes,
          workRes,
          schoolRes,
          campusRes,
          questionSetRes,
        ] = await Promise.all([
          getAllCasts(),
          getAllQualification(),
          getAllStatuses(),
          getAllSchools(),
          getCampusesApi(),
          getAllQuestionSets(),
        ]);

        // Set manual states
        setStateOptions(states);

        // Map API responses
        setCampus(
          (campusRes || []).map((c: any) => ({
            value: c.id.toString(),
            label: c.campus_name,
          }))
        );

        setSchools(
          (schoolRes || []).map((c: any) => ({
            value: c.id.toString(),
            label: c.school_name,
          }))
        );

        setCastes(
          (casteRes || []).map((c: any) => ({
            value: c.id.toString(),
            label: c.cast_name,
          }))
        );

        setQualifications(
          (qualRes || []).map((q: any) => ({
            value: q.id.toString(),
            label: q.qualification_name,
          }))
        );

        setCurrentWorks(
          (workRes || []).map((w: any) => ({
            value: w.id.toString(),
            label: w.current_status_name,
          }))
        );
        setQuestionSets(
          (questionSetRes || []).map((qs: any) => ({
            value: qs.id.toString(),
            label: qs.name,
          }))
        );
      } catch (err) {
        console.error("Failed to load dropdown data", err);
      }
    }

    if (isOpen) fetchDropdowns();
  }, [isOpen]);

  useEffect(() => {
    if (currentApplicant?.joining_date) {
      setJoiningDate(currentApplicant.joining_date.split("T")[0]);
    }
  }, [currentApplicant?.joining_date]);

  const handleFinalDecisionUpdate = async (field: string, value: any) => {
    if (!currentApplicant?.id) return;

    try {
      // Prepare payload with only the updated field
      const payload: Record<string, any> = {
        student_id: currentApplicant.id,
        [field]: value,
      };

      console.log("value", value);
      console.log(1, payload);

      // If the field being updated is joining_date, include joiningDate from state
      if (field === "joining_date") {
        payload.joining_date = value;
      }

      await submitFinalDecision(payload);
      await handleUpdate(); // Refresh UI after update
    } catch (err) {
      console.error("Failed to update final decision", err);
    }
  };

  // Only after all hooks:
  if (!applicant || !currentApplicant) return null;

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleCommentsClick = () => {
    setShowCommentsModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setRefreshKey((prev) => prev + 1);
  };

  // Refetch applicant after update
  const handleUpdate = async () => {
    if (!currentApplicant?.id) return;
    try {
      const response = await getStudentById(currentApplicant.id);

      // Extract actual data from response which may be { data: student } or student
      let updated: any = response;
      if (response && typeof response === "object" && "data" in response) {
        updated = (response as any).data;
      }

      if (updated?.id) {
        setCurrentApplicant(updated);
      } else {
        console.error("Invalid response - no ID found:", response);
      }
    } catch (err) {
      console.error("Failed to refresh applicant", err);
    }
  };

  // Helper function to get label from ID
  const getLabel = (
    options: { value: string; label: string }[],
    id: any,
    defaultLabel = "Not provided"
  ) => {
    return (
      options.find((o) => o.value === id?.toString())?.label || defaultLabel
    );
  };

  const dateOfTest =
    currentApplicant.stage_name === "screening"
      ? currentApplicant.exam_sessions?.[0]?.date_of_test || ""
      : currentApplicant.date_of_test || "";

  // Helper for current exam session (if any) to simplify access throughout the component
  const examSession = currentApplicant.exam_sessions?.[0] ?? null;

  // StatusCell: renders status select for a given row and updates the row via updateRow
  const StatusCell = ({ row, updateRow, disabled }: any) => {
    // Prefer per-row stage_name, fallback to applicant-level stage for context
    const stage_name = row?.stage_name || currentApplicant?.stage_name || "";
    // Get status options for the stage (if any)
    const options = stage_name
      ? STAGE_STATUS_MAP[stage_name] || STAGE_STATUS_MAP.screening
      : [];
    const value = row?.status ?? "";

    // Disable when no stage selected
    const isDisabled = !!disabled || !stage_name;

    // If there is an existing value that's not in the options, include it so the select shows the current value
    const extraValues =
      value && value !== "" && !options.includes(value) ? [value] : [];
    const allOptions = [...options, ...extraValues];

    return (
      <select
        value={value || ""}
        onChange={(e) => updateRow?.("status", e.target.value)}
        className="border p-1 rounded bg-white w-full"
        disabled={isDisabled}
      >
        <option value="">
          {isDisabled ? "Select stage first" : "Select Status"}
        </option>
        {allOptions.map((opt: string) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  };

  // Screening fields with correct components
  const screeningFields = [
    {
      name: "stage_name",
      label: "Stage  *",
      type: "component",
      component: (props: any) => <StageDropdown {...props} />,
    },
    {
      name: "status",
      label: "Status *",
      type: "component",
      component: (props: any) => <StatusCell {...props} />,
    },
    {
      name: "question_set_id",
      label: "Set Name *",
      type: "select",
      options: questionSets,
    },
    {
      name: "obtained_marks",
      label: "Obtained Marks *",
      type: "readonly",
    },
    {
      name: "is_passed",
      label: "Is Passed *",
      type: "select",
      options: [
        { value: "1", label: "Yes" },
        { value: "0", label: "No" },
      ],
    },
    {
      name: "school_id",
      label: "Qualifying School *",
      type: "select",
      options: schools,
    },
    {
      name: "exam_centre",
      label: "Exam Centre *",
      type: "readonly",
    },
    {
      name: "date_of_test",
      label: "Date of Testing *",
      type: "component",
      component: ({ row, updateRow, disabled }: any) => {
        // Subform will show this component only when the field is editable for the row.
        // Render a native date input that updates the row value (in yyyy-MM-dd).
        return (
          <input
            type="date"
            value={row?.date_of_test || ""}
            onChange={(e) => updateRow?.("date_of_test", e.target.value)}
            className="border p-1 rounded w-full"
            disabled={!!disabled}
          />
        );
      },
    },
  ];

  // Map the current applicant's data to the subform rows
  const initialScreeningData =
    currentApplicant.exam_sessions?.map((session) => ({
      id: session.id,
      // prefer session-level status; fallback to applicant-level
      stage_name: session.stage_name ?? currentApplicant.stage_name ?? "",
      status: session.status ?? currentApplicant.status ?? "",
      question_set_id: session.question_set_id?.toString() || "",
      obtained_marks:
        session.obtained_marks !== null && session.obtained_marks !== undefined
          ? session.obtained_marks.toString()
          : "",
      school_id:
        session.school_id !== null && session.school_id !== undefined
          ? session.school_id.toString()
          : "",
      is_passed: session.is_passed ? "1" : "0",
      // school_id: currentApplicant.school_id || "",
      exam_centre: session.exam_centre || "",
      date_of_test: session.date_of_test?.split("T")[0] || "",
    })) || [];

  if (!applicant) return null;

  // Safe wrappers for screening API (prevent reading .submit of undefined)
  const screeningSubmit =
    API_MAP?.screening?.submit ??
    (async (payload: any) => {
      console.error("API_MAP.screening.submit is not available", payload);
      throw new Error("screening submit API not available");
    });

  const screeningUpdate =
    API_MAP?.screening?.update ??
    (async (id: any, payload: any) => {
      console.error("API_MAP.screening.update is not available", id, payload);
      throw new Error("screening update API not available");
    });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Applicant Details</DialogTitle>
            <div className="flex items-center gap-2">
              {/* <Button
                variant="outline"
                size="sm"
                onClick={handleCommentsClick}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Comments
              </Button> */}
              {/* <Button
                variant="outline"
                size="sm"
                onClick={handleEditClick}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Details
              </Button> */}
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    First Name
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="first_name"
                    displayValue={
                      currentApplicant?.first_name || "Not provided"
                    }
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Middle Name
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="middle_name"
                    displayValue={
                      currentApplicant?.middle_name || "Not provided"
                    }
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Name
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="last_name"
                    displayValue={currentApplicant?.last_name || "Not provided"}
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Mobile Number
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="phone_number"
                    displayValue={currentApplicant.phone_number}
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    WhatsApp Number
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="whatsapp_number"
                    displayValue={
                      currentApplicant.whatsapp_number || "Not provided"
                    }
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Gender
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="gender"
                    displayValue={currentApplicant.gender || "Not provided"}
                    options={[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                      { value: "other", label: "Other" },
                    ]}
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Caste
                  </label>
                  {/* Caste Dropdown */}
                  <EditableCell
                    applicant={currentApplicant}
                    field="cast_id"
                    value={currentApplicant.cast_id}
                    displayValue={getLabel(castes, currentApplicant.cast_id)}
                    onUpdate={handleUpdate}
                    options={castes} // now as dropdown
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Qualification
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="qualification_id"
                    value={currentApplicant.qualification_id}
                    displayValue={getLabel(
                      qualifications,
                      currentApplicant.qualification_id
                    )}
                    onUpdate={handleUpdate}
                    options={qualifications}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Current Work
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="current_status_id"
                    displayValue={
                      currentWorks.find(
                        (w) =>
                          w.value ===
                          currentApplicant.current_status_id?.toString()
                      )?.label || "Not provided"
                    }
                    onUpdate={handleUpdate}
                    options={currentWorks}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    States
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="state"
                    displayValue={currentApplicant.state || "Not provided"}
                    onUpdate={handleUpdate}
                    options={stateOptions}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    City
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="city"
                    displayValue={currentApplicant.city || "Not provided"}
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    District
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="district"
                    displayValue={currentApplicant.district || "Not provided"}
                    onUpdate={handleUpdate}
                  />
                </div>
              </div>
            </div>

            <InlineSubform
              title="Screening Round"
              studentId={currentApplicant.id}
              initialData={initialScreeningData}
              fields={screeningFields}
              submitApi={screeningSubmit}
              updateApi={screeningUpdate}
              onSave={handleUpdate}
            />

            {/* --- LEARNING & CULTURAL FIT ROUNDS --- */}
            <div className="grid grid-cols-1 gap-6">
              <div className="col-span-full w-full">
                <InlineSubform
                  title="Learning Round"
                  studentId={currentApplicant.id}
                  initialData={currentApplicant.interview_learner_round || []}
                  fields={[
                    {
                      name: "learning_round_status",
                      label: "Status *",
                      type: "select",
                      options: [
                        {
                          value: "Learner Round Pass",
                          label: "Learner Round Pass",
                        },
                        {
                          value: "Learner Round Fail",
                          label: "Learner Round Fail",
                        },
                        { value: "Reschedule", label: "Reschedule" },
                        { value: "No Show", label: "No Show" },
                      ],
                    },
                    { name: "comments", label: "Comments *", type: "text" },
                  ]}
                  submitApi={API_MAP.learning.submit}
                  updateApi={API_MAP.learning.update}
                  onSave={handleUpdate}
                />
              </div>
              <div className="col-span-full w-full">
                <InlineSubform
                  title="Cultural Fit Round"
                  studentId={currentApplicant.id}
                  initialData={
                    currentApplicant.interview_cultural_fit_round || []
                  }
                  fields={[
                    {
                      name: "cultural_fit_status",
                      label: "Status *",
                      type: "select",
                      options: [
                        {
                          value: "Cultural Fit Interview Pass",
                          label: "Cultural Fit Interview Pass",
                        },
                        {
                          value: "Cultural Fit Interview Fail",
                          label: "Cultural Fit Interview Fail",
                        },
                        { value: "Reschedule", label: "Reschedule" },
                        { value: "No Show", label: "No Show" },
                      ],
                    },
                    { name: "comments", label: "Comments *", type: "text" },
                  ]}
                  submitApi={API_MAP.cultural.submit}
                  updateApi={API_MAP.cultural.update}
                  onSave={handleUpdate}
                />
              </div>

              {/* Offer and Final Status */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold">Offer & Final Status</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Campus
                    </label>
                    <EditableCell
                      applicant={currentApplicant}
                      field="campus_id"
                      displayValue={getLabel(
                        campus,
                        currentApplicant.campus_id
                      )}
                      onUpdate={handleUpdate}
                      options={campus}
                    />
                  </div>
                  {/* Offer Letter Status */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Offer Letter Status
                    </label>
                    <EditableCell
                      applicant={currentApplicant}
                      field="offer_letter_status"
                      value={
                        currentApplicant.final_decisions?.[0]
                          ?.offer_letter_status
                      }
                      displayValue={
                        currentApplicant.final_decisions?.[0]
                          ?.offer_letter_status || "Not provided"
                      }
                      options={[
                        { value: "Offer Pending", label: "Offer Pending" },
                        { value: "Offer Sent", label: "Offer Sent" },
                        { value: "Offer Accepted", label: "Offer Accepted" },
                        { value: "Offer Declined", label: "Offer Declined" },
                        { value: "Waitlisted", label: "Waitlisted" },
                        {
                          value: "Selected but not joined",
                          label: "Selected but not joined",
                        },
                      ]}
                      onUpdate={async (value) => {
                        await handleFinalDecisionUpdate(
                          "offer_letter_status",
                          value
                        );
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Onboarded Status
                    </label>
                    <EditableCell
                      applicant={currentApplicant}
                      field="onboarded_status"
                      value={
                        currentApplicant.final_decisions?.[0]?.onboarded_status
                      }
                      displayValue={
                        currentApplicant.final_decisions?.[0]
                          ?.onboarded_status || "Not provided"
                      }
                      options={[{ value: "Onboarded", label: "Onboarded" }]}
                      onUpdate={async (value) => {
                        await handleFinalDecisionUpdate(
                          "onboarded_status",
                          value
                        );
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    className="border rounded px-2 py-1 w-full"
                    // Always show clean date in yyyy-MM-dd format
                    value={
                      joiningDate ||
                      currentApplicant.final_decisions?.[0]?.joining_date?.split(
                        "T"
                      )[0] ||
                      ""
                    }
                    onChange={(e) => setJoiningDate(e.target.value)}
                    onBlur={async () => {
                      if (joiningDate) {
                        await handleFinalDecisionUpdate(
                          "joining_date",
                          joiningDate
                        );
                      }
                    }}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold">Notes</h3>
                <div className="grid grid-cols-2 gap-4">
                  <EditableCell
                    applicant={currentApplicant}
                    field="final_notes"
                    value={
                      currentApplicant.final_decisions?.[0]?.final_notes || ""
                    }
                    displayValue={
                      currentApplicant.final_decisions?.[0]?.final_notes ||
                      "No final notes"
                    }
                    renderInput={({ value, onChange }) => (
                      <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        rows={4}
                        className="border rounded px-2 py-1 w-full resize-none"
                        placeholder="Enter final notes here..."
                      />
                    )}
                    onUpdate={async (value) => {
                      if (!currentApplicant?.final_decisions?.[0]) return;
                      await handleFinalDecisionUpdate("final_notes", value);
                    }}
                  />
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold">Timestamps</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Created At
                    </label>
                    <p className="text-sm">
                      {currentApplicant.created_at
                        ? new Date(currentApplicant.created_at).toLocaleString()
                        : "Not available"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Last updated At
                    </label>
                    <p className="text-sm">
                      {currentApplicant.updated_at
                        ? new Date(currentApplicant.updated_at).toLocaleString()
                        : "Not available"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showEditModal && (
        <InlineEditModal
          applicant={currentApplicant}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {showCommentsModal && (
        <ApplicantCommentsModal
          applicantId={currentApplicant.id || ""}
          applicantName={currentApplicant.name || ""}
          isOpen={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
        />
      )}
    </>
  );
}
