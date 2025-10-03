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
import StageDropdown from "./applicant-table/StageDropdown";
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
} from "@/utils/api";
import { states } from "@/utils/mockApi";
import { InlineSubform } from "@/components/Subform";
import { Input } from "@/components/ui/input";
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
  const [currentApplicant, setCurrentApplicant] = useState(applicant);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [castes, setCastes] = useState<any[]>([]);
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [currentWorks, setCurrentWorks] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [questionSets, setQuestionSets] = useState<any[]>([]);
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

      //  Extract actual data from response
      const updated = response?.data || response;

      if (updated?.id) {
        setCurrentApplicant(updated);
      } else {
        console.error("Invalid response - no ID found:", response);
      }
    } catch (err) {
      console.error("Failed to refresh applicant", err);
    }
  };


  const dateOfTest =
  currentApplicant.stage === "screening"
    ? currentApplicant.exam_sessions?.[0]?.date_of_test || ""
    : currentApplicant.date_of_test || "";


  if (!applicant) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Applicant Details</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCommentsClick}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Comments
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditClick}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Details
              </Button>
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
                      { value: "Male", label: "Male" },
                      { value: "Female", label: "Female" },
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
                    displayValue={
                      castes.find(
                        (c) => c.value === currentApplicant.cast_id?.toString()
                      )?.label || "Not provided"
                    }
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
                    displayValue={
                      qualifications.find(
                        (q) =>
                          q.value ===
                          currentApplicant.qualification_id?.toString()
                      )?.label || "Not provided"
                    }
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
                    field="current_status_name"
                    displayValue={
                      currentWorks.find(
                        (w) =>
                          w.value ===
                          currentApplicant.current_status_name?.toString()
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

            {/* Screening Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Screening Status</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Stage
                  </label>
                  <StageDropdown
                    applicantId={currentApplicant.id}
                    applicant={currentApplicant}
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <StatusDropdown
                    applicantId={currentApplicant.id}
                    applicant={currentApplicant}
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Set Name
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="question_set_id"
                    value={currentApplicant.question_set_id}
                    displayValue={
                      questionSets.find(
                        (qs) =>
                          qs.value ===
                          currentApplicant.question_set_id?.toString()
                      )?.label || "Not provided"
                    }
                    onUpdate={handleUpdate}
                    options={questionSets}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Obtained Marks
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="obtained_marks"
                    value={Number(currentApplicant.obtained_marks) || 0}
                    displayValue={
                      currentApplicant.obtained_marks !== null &&
                      currentApplicant.obtained_marks !== undefined
                        ? currentApplicant.obtained_marks
                        : "Not provided"
                    }
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Is Passed
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="is_passed"
                    value={currentApplicant.is_passed?.toString()}
                    displayValue={
                      currentApplicant.is_passed === 1 ||
                      currentApplicant.is_passed === "1"
                        ? "Yes"
                        : currentApplicant.is_passed === 0 ||
                          currentApplicant.is_passed === "0"
                        ? "No"
                        : "Not provided"
                    }
                    options={[
                      { value: "1", label: "Yes" },
                      { value: "0", label: "No" },
                    ]}
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Qualifying School
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="qualifying_school"
                    value={currentApplicant.qualifying_school}
                    displayValue={
                      schools.find(
                        (q) =>
                          q.value ===
                          currentApplicant.qualifying_school?.toString()
                      )?.label || "Not provided"
                    }
                    onUpdate={handleUpdate}
                    options={schools}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Exam Centre
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="exam_centre"
                    value={currentApplicant.exam_centre}
                    displayValue={
                      currentApplicant.exam_centre || "Not provided"
                    }
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Date of Testing
                  </label>
                  <Input
  type="date"
  value={dateOfTest.split("T")[0]} // YYYY-MM-DD format
  onChange={async (e) => {
    const newDate = e.target.value;
    if (!currentApplicant?.id) return;

    try {
      if (currentApplicant.stage === "screening" && currentApplicant.exam_sessions?.[0]) {
        await updateStudent(currentApplicant.id, {
          exam_sessions: [
            { ...currentApplicant.exam_sessions[0], date_of_test: newDate },
          ],
        });
      } else {
        await updateStudent(currentApplicant.id, { date_of_test: newDate });
      }
      await handleUpdate();
    } catch (err) {
      console.error("Failed to update date of test", err);
    }
  }}
  className="h-8 text-xs"
/>

                </div>
              </div>
            </div>

            {/* --- LEARNING & CULTURAL FIT ROUNDS --- */}
            <div className="grid grid-cols-1 gap-6">
              <div className="col-span-full w-full">
                <InlineSubform
                  title="Learning Round"
                  studentId={currentApplicant.id}
                  initialData={currentApplicant.learning_rounds || []}
                  fields={[
                    {
                      name: "learning_round_status",
                      label: "Status",
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
                    { name: "comments", label: "Comments", type: "text" },
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
                  initialData={currentApplicant.cultural_fit_rounds || []}
                  fields={[
                    {
                      name: "cultural_fit_status",
                      label: "Status",
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
                    { name: "comments", label: "Comments", type: "text" },
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
                      field="campus"
                      displayValue={
                        campus.find(
                          (q) => q.value === currentApplicant.campus?.toString()
                        )?.label || "Not provided"
                      }
                      onUpdate={handleUpdate}
                      options={campus}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Offer Letter Status
                    </label>
                    <EditableCell
                      applicant={currentApplicant}
                      field="offer_letter_status"
                      displayValue={
                        currentApplicant.offer_letter_status || "Not provided"
                      }
                      onUpdate={handleUpdate}
                      options={[
                        { value: "Pending", label: "Pending" },
                        { value: "Sent", label: "Sent" },
                        { value: "Accepted", label: "Accepted" },
                        { value: "Rejected", label: "Rejected" },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Onboarded Status
                    </label>
                    <EditableCell
                      applicant={currentApplicant}
                      field="onboarded_status"
                      displayValue={
                        currentApplicant.onboarded_status || "Not provided"
                      }
                      onUpdate={handleUpdate}
                      options={[
                        { value: "Not Joined", label: "Not Joined" },
                        { value: "Joined", label: "Joined" },
                        { value: "Deferred", label: "Deferred" },
                        { value: "Rejected", label: "Rejected" },
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold">Notes</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Final Notes
                    </label>
                    <EditableCell
                      applicant={currentApplicant}
                      field="final_notes"
                      displayValue={
                        currentApplicant.final_notes || "No final notes"
                      }
                      onUpdate={handleUpdate}
                    />
                  </div>
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
