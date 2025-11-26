import { useState, useEffect, useMemo } from "react";
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
import { Calendar } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EditableCell } from "./applicant-table/EditableCell";
import { useToast } from "@/hooks/use-toast";
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
  getAllStates,
  getBlocksByDistrict,
  getDistrictsByState,
  getAllStages
} from "@/utils/api";
import { states } from "@/utils/mockApi";
import { InlineSubform } from "@/components/Subform";
import { Input } from "@/components/ui/input";
import StageDropdown, {
  STAGE_STATUS_MAP,
} from "./applicant-table/StageDropdown";
import { Value } from "@radix-ui/react-select";

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
  const { toast } = useToast();
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
  const [stages, setStages] = useState<any[]>([]);
  const [stateOptions, setStateOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [districtOptions, setDistrictOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [blockOptions, setBlockOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);

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

  // Helper to convert state name to state code (if needed)
  const getStateCodeFromNameOrCode = (value: string) => {
    if (!value) return null;

    // Check if it's already a state_code (starts with "S-")
    if (value.startsWith("S-")) {
      return value;
    }

    // Try to find the state_code by matching the name
    const stateOption = stateOptions.find(
      (opt) => opt.label.toUpperCase() === value.toUpperCase()
    );

    return stateOption ? stateOption.value : value;
  };

  // Helper to convert district name to district code (if needed)
  const getDistrictCodeFromNameOrCode = (value: string) => {
    if (!value) return null;

    // Check if it's already a district_code (starts with "D-")
    if (value.startsWith("D-")) {
      return value;
    }

    // Try to find the district_code by matching the name
    const districtOption = districtOptions.find(
      (opt) => opt.label.toUpperCase() === value.toUpperCase()
    );

    return districtOption ? districtOption.value : value;
  };

  // Fetch states on modal open
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const statesRes = await getAllStates();
        const statesData = statesRes?.data || statesRes || [];
        const mappedStates = statesData.map((s: any) => ({
          value: s.state_code,
          label: s.state_name,
        }));
        setStateOptions(mappedStates);
      } catch (error) {
        // console.error("Failed to fetch states:", error);
        setStateOptions(states);
      }
    };

    if (isOpen) {
      fetchStates();
    }
  }, [isOpen]);

  // Initialize selected state and district from applicant data
  useEffect(() => {
    if (applicant?.id) {
      setCurrentApplicant(applicant);
      if (applicant.state) {
        const stateCode = getStateCodeFromNameOrCode(applicant.state);
        setSelectedState(stateCode);
      }
      if (applicant.district) {
        const districtCode = getDistrictCodeFromNameOrCode(applicant.district);
        setSelectedDistrict(districtCode);
      }
    }
  }, [applicant]); //, stateOptions, districtOptions

  // Fetch student data on modal open
  useEffect(() => {
    if (isOpen && applicant?.id) {
      const fetchStudent = async () => {
        try {
          const response = await getStudentById(applicant.id);
          let updated: any = response;
          if (response && typeof response === "object" && "data" in response) {
            updated = (response as any).data;
          }
          if (updated?.id) {
            setCurrentApplicant(updated);
            if (updated.state) {
              const stateCode = getStateCodeFromNameOrCode(updated.state);
              setSelectedState(stateCode);
            }
            if (updated.district) {
              const districtCode = getDistrictCodeFromNameOrCode(
                updated.district
              );
              setSelectedDistrict(districtCode);
            }
          } else {
            // console.error("Invalid response - no ID found:", response);
          }
        } catch (err) {
          // console.error("Failed to fetch student data", err);
        }
      };
      fetchStudent();
    }
  }, [isOpen, applicant?.id, refreshKey, stateOptions, districtOptions]);

  // Fetch dropdowns data
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
          stagesRes,
        ] = await Promise.all([
          getAllCasts(),
          getAllQualification(),
          getAllStatuses(),
          getAllSchools(),
          getCampusesApi(),
          getAllQuestionSets(),
          getAllStages(),
        ]);

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
        setStages((stagesRes || []).map((s: any) => ({
          id: s.id,
          name: s.stage_name,
        })));
      } catch (err) {
        // console.error("Failed to load dropdown data", err);
      }
    }

    if (isOpen) fetchDropdowns();
  }, [isOpen]);

  // Set joining date from current applicant
  // useEffect(() => {
  //   if (currentApplicant?.joining_date) {
  //     setJoiningDate(currentApplicant.joining_date.split("T")[0]);
  //   }
  // }, [currentApplicant?.joining_date]);

  // Fix: Load joining date from nested final_decisions if available
  useEffect(() => {
    const jd =
      currentApplicant?.final_decisions?.[0]?.joining_date ||
      currentApplicant?.joining_date ||
      "";
    setJoiningDate(jd ? jd.split("T")[0] : "");
  }, [currentApplicant]);

  // Fetch districts when state changes
  useEffect(() => {
    if (!selectedState) {
      setDistrictOptions([]);
      setBlockOptions([]);
      return;
    }

    const fetchDistricts = async () => {
      setIsLoadingDistricts(true);
      try {
        const districtsRes = await getDistrictsByState(selectedState);
        const districts = districtsRes?.data || districtsRes || [];
        const mappedDistricts = districts.map((d: any) => ({
          value: d.district_code,
          label: d.district_name,
        }));
        setDistrictOptions(mappedDistricts);
      } catch (err) {
        // console.error("Failed to fetch districts:", err);
        setDistrictOptions([]);
      } finally {
        setIsLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, [selectedState]);

  // Fetch blocks when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setBlockOptions([]);
      return;
    }

    const fetchBlocks = async () => {
      setIsLoadingBlocks(true);
      try {
        const blocksRes = await getBlocksByDistrict(selectedDistrict);
        const blocks = blocksRes?.data || blocksRes || [];
        const mappedBlocks = blocks.map((b: any) => ({
          value: b.block_code,
          label: b.block_name,
        }));
        setBlockOptions(mappedBlocks);
      } catch (err) {
        // console.error("Failed to fetch blocks:", err);
        setBlockOptions([]);
      } finally {
        setIsLoadingBlocks(false);
      }
    };

    fetchBlocks();
  }, [selectedDistrict]);

  const handleFinalDecisionUpdate = async (field: string, value: any) => {
    if (!currentApplicant?.id) return;

    try {
      // Fetch latest data to ensure we have all current values
      const response = await getStudentById(currentApplicant.id);
      let latestData: any = response;
      if (response && typeof response === "object" && "data" in response) {
        latestData = (response as any).data;
      }

      const existingDecision = latestData?.final_decisions?.[0] || {};

      // Get the current joining_date - prioritize the state value
      let currentJoiningDate = joiningDate;
      if (!currentJoiningDate && existingDecision.joining_date) {
        currentJoiningDate = existingDecision.joining_date.split("T")[0];
      }

      // Create payload with ALL existing values preserved
      const payload: Record<string, any> = {
        student_id: currentApplicant.id,
        id: existingDecision.id,
        // Preserve ALL existing values
        offer_letter_status: existingDecision.offer_letter_status ?? null,
        onboarded_status: existingDecision.onboarded_status ?? null,
        final_notes: existingDecision.final_notes ?? null,
        joining_date: currentJoiningDate || null,
        stage_id: existingDecision.stage_id ?? null,
      };

      // Override with the new value being updated
      if (field === "joining_date") {
        payload.joining_date = value !== "" ? value : null;
      } else {
        payload[field] = value;
      }

      // Determine stage_id based on offer_letter_status and onboarded_status
      let offerLetterStatus = payload.offer_letter_status;
      let onboardedStatus = payload.onboarded_status;

      // Find stage IDs by name
      const finalDecisionStage = stages.find(s => s.name === "Final Decision");
      const onboardedStage = stages.find(s => s.name === "Onboarded");

      let newStageId = payload.stage_id; // Keep existing stage by default

      if (offerLetterStatus != null && onboardedStatus != null) {
        // Both offer letter and onboarded exist -> stage 5 (Onboarded)
        newStageId = onboardedStage?.id || 5;
      } else if (offerLetterStatus != null && onboardedStatus == null) {
        // Only offer letter exists -> stage 4 (Final Decision)
        newStageId = finalDecisionStage?.id || 4;
      } else if (onboardedStatus != null) {
        // Only onboarded exists -> stage 5 (Onboarded)
        newStageId = onboardedStage?.id || 5;
      }
      // else: keep existing stage (newStageId remains payload.stage_id)

      payload.stage_id = newStageId;

      await submitFinalDecision(payload);

      // Update local state immediately
      setCurrentApplicant((prev) => ({
        ...prev,
        final_decisions: [
          {
            ...existingDecision,
            [field]: value,
            joining_date: field === "joining_date" ? value : currentJoiningDate,
            stage_id: newStageId,
          },
        ],
      }));

      // Also update joiningDate state if that's what was changed
      if (field === "joining_date") {
        setJoiningDate(value);
      }

      // Refresh to get latest data from server
      await handleUpdate();
    } catch (err) {
      console.error("Failed to update final decision", err);
      toast({
        title: "Error",
        description: "Failed to update final decision. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  const handleUpdate = async () => {
    if (!currentApplicant?.id) return;
    try {
      const response = await getStudentById(currentApplicant.id);

      let updated: any = response;
      if (response && typeof response === "object" && "data" in response) {
        updated = (response as any).data;
      }

      if (updated?.id) {
        setCurrentApplicant(updated);
      } else {
        // console.error("Invalid response - no ID found:", response);
      }
    } catch (err) {
      // console.error("Failed to refresh applicant", err);
    }
  };

  const getLabel = (
    options: { value: string; label: string }[],
    id: any,
    defaultLabel = "Not provided"
  ) => {
    return (
      options.find((o) => o.value === id?.toString())?.label || defaultLabel
    );
  };

  const handleStateChange = async (value: string) => {
    setSelectedState(value);
    setSelectedDistrict(null);
    setDistrictOptions([]);
    setBlockOptions([]);

    await handleUpdate();
  };

  const handleDistrictChange = async (value: string) => {
    setSelectedDistrict(value);
    setBlockOptions([]);

    await handleUpdate();
  };

  const examSession = currentApplicant.exam_sessions?.[0] ?? null;

  const screeningFields = [
    {
      name: "status",
      label: "Status *",
      type: "select",
      options: [
        { value: "Screening Test Pass", label: "Screening Test Pass" },
        { value: "Screening Test Fail", label: "Screening Test Fail" },
        {
          value: "Created Student Without Exam",
          label: "Created Student Without Exam",
        },
      ],
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
      name: "school_id",
      label: "Qualifying School",
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

  const initialScreeningData =
    currentApplicant.exam_sessions?.map((session) => ({
      id: session.id,
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
      exam_centre: session.exam_centre || "",
      date_of_test: session.date_of_test?.split("T")[0] || "",
    })) || [];

  if (!applicant) return null;

  const screeningSubmit =
    API_MAP?.screening?.submit ??
    (async (payload: any) => {
      // console.error("API_MAP.screening.submit is not available", payload);
      throw new Error("screening submit API not available");
    });

  const screeningUpdate =
    API_MAP?.screening?.update ??
    (async (id: any, payload: any) => {
      // console.error("API_MAP.screening.update is not available", id, payload);
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
                    Cast
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="cast_id"
                    value={currentApplicant.cast_id}
                    displayValue={getLabel(castes, currentApplicant.cast_id)}
                    onUpdate={handleUpdate}
                    options={castes}
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
                    State
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="state"
                    displayValue={getLabel(
                      stateOptions,
                      currentApplicant.state
                    )}
                    value={currentApplicant.state}
                    onUpdate={handleStateChange}
                    options={stateOptions}
                  />
                </div>
                {/* <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    City
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="city"
                    displayValue={currentApplicant.city || "Not provided"}
                    onUpdate={handleUpdate}
                  />
                </div> */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    District
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="district"
                    displayValue={
                      isLoadingDistricts
                        ? "Loading..."
                        : getLabel(districtOptions, currentApplicant.district)
                    }
                    value={currentApplicant.district}
                    onUpdate={handleDistrictChange}
                    options={districtOptions}
                    disabled={!selectedState || isLoadingDistricts}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Block
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="block"
                    displayValue={
                      isLoadingBlocks
                        ? "Loading..."
                        : getLabel(blockOptions, currentApplicant.block)
                    }
                    value={currentApplicant.block}
                    onUpdate={handleUpdate}
                    options={blockOptions}
                    disabled={!selectedDistrict || isLoadingBlocks}
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

            {/* Learning & Cultural Fit Rounds */}
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
                    value={
                      joiningDate ||
                      currentApplicant.final_decisions?.[0]?.joining_date?.split(
                        "T"
                      )[0] ||
                      ""
                    }
                    onChange={(e) => setJoiningDate(e.target.value)}
                    onBlur={async () => {
                      try {
                        // Only update if user changed
                        await handleFinalDecisionUpdate(
                          "joining_date",
                          joiningDate || null
                        );

                        // Immediately sync
                        setCurrentApplicant((prev) => ({
                          ...prev,
                          final_decisions: [
                            {
                              ...(prev.final_decisions?.[0] || {}),
                              joining_date: joiningDate,
                            },
                          ],
                        }));
                      } catch (err) {
                        // console.error("Failed to update joining date:", err);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold">Final Notes</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="mb-4">
                    <label className="text-sm font-medium text-muted-foreground">
                      Note
                    </label>
                    <EditableCell
                      applicant={currentApplicant}
                      field="final_notes"
                      value={
                        currentApplicant.final_decisions?.[0]?.final_notes || ""
                      }
                      displayValue={
                        currentApplicant.final_decisions?.[0]?.final_notes ||
                        "No final note"
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
                        await handleFinalDecisionUpdate("final_notes", value);
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Last Updated By
                    </label>
                    <EditableCell
                      applicant={currentApplicant}
                      field="last_status_updated_by"
                      displayValue={
                        currentApplicant.final_decisions?.[0]
                          ?.last_status_updated_by || "Not provided"
                      }
                      value={
                        currentApplicant.final_decisions?.[0]
                          ?.last_status_updated_by
                      }
                      onUpdate={handleUpdate}
                      disabled={true}
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

      {/* {showCommentsModal && (
        <ApplicantCommentsModal
          applicantId={currentApplicant.id || ""}
          applicantName={currentApplicant.name || ""}
          isOpen={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
        />
      )} */}
    </>
  );
}
